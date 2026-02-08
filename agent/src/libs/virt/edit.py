from typing import Optional
import libvirt
import os
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
    vcpus: Optional[int]
    memory_mb: Optional[int]
    disk_gb: Optional[int]
    bandwidth_mbps: Optional[BandWidthConfig]


# TODO: This was not tested at all!
def edit_virtual_machine(vm_id: str, req: VMEdiRequest) -> bool:
    """
    Docstring for edit_virtual_machine
    
    :param vm_id: Unique identifier for the VM
    :type vm_id: str
    :param req: VM edit specifications
    :type req: VMEdiRequest
    :return: True if the VM was successfully edited, False otherwise
    :rtype: bool
    """
    conn = libvirt.openReadOnly(os.getenv('LIBVIRT_URI', 'qemu:///system')) # Establish read-only connection
    try:
        domain = conn.lookupByName(vm_id) # Lookup the VM by its name
        if not domain:
            print(f"VM with ID {vm_id} not found.")
            return False
        
        # Edit vCPUs
        if req.vcpus is not None:
            domain.setVcpusFlags(req.vcpus, libvirt.VIR_DOMAIN_AFFECT_LIVE | libvirt.VIR_DOMAIN_AFFECT_CONFIG)
        
        # Edit Memory
        if req.memory_mb is not None:
            memory_kb = req.memory_mb * 1024
            domain.setMemoryFlags(memory_kb, libvirt.VIR_DOMAIN_AFFECT_LIVE | libvirt.VIR_DOMAIN_AFFECT_CONFIG)
        
        # Resize Disk
        if req.disk_gb is not None:
            vda = get_vda_path(domain)
            if vda:
                new_size_bytes = req.disk_gb * 1024 * 1024 * 1024
                domain.blockResize(vda, new_size_bytes, libvirt.VIR_DOMAIN_AFFECT_CONFIG)

        # Bandwidth
        if req.bandwidth_mbps is not None:
            domain.updateDeviceFlags(f"""
    <interface type='network'>
            <bandwidth>
                <inbound average='{__mbps_to_kibps__(req.bandwidth_mbps.in_avg)}' peak='{__mbps_to_kibps__(req.bandwidth_mbps.in_peak)}' burst='{__mbps_to_kibps__(req.bandwidth_mbps.in_burst)}' />
                <outbound average='{__mbps_to_kibps__(req.bandwidth_mbps.out_avg)}' peak='{__mbps_to_kibps__(req.bandwidth_mbps.out_peak)}' burst='{__mbps_to_kibps__(req.bandwidth_mbps.out_burst)}' />
            </bandwidth>
        </interface>
            """, libvirt.VIR_DOMAIN_AFFECT_LIVE | libvirt.VIR_DOMAIN_AFFECT_CONFIG)
        
        return True
    except libvirt.libvirtError as e:
        print(f"Failed to edit VM {vm_id}: {e}")
        return False
    finally:
        conn.close()