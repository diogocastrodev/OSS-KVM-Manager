import xml.etree.ElementTree as ET
import libvirt
import os
from typing import List, Dict, Optional

def get_vda_path(domain) -> str:
    root = ET.fromstring(domain.XMLDesc(0))
    for disk in root.findall("./devices/disk"):
        if disk.get("device") != "disk":
            continue
        target = disk.find("target")
        source = disk.find("source")
        if target is not None and target.get("dev") == "vda" and source is not None:
            p = source.get("file")
            if p:
                return p
    raise RuntimeError("Could not find vda disk path in domain XML")


def detach_seed_iso(domain, target_dev="sda"):
    minimal = f"""
<disk device='cdrom'>
  <target dev='{target_dev}' bus='sata'/>
</disk>
""".strip()
    try:
        domain.detachDeviceFlags(minimal, libvirt.VIR_DOMAIN_AFFECT_CONFIG)
    except libvirt.libvirtError:
        pass

def attach_seed_iso(domain, seed_iso_path: str, target_dev="sda"):
    cdrom_xml = f"""
<disk type='file' device='cdrom'>
  <driver name='qemu' type='raw'/>
  <source file='{seed_iso_path}'/>
  <target dev='{target_dev}' bus='sata'/>
  <readonly/>
</disk>
""".strip()
    domain.attachDeviceFlags(cdrom_xml, libvirt.VIR_DOMAIN_AFFECT_CONFIG)

def list_cdrom_devices(domain) -> List[Dict[str, Optional[str]]]:
    """
    Returns a list of cdrom device dicts: {target_dev, target_bus, source_file, xml}
    """
    root = ET.fromstring(domain.XMLDesc(0))
    out = []
    for disk in root.findall("./devices/disk"):
        if disk.get("device") != "cdrom":
            continue

        target = disk.find("target")
        source = disk.find("source")

        target_dev = target.get("dev") if target is not None else None
        target_bus = target.get("bus") if target is not None else None
        source_file = source.get("file") if source is not None else None

        # libvirt wants a device XML snippet to detach; serialize this <disk> node
        xml = ET.tostring(disk, encoding="unicode")
        out.append({
            "target_dev": target_dev,
            "target_bus": target_bus,
            "source_file": source_file,
            "xml": xml,
        })
    return out


def detach_cdroms(domain, only_source_file: Optional[str] = None) -> List[Dict[str, Optional[str]]]:
    """
    Detach cdrom devices. If only_source_file is provided, detaches only that CDROM.
    Returns the list of detached devices info.
    """
    cdroms = list_cdrom_devices(domain)
    to_detach = [
        d for d in cdroms
        if (only_source_file is None or d["source_file"] == only_source_file)
    ]

    if not to_detach:
        return []

    flags = libvirt.VIR_DOMAIN_AFFECT_CONFIG
    if domain.isActive():
        flags |= libvirt.VIR_DOMAIN_AFFECT_LIVE

    detached = []
    for d in to_detach:
        # Using the exact XML from the domain is the most reliable way
        domain.detachDeviceFlags(d["xml"], flags)
        detached.append(d)

    return detached
