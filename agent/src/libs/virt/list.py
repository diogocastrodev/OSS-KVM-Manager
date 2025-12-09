import libvirt
from .connection import get_connection_read_only, get_connection


def __domain_to_dict__(domain):
    state, max_mem, memory, vcpus, cpu_time = domain.info()

    # Optional: map libvirt state ints to strings
    state_map = {
        libvirt.VIR_DOMAIN_NOSTATE: "nostate",
        libvirt.VIR_DOMAIN_RUNNING: "running",
        libvirt.VIR_DOMAIN_BLOCKED: "blocked",
        libvirt.VIR_DOMAIN_PAUSED: "paused",
        libvirt.VIR_DOMAIN_SHUTDOWN: "shutdown",
        libvirt.VIR_DOMAIN_SHUTOFF: "shutoff",
        libvirt.VIR_DOMAIN_CRASHED: "crashed",
        libvirt.VIR_DOMAIN_PMSUSPENDED: "pmsuspended",
    }
    state_str = state_map.get(state, f"unknown({state})")

    return {
        "name": domain.name(),
        "state": state_str,
        "max_memory_kib": max_mem,
        "memory_kib": memory,
        "vcpus": vcpus,
        "cpu_time_ns": cpu_time,
    }

def list_virtual_machines():
    """
    List All Virtual Machines
    
    Parameters:
        None
    Returns:
        List of VM names
    """
    conn = get_connection_read_only() # Establish read-only connection
    try:
        domains = conn.listAllDomains() # Get all domains
        vm_names = [domain.name() for domain in domains] # Extract only names
        return vm_names # Return list of names
    except libvirt.libvirtError: # In case of error
        return [] # Return empty list on error
    finally:
        conn.close() # Ensure connection is closed

def get_virtual_machine_read(vm_name):
    """
    Get Virtual Machine by Name

    Parameters:
        vm_name (str) - Name of the virtual machine
    Returns:
        libvirt.virDomain object or None if not found
    """
    conn = get_connection_read_only() # Establish read-only connection
    try:
        domain = conn.lookupByName(vm_name) # Lookup domain by name
        if domain is None:
            return None
        return domain # Return the domain object as dict
    except libvirt.libvirtError: # If not found or error
        return None # Return None
    finally:
        conn.close() # Ensure connection is closed

def get_virtual_machine_changes(vm_name):
    """
    Get Virtual Machine by Name

    Parameters:
        vm_name (str) - Name of the virtual machine
    Returns:
        libvirt.virDomain object or None if not found
    """
    conn = get_connection() # Establish read-only connection
    try:
        domain = conn.lookupByName(vm_name) # Lookup domain by name
        if domain is None:
            return None
        return domain # Return the domain object as dict
    except libvirt.libvirtError: # If not found or error
        return None # Return None
    finally:
        conn.close() # Ensure connection is closed