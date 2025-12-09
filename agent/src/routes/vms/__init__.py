from fastapi import APIRouter
from pydantic import BaseModel
from src.libs.virt.list import list_virtual_machines, get_virtual_machine_read, get_virtual_machine_changes, __domain_to_dict__
from src.libs.virt.create import create_virtual_machine
from .status import router as vm_status_router
import uuid
import libvirt

router = APIRouter(prefix="/vms", tags=["VMs Management"])

class VMCreateRequest(BaseModel):
    name: str
    cpu: int
    memory: int
    disk_size: int
    network: int
        

@router.get("/")
async def list_vms():
    listed_vms = list_virtual_machines()
    return {"vms": listed_vms, "total": len(listed_vms)}

@router.get("/{vm_name}")
async def get_vm(vm_name: str):
    vm = get_virtual_machine_read(vm_name)
    return {"found": vm is not None, "vm": __domain_to_dict__(vm) if vm else None}

@router.post("/")
async def create_vm(body: VMCreateRequest):
    status = create_virtual_machine(
        name=body.name,
        cpu=body.cpu,
        memory=body.memory,
        disk_size=body.disk_size,
        network=body.network
    )
    if status is None:
        # Send 500 error
        return {"error": "Failed to create VM"}, 500
    return {"vm": {
        "uuid": status.UUIDString(),
        "name": status.name(),
        "state": "running",  # or look it up if you want
    }}

@router.delete("/{vm_name}")
async def delete_vm(vm_name: str):
    vm = get_virtual_machine_changes(vm_name)
    if vm is None:
        return {"found": False, "vm": None}
    try:
        vm.undefineFlags(libvirt.VIR_DOMAIN_UNDEFINE_MANAGED_SAVE | libvirt.VIR_DOMAIN_UNDEFINE_SNAPSHOTS_METADATA)
        return {"found": True, "vm": {"status": "deleted"}}
    except libvirt.libvirtError as e:
        return {"found": True, "error": str(e)}
    

router.include_router(vm_status_router)
