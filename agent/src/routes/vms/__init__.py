import traceback
from typing import Optional
from fastapi import APIRouter, HTTPException
from src.libs.virt.list import list_virtual_machines, get_virtual_machine_read, get_virtual_machine_changes, __domain_to_dict__
from src.libs.virt.create import create_virtual_machine
from .status import router as vm_status_router
import libvirt
from src.models.create_vm import VMCreateRequest
from src.models.format_vm import VMFormatBody
from src.models.finalize_vm import FinalizeRequest
from src.libs.virt.helpers import ensure_shutoff, get_virtual_size_gb
from src.libs.virt.format import attach_seed_iso, detach_seed_iso, get_vda_path, detach_cdroms
from src.libs.virt.cloud_init import (
    MetaTemplate,
    NetworkingTemplate,
    UserKeyTemplate,
    UserPasswordTemplate,
    generate_cloud_init_iso_alt,
    vm_uses_user_network
)
from src.libs.virt.create import get_connection
from src.libs.cloudimgs.check import CLOUDIMG_DIR, ensure_cloudimg
from src.libs.virt.clone_cloudimg import full_clone_cloud_image_into_volume
from pathlib import Path

router = APIRouter(prefix="/vms", tags=["VMs Management"])
        

@router.get("/")
async def list_vms():
    listed_vms = list_virtual_machines()
    return {"vms": listed_vms, "total": len(listed_vms)}

@router.get("/{vm_id}")
async def get_vm(vm_id: str):
    vm = get_virtual_machine_read(vm_id)
    return {"found": vm is not None, "vm": __domain_to_dict__(vm) if vm else None}

@router.post("/")
async def create_vm(body: VMCreateRequest):
    status: Optional[libvirt.virDomain] = create_virtual_machine(body)
    if status is None:
        # Send 500 error
        raise HTTPException(status_code=500, detail="New Error Found")
    return {"vm": {
        "uuid": status.UUIDString(),
        "name": status.name(),
        "state": "running",  # or look it up if you want
    }}

@router.post("/{vm_id}/format")
async def format_vm_disk(vm_id: str, body: VMFormatBody):
    # Optional: only implement cloud for now
    if body.mode and body.mode.value == "iso":
        raise HTTPException(501, "ISO mode not implemented yet")

    if body.host is None or body.network is None:
        raise HTTPException(400, "host and network are required for cloud mode")

    # auth: exactly one
    has_key = bool(body.host.public_key)
    has_pw = bool(body.host.password)
    if has_key == has_pw:
        raise HTTPException(400, "Provide exactly one of host.public_key or host.password")

    conn = get_connection()
    try:
        # NOTE: this looks up libvirt domain by *name*.
        # In your create_vm you used name=req.host.hostname, so vm_id must match that or this will 404.
        try:
            domain = conn.lookupByName(vm_id)
        except libvirt.libvirtError:
            # fallback: try hostname if that's your libvirt domain name
            try:
                domain = conn.lookupByName(body.host.hostname)
            except libvirt.libvirtError:
                raise HTTPException(404, f"Domain not found for '{vm_id}' (or hostname '{body.host.hostname}')")

        # 1) stop it
        if domain.isActive():
            domain.destroy()
        print("Step 1: done")

        # 2) find current vda disk path + current size
        vda_path = get_vda_path(domain)
        current_disk_gb = get_virtual_size_gb(conn, vda_path)
        print("Step 2: done")

        print("Step 3: ensuring image", body.os.os_name, body.os.os_url, "into", CLOUDIMG_DIR)
        try:
            base_path = ensure_cloudimg(body.os.os_name, body.os.os_url, body.os.os_checksum)
        except Exception as e:
            print("Step 3 ERROR:", type(e).__name__, str(e))
            raise
        print("Step 3: done", base_path)

        # 4) overwrite vda with a full clone, keeping current disk size
        full_clone_cloud_image_into_volume(str(base_path), vda_path, current_disk_gb)
        print("Step 4: done")

        # 5) create seed ISO
        seed_iso_path = f"/tmp/{vm_id}-seed.iso"
        print("Step 5: generating cloud-init ISO at", seed_iso_path)

        meta = MetaTemplate(vm_id=vm_id, hostname=body.host.hostname)
        net = NetworkingTemplate(
            mac_address=body.network.mac_address,
            ip_cidr=body.network.ip_cidr,
            gateway=body.network.gateway,
            dns_servers=body.network.dns_servers,
        )
        net_for_iso = net
        if vm_uses_user_network(domain):
            print("User-mode networking detected (macOS): forcing DHCP (skipping network-config)")
            net_for_iso = None

        if has_key:
            user = UserKeyTemplate(
                hostname=body.host.hostname,
                username=body.host.username,
                ssh_public_key=body.host.public_key,
            )
        else:
            user = UserPasswordTemplate(
                hostname=body.host.hostname,
                username=body.host.username,
                password=body.host.password,
            )

        generate_cloud_init_iso_alt(meta, net_for_iso, user, seed_iso_path)
        print("Step 5: done")

        # 6) attach seed ISO (replace old one if any)
        detach_seed_iso(domain, "sda")
        attach_seed_iso(domain, seed_iso_path, "sda")
        print("Step 6: done")

        # 7) boot
        domain.create()
        print("Step 7: done")

        return {
            "found": True,
            "vm": {
                "status": "formatted",
                "disk": vda_path,
                "disk_gb": current_disk_gb,
                "seed_iso": seed_iso_path,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")
    finally:
        conn.close()

@router.post("/{vm_id}/finalize")
async def finalize_vm(vm_id: str):
    conn = get_connection()
    try:
        domain = conn.lookupByName(vm_id)

        # not ready yet
        if domain.isActive():
            raise HTTPException(409, "VM still running; cloud-init likely not finished yet")

        seed_iso = f"/tmp/{vm_id}-seed.iso"

        # detach seed
        detach_seed_iso(domain, seed_iso_path=seed_iso)  # your robust detach-by-source
        # boot again
        domain.create()

        return {"status": "finalized"}
    finally:
        conn.close()

@router.delete("/{vm_id}")
async def delete_vm(vm_id: str):
    conn = get_connection()
    try:
        try:
            dom = conn.lookupByName(vm_id)
        except libvirt.libvirtError:
            raise HTTPException(404, f"Domain '{vm_id}' not found")

        # Capture paths before undefine
        disk_path = get_vda_path(dom)
        seed_iso_path = f"/tmp/{vm_id}-seed.iso"

        # Hard power-off (fast)
        if dom.isActive():
            dom.destroy()

        # Undefine (remove from libvirt)
        flags = 0
        # add flags only if your libvirt supports them
        try:
            flags |= libvirt.VIR_DOMAIN_UNDEFINE_MANAGED_SAVE
        except AttributeError:
            pass
        try:
            flags |= libvirt.VIR_DOMAIN_UNDEFINE_SNAPSHOTS_METADATA
        except AttributeError:
            pass
        try:
            flags |= libvirt.VIR_DOMAIN_UNDEFINE_NVRAM
        except AttributeError:
            pass

        if flags:
            dom.undefineFlags(flags)
        else:
            dom.undefine()

        # Delete disk + seed ISO files (optional but usually desired for temporary VMs)
        if disk_path:
            try:
                Path(disk_path).unlink()
            except FileNotFoundError:
                pass

        try:
            Path(seed_iso_path).unlink()
        except FileNotFoundError:
            pass

        return {"found": True, "vm": {"status": "deleted", "disk_deleted": bool(disk_path)}}

    except libvirt.libvirtError as e:
        raise HTTPException(500, f"Error deleting VM: {str(e)}")
    finally:
        conn.close()
    

router.include_router(vm_status_router)
