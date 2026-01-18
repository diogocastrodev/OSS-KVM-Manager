import time
import libvirt
import math

def ensure_shutoff(domain, wait_s: int = 20):
    if not domain.isActive():
        return
    domain.shutdown()
    deadline = time.time() + wait_s
    while time.time() < deadline:
        if not domain.isActive():
            return
        time.sleep(0.5)
    domain.destroy()

def get_virtual_size_gb(conn: libvirt.virConnect, disk_path: str) -> int:
    """
    Return the virtual capacity of a disk (in GiB) using libvirt,
    avoiding direct filesystem access to the qcow2.
    """
    vol = conn.storageVolLookupByPath(disk_path)  # works for pool-backed files
    _type, capacity_bytes, _allocation_bytes = vol.info()
    return max(1, math.ceil(capacity_bytes / (1024**3)))