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
    generate_cloud_init_iso_alt
)
from src.libs.virt.create import get_connection
from src.libs.cloudimgs.check import ensure_cloudimg
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
    status: Optional[libvirt.virDomain] = create_virtual_machine(
        vm_id=body.vm_id,
        vm=body.vm,
    )
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
        ensure_shutoff(domain)

        # 2) find current vda disk path + current size
        vda_path = get_vda_path(domain)
        current_disk_gb = get_virtual_size_gb(vda_path)

        # 3) ensure base cloud image exists locally (download from Fastify if needed)
        base_path = ensure_cloudimg(body.os.os_name, body.os.os_url, body.os.os_checksum)

        # 4) overwrite vda with a full clone, keeping current disk size
        full_clone_cloud_image_into_volume(str(base_path), vda_path, current_disk_gb)

        # 5) create seed ISO
        seed_iso_path = f"/tmp/{vm_id}-seed.iso"

        meta = MetaTemplate(vm_id=vm_id, hostname=body.host.hostname)
        net = NetworkingTemplate(
            mac_address=body.network.mac_address,
            ip_cidr=body.network.ip_cidr,
            gateway=body.network.gateway,
            dns_servers=body.network.dns_servers,
        )

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

        generate_cloud_init_iso_alt(meta, net, user, seed_iso_path)

        # 6) attach seed ISO (replace old one if any)
        detach_seed_iso(domain, "sda")
        attach_seed_iso(domain, seed_iso_path, "sda")

        # 7) boot
        domain.create()

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
        return {"found": True, "error": str(e)}
    finally:
        conn.close()

@router.post("/{vm_id}/finalize")
async def finalize_vm(vm_id: str, body: FinalizeRequest):
    conn = get_connection()
    try:
        try:
            domain = conn.lookupByName(vm_id)
        except libvirt.libvirtError:
            raise HTTPException(404, f"Domain '{vm_id}' not found")

        seed_path = body.seed_iso_path or f"/tmp/{vm_id}-seed.iso"

        # Detach only that seed iso if it matches; if it doesn't match, detach nothing.
        detached = detach_cdroms(domain, only_source_file=seed_path)

        # If you want “detach any cdrom no matter what”, use:
        # detached = detach_cdroms(domain, only_source_file=None)

        deleted = False
        if body.delete_iso:
            p = Path(seed_path).resolve()

            # Safety: only allow deleting files under /tmp
            if str(p).startswith("/tmp/") and p.exists():
                p.unlink()
                deleted = True

        return {
            "found": True,
            "vm": {
                "status": "finalized",
                "detached_cdroms": [
                    {
                        "target_dev": d["target_dev"],
                        "target_bus": d["target_bus"],
                        "source_file": d["source_file"],
                    }
                    for d in detached
                ],
                "seed_iso_deleted": deleted,
                "seed_iso_path": seed_path,
            }
        }

    finally:
        conn.close()

@router.delete("/{vm_id}")
async def delete_vm(vm_id: str):
    vm = get_virtual_machine_changes(vm_id)
    if vm is None:
        return {"found": False, "vm": None}
    try:
        vm.undefineFlags(libvirt.VIR_DOMAIN_UNDEFINE_MANAGED_SAVE | libvirt.VIR_DOMAIN_UNDEFINE_SNAPSHOTS_METADATA)
        return {"found": True, "vm": {"status": "deleted"}}
    except libvirt.libvirtError as e:
        return {"found": True, "error": str(e)}
    

router.include_router(vm_status_router)
