from fastapi import APIRouter
from pydantic import BaseModel
from src.libs.virt.list import list_virtual_machines, get_virtual_machine_read, get_virtual_machine_changes, __domain_to_dict__
from src.libs.virt.create import create_virtual_machine
import uuid
import libvirt


router = APIRouter(prefix="/{vm_name}/status", tags=["VM Status"])


@router.get("/")
async def get_vm_status(vm_name: str):
    vm = get_virtual_machine_read(vm_name)
    return {"found": vm is not None, "vm": {"status": __domain_to_dict__(vm)["state"]} if vm else None}

@router.post("/start")
async def start_vm(vm_name: str):
    vm = get_virtual_machine_changes(vm_name)
    if vm is None:
        return {"found": False, "vm": None}
    try:
        vm.create()
        return {"found": True, "vm": {"status": "started"}}
    except libvirt.libvirtError as e:
        return {"found": True, "error": str(e)}

@router.post("/stop")
async def stop_vm(vm_name: str):
    vm = get_virtual_machine_changes(vm_name)
    if vm is None:
        return {"found": False, "vm": None}
    try:
        vm.shutdown()
        return {"found": True, "vm": {"status": "stopped"}}
    except libvirt.libvirtError as e:
        return {"found": True, "error": str(e)}
    
@router.post("/restart")
async def restart_vm(vm_name: str):
    vm = get_virtual_machine_changes(vm_name)
    if vm is None:
        return {"found": False, "vm": None}
    try:
        vm.reboot(0)
        return {"found": True, "vm": {"status": "restarted"}}
    except libvirt.libvirtError as e:
        return {"found": True, "error": str(e)}

@router.post("/kill")
async def kill_vm(vm_name: str):
    vm = get_virtual_machine_changes(vm_name)
    if vm is None:
        return {"found": False, "vm": None}
    try:
        vm.destroy()
        return {"found": True, "vm": {"status": "killed"}}
    except libvirt.libvirtError as e:
        return {"found": True, "error": str(e)}