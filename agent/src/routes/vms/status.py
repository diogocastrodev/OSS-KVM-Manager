from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.libs.virt.list import get_virtual_machine_read, get_virtual_machine_changes, __domain_to_dict__
import libvirt

router = APIRouter(prefix="/{vm_id}/status")

@router.get("/")
async def get_vm_status(vm_id: str):
    vm = get_virtual_machine_read(vm_id)
    return {"found": vm is not None, "vm": {"status": __domain_to_dict__(vm)["state"]} if vm else None}

@router.post("/start")
async def start_vm(vm_id: str):
    vm = get_virtual_machine_changes(vm_id)
    if vm is None:
        return {"found": False, "vm": None}, 404
    try:
        vm.create()
        return {"found": True, "vm": {"status": "started"}}, 200
    except libvirt.libvirtError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop")
async def stop_vm(vm_id: str):
    vm = get_virtual_machine_changes(vm_id)
    if vm is None:
        return {"found": False, "vm": None}, 404
    try:
        vm.shutdown()
        return {"found": True, "vm": {"status": "stopped"}}, 200
    except libvirt.libvirtError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/restart")
async def restart_vm(vm_id: str):
    vm = get_virtual_machine_changes(vm_id)
    if vm is None:
        return {"found": False, "vm": None}, 404
    try:
        vm.reboot(0)
        return {"found": True, "vm": {"status": "restarted"}}, 200
    except libvirt.libvirtError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/kill")
async def kill_vm(vm_id: str):
    vm = get_virtual_machine_changes(vm_id)
    if vm is None:
        return {"found": False, "vm": None}, 404
    try:
        vm.destroy()
        return {"found": True, "vm": {"status": "killed"}}, 200
    except libvirt.libvirtError as e:
        raise HTTPException(status_code=500, detail=str(e))