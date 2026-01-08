import xml.etree.ElementTree as ET
import libvirt

def get_pool_dir(pool: libvirt.virStoragePool) -> str:
    root = ET.fromstring(pool.XMLDesc(0))
    path_el = root.find("./target/path")
    if path_el is None or not path_el.text:
        raise RuntimeError("Storage pool has no target/path")
    return path_el.text.strip()