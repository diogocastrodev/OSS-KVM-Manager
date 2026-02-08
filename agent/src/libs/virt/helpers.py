import time
import libvirt
import math
import xml.etree.ElementTree as ET
from typing import Optional

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

def find_attached_cdrom_iso(domain) -> Optional[str]:
    xml = domain.XMLDesc(0)
    root = ET.fromstring(xml)

    # Look for CDROM disks with a file source
    for disk in root.findall("./devices/disk"):
        if disk.get("device") != "cdrom":
            continue
        src = disk.find("source")
        if src is None:
            continue
        iso_path = src.get("file")  # for file-backed ISO
        if iso_path:
            return iso_path

    return None

def find_attached_seed_iso(domain) -> Optional[str]:
    xml = domain.XMLDesc(0)
    root = ET.fromstring(xml)

    # Look for disks with a file source that looks like a seed ISO
    for disk in root.findall("./devices/disk"):
        if disk.get("device") != "cdrom":
            continue
        src = disk.find("source")
        if src is None:
            continue
        iso_path = src.get("file")  # for file-backed ISO
        if iso_path and f"{domain.name()}-seed" in iso_path:
            return iso_path

    return None