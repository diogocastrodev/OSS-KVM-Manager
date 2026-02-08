from __future__ import annotations

from typing import Optional, List
from dataclasses import dataclass, field
import libvirt
import os
import xml.etree.ElementTree as ET
from pydantic import BaseModel

from .format import get_vda_path
from .create import __mbps_to_kibps__


class BandWidthConfig(BaseModel):
    in_avg: float
    out_avg: float
    in_burst: float
    out_burst: float
    in_peak: float
    out_peak: float


class VMEdiRequest(BaseModel):
    # current targets
    vcpus: Optional[int] = None
    memory_mb: Optional[int] = None

    # max/headroom targets (persistent config)
    vcpus_max: Optional[int] = None
    memory_max_mb: Optional[int] = None

    disk_gb: Optional[int] = None
    bandwidth_mbps: Optional[BandWidthConfig] = None

    # optional: pick NIC by MAC if you have multiple interfaces
    nic_mac: Optional[str] = None


@dataclass
class EditResult:
    success: bool
    reboot_required: bool = False
    warnings: List[str] = field(default_factory=list)


def _lookup_domain(conn: libvirt.virConnect, vm_id: str) -> libvirt.virDomain:
    """
    Accept UUID or name. Try UUID first (if you put <uuid> in XML), otherwise name.
    """
    try:
        return conn.lookupByUUIDString(vm_id)
    except libvirt.libvirtError:
        return conn.lookupByName(vm_id)


def _find_iface_elem_anyns(root: ET.Element, mac: Optional[str]):
    """
    Namespace-agnostic interface finder.
    Returns: (iface_elem or None, list_of_found_macs)
    """
    # tag may be "interface" or "{ns}interface"
    ifaces = [e for e in root.iter() if e.tag.split("}")[-1] == "interface"]
    if not ifaces:
        return None, []

    found_macs: List[str] = []
    for iface in ifaces:
        mac_el = next((c for c in iface if c.tag.split("}")[-1] == "mac"), None)
        if mac_el is not None and mac_el.get("address"):
            found_macs.append(mac_el.get("address"))

    if mac:
        mac_l = mac.lower()
        for iface in ifaces:
            mac_el = next((c for c in iface if c.tag.split("}")[-1] == "mac"), None)
            if mac_el is not None and (mac_el.get("address") or "").lower() == mac_l:
                return iface, found_macs
        return None, found_macs

    return ifaces[0], found_macs


def _set_bandwidth_on_iface(iface: ET.Element, bw: BandWidthConfig):
    # Remove existing <bandwidth> if present (namespace-agnostic)
    old = next((c for c in iface if c.tag.split("}")[-1] == "bandwidth"), None)
    if old is not None:
        iface.remove(old)

    bw_el = ET.SubElement(iface, "bandwidth")
    ET.SubElement(bw_el, "inbound", {
        "average": str(__mbps_to_kibps__(bw.in_avg)),
        "peak":    str(__mbps_to_kibps__(bw.in_peak)),
        "burst":   str(__mbps_to_kibps__(bw.in_burst)),
    })
    ET.SubElement(bw_el, "outbound", {
        "average": str(__mbps_to_kibps__(bw.out_avg)),
        "peak":    str(__mbps_to_kibps__(bw.out_peak)),
        "burst":   str(__mbps_to_kibps__(bw.out_burst)),
    })


def _apply_vcpu_changes(domain: libvirt.virDomain, req: VMEdiRequest, result: EditResult) -> None:
    # 1) Set persistent max if requested (config-only; cannot set live max)
    if req.vcpus_max is not None:
        domain.setVcpusFlags(
            req.vcpus_max,
            libvirt.VIR_DOMAIN_AFFECT_CONFIG | libvirt.VIR_DOMAIN_VCPU_MAXIMUM
        )

    # 2) Set current
    if req.vcpus is None:
        return

    # Ensure persistent max >= requested current
    config_max = domain.vcpusFlags(libvirt.VIR_DOMAIN_AFFECT_CONFIG | libvirt.VIR_DOMAIN_VCPU_MAXIMUM)
    if req.vcpus > config_max:
        domain.setVcpusFlags(
            req.vcpus,
            libvirt.VIR_DOMAIN_AFFECT_CONFIG | libvirt.VIR_DOMAIN_VCPU_MAXIMUM
        )
        result.warnings.append(
            f"Raised persistent vcpu max to {req.vcpus} to satisfy requested current vcpus."
        )

    # Always update persistent current
    domain.setVcpusFlags(req.vcpus, libvirt.VIR_DOMAIN_AFFECT_CONFIG)

    # Apply live only if running and within live max
    if domain.isActive():
        live_max = domain.vcpusFlags(libvirt.VIR_DOMAIN_AFFECT_LIVE | libvirt.VIR_DOMAIN_VCPU_MAXIMUM)
        if req.vcpus <= live_max:
            domain.setVcpusFlags(req.vcpus, libvirt.VIR_DOMAIN_AFFECT_LIVE)
        else:
            result.reboot_required = True
            result.warnings.append(
                f"Requested vcpus={req.vcpus} exceeds live max={live_max}. Config updated; reboot required."
            )


def _apply_memory_changes(domain: libvirt.virDomain, req: VMEdiRequest, result: EditResult) -> None:
    if req.memory_mb is None:
        return

    desired_kib = int(req.memory_mb) * 1024

    # domain.maxMemory() returns the domain maximum memory setting (KiB) for the persistent config.
    # If that fails, fallback to live max (if active) or desired.
    try:
        config_max_kib = int(domain.maxMemory())
    except Exception:
        config_max_kib = int(domain.info()[1]) if domain.isActive() else desired_kib

    # If requested current > config max, raise config max FIRST
    if desired_kib > config_max_kib:
        domain.setMemoryFlags(
            desired_kib,
            libvirt.VIR_DOMAIN_AFFECT_CONFIG | libvirt.VIR_DOMAIN_MEM_MAXIMUM
        )

    # Now safe to set persistent current
    domain.setMemoryFlags(desired_kib, libvirt.VIR_DOMAIN_AFFECT_CONFIG)

    # Live change only if running and within live max
    if domain.isActive():
        live_max_kib = int(domain.info()[1])  # maxMemory (KiB) for live domain
        if desired_kib <= live_max_kib:
            domain.setMemoryFlags(desired_kib, libvirt.VIR_DOMAIN_AFFECT_LIVE)
        else:
            result.reboot_required = True
            result.warnings.append(
                f"Memory change requires reboot: requested {req.memory_mb}MiB > live max {live_max_kib // 1024}MiB"
            )


def _apply_disk_resize(domain: libvirt.virDomain, req: VMEdiRequest, result: EditResult) -> None:
    if req.disk_gb is None:
        return

    vda = get_vda_path(domain)
    if not vda:
        result.warnings.append("Disk resize requested but vda device not found.")
        return

    new_size_bytes = int(req.disk_gb) * 1024 * 1024 * 1024

    if not domain.isActive():
        result.reboot_required = True
        result.warnings.append(
            "Disk resize requested while VM is inactive. Consider resizing the qcow2/volume offline, then boot."
        )
        return

    domain.blockResize(vda, new_size_bytes, libvirt.VIR_DOMAIN_BLOCK_RESIZE_BYTES)
    result.warnings.append(
        "Disk block device resized. You still need to expand partitions/filesystem inside the guest."
    )


def _apply_bandwidth(domain: libvirt.virDomain, vm_id: str, req: VMEdiRequest, result: EditResult) -> None:
    if req.bandwidth_mbps is None:
        return

    def apply_bw(xml_flags: int, update_flags: int, label: str):
        xml = domain.XMLDesc(xml_flags)
        root = ET.fromstring(xml)

        iface, found_macs = _find_iface_elem_anyns(root, req.nic_mac)
        if iface is None:
            # Dump XML for debugging
            try:
                with open(f"/tmp/{vm_id}_{label}_dumpxml.xml", "w", encoding="utf-8") as f:
                    f.write(xml)
            except Exception:
                pass

            raise RuntimeError(
                f"No interface found for bandwidth update ({label}). "
                f"requested nic_mac={req.nic_mac}, found macs={found_macs}. "
                f"Saved XML to /tmp/{vm_id}_{label}_dumpxml.xml"
            )

        _set_bandwidth_on_iface(iface, req.bandwidth_mbps)
        domain.updateDeviceFlags(ET.tostring(iface, encoding="unicode"), update_flags)

    # CONFIG update only if persistent
    if domain.isPersistent():
        try:
            apply_bw(libvirt.VIR_DOMAIN_XML_INACTIVE, libvirt.VIR_DOMAIN_AFFECT_CONFIG, "config")
        except RuntimeError as e:
            # Don't fail the whole request; keep going and try LIVE
            result.warnings.append(str(e))
    else:
        result.warnings.append("Domain is transient (not persistent); skipping bandwidth AFFECT_CONFIG update.")

    # LIVE update if running
    if domain.isActive():
        apply_bw(0, libvirt.VIR_DOMAIN_AFFECT_LIVE, "live")


def edit_virtual_machine(vm_id: str, req: VMEdiRequest) -> bool:
    r = edit_virtual_machine_detailed(vm_id, req)
    for w in r.warnings:
        print(f"[edit_virtual_machine] {w}")
    if r.reboot_required:
        print("[edit_virtual_machine] Reboot required for some changes to take effect.")
    return r.success


def edit_virtual_machine_detailed(vm_id: str, req: VMEdiRequest) -> EditResult:
    conn = libvirt.open(os.getenv("LIBVIRT_URI", "qemu:///system"))
    if conn is None:
        return EditResult(success=False, warnings=["Failed to open libvirt connection."])

    try:
        domain = _lookup_domain(conn, vm_id)
        if not domain:
            return EditResult(success=False, warnings=[f"VM with ID {vm_id} not found."])

        result = EditResult(success=True)

        _apply_vcpu_changes(domain, req, result)
        _apply_memory_changes(domain, req, result)
        _apply_disk_resize(domain, req, result)
        _apply_bandwidth(domain, vm_id, req, result)

        return result

    except libvirt.libvirtError as e:
        print(f"Failed to edit VM {vm_id}: {e}")
        return EditResult(success=False, warnings=[str(e)])
    except Exception as e:
        print(f"Failed to edit VM {vm_id}: {e}")
        return EditResult(success=False, warnings=[str(e)])
    finally:
        try:
            conn.close()
        except Exception:
            pass
