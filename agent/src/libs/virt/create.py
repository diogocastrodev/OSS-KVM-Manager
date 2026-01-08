from typing import Optional
import libvirt
import os
from pydantic import BaseModel

from .connection import get_connection
from pathlib import Path
from dotenv import load_dotenv
from src.models.create_vm import VMCreateRequest

load_dotenv()  # Load environment variables from .env file



def __mbps_to_kibps__(mbps: float) -> int:
    """
    Docstring for __mbps_to_kibps__
    
    :param mbps: Megabits per second
    :type mbps: float
    :return: Kilobits per second
    :rtype: int
    """
    return int(mbps * 1_000_000 / 8 / 1024)

def create_virtual_machine(req: VMCreateRequest) -> Optional[libvirt.virDomain]:
    """
    Docstring for create_virtual_machine
    
    :param vm_id: Unique identifier for the VM
    :type vm_id: str
    :param host: Host configuration for VM creation
    :type host: CreateVMHost
    :param vm: VM specifications
    :type vm: CreateVMParams
    :param os_path: Path to the OS image (if any)
    :type os_path: Optional[str]
    :return: The created VM domain object or None if creation failed
    """
    conn = get_connection() # Establish read-only connection
    try:
        template_dir = Path(__file__).resolve().parent / 'templates' # Path to templates directory
        try: 
            pool = conn.storagePoolLookupByName('default')
            if not pool.isActive():
                pool.create(0)
        except libvirt.libvirtError:
            # Create Pool if it does not exist
            disk_pool_xml = template_dir / 'storage_pool_template.xml' # Load Pool XML template
            print(f"Defining storage pool from {disk_pool_xml}")
            with open(disk_pool_xml, 'r') as file:
                pool_xml = file.read() # Read template
            pool = conn.storagePoolDefineXML(pool_xml, 0) # Define the storage pool
            pool.build(0) # Build the storage pool
            pool.create(0) # Create the storage pool
            pool.setAutostart(True) # Set autostart            
        
        # Create storage volume for the VM
        vm_template_disk_xml = template_dir / 'vm_disk_template.xml' # Load Disk XML template
        with vm_template_disk_xml.open('r') as file:
            disk_xml = file.read() # Read template

        disk_xml = disk_xml.format(name=req.vm_id, disk_gb=req.vm.disk_size) # Fill in template values

        # Save this XML for tests purposes
        with open(f"/tmp/{req.vm_id}_disk.xml", 'w') as file:
            file.write(disk_xml)
        
        pool = conn.storagePoolLookupByName('default') # Get default storage pool
        vol = pool.createXML(disk_xml, 0) # Create storage volume

        if os.getenv("SYSTEM", "linux").lower() == "macos":
            vm_template_xml = template_dir / 'macos' / 'vm_template.xml' # Load VM XML template
        else:
            vm_template_xml = template_dir / 'vm_template.xml' # Load VM XML template

        with open(vm_template_xml, 'r') as file:
            vm_xml = file.read() # Read template

        network_params = {
            'net_in_kbps': __mbps_to_kibps__(req.vm.network.in_avg_mbps),
            'net_in_peak_kbps': __mbps_to_kibps__(req.vm.network.in_peak_mbps),
            'net_in_burst_kb': __mbps_to_kibps__(req.vm.network.in_burst_mbps),
            'net_out_kbps': __mbps_to_kibps__(req.vm.network.out_avg_mbps),
            'net_out_peak_kbps': __mbps_to_kibps__(req.vm.network.out_peak_mbps),
            'net_out_burst_kb': __mbps_to_kibps__(req.vm.network.out_burst_mbps)
        }
        vm_xml = vm_xml.format(name=req.vm_id, vcpus=req.vm.vcpus, memory_mib=req.vm.memory, disk_path=vol.path(), mac=req.vm.mac, **network_params) # Fill in template values
        
        # Save this XML for tests purposes
        with open(f"/tmp/{req.vm_id}_vm.xml", 'w') as file:
            file.write(vm_xml)

        domain = conn.defineXML(vm_xml) # Define the VM

        domain.create() # Start the VM
        
        return domain
    except libvirt.libvirtError as e:
        print(f"Libvirt error: {e}")
        return None
    finally:
        conn.close() # Ensure connection is closed