import libvirt
import os
from .connection import get_connection
from pathlib import Path
from dotenv import load_dotenv

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

def create_virtual_machine(name, cpu, memory, disk_size, network):
    """
    Docstring for create_virtual_machine
    
    :param name: Name of the virtual machine
    :param cpu: vCPUs
    :param memory: Memory in MB
    :param disk_size: Disk size in GB
    :param network: Network type
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

        disk_xml = disk_xml.format(name=name, disk_gb=disk_size) # Fill in template values

        # Save this XML for tests purposes
        with open(f"/tmp/{name}_disk.xml", 'w') as file:
            file.write(disk_xml)
        
        pool = conn.storagePoolLookupByName('default') # Get default storage pool
        vol = pool.createXML(disk_xml, 0) # Create storage volume

        if os.getenv("SYSTEM", "linux").lower() == "macos":
            vm_template_xml = template_dir / 'macos' / 'vm_template.xml' # Load VM XML template
        else:
            vm_template_xml = template_dir / 'vm_template.xml' # Load VM XML template

        with open(vm_template_xml, 'r') as file:
            vm_xml = file.read() # Read template

        test_network_params = {
            'net_in_kbps': __mbps_to_kibps__(10),
            'net_in_peak_kbps': __mbps_to_kibps__(15),
            'net_in_burst_kb': 1024,
            'net_out_kbps': __mbps_to_kibps__(10),
            'net_out_peak_kbps': __mbps_to_kibps__(15),
            'net_out_burst_kb': 1024
        }
        vm_xml = vm_xml.format(name=name, vcpus=cpu, memory_mib=memory, disk_path=vol.path(), **test_network_params) # Fill in template values
        
        # Save this XML for tests purposes
        with open(f"/tmp/{name}_vm.xml", 'w') as file:
            file.write(vm_xml)

        domain = conn.defineXML(vm_xml) # Define the VM
        domain.create() # Start the VM
        
        return domain
    except libvirt.libvirtError as e:
        print(f"Libvirt error: {e}")
        return None
    finally:
        conn.close() # Ensure connection is closed