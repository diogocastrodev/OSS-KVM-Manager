import libvirt
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection_read_only(uri=os.getenv("LIBVIRT_URI", "qemu:///session")):
    try:
        conn = libvirt.openReadOnly(uri)
        if conn is None:
            raise Exception(f"Failed to open connection to {uri}")
        return conn
    except libvirt.libvirtError as e:
        raise Exception(f"Libvirt error: {e}")
    
def get_connection(uri=os.getenv("LIBVIRT_URI", "qemu:///session")):
    try:
        conn = libvirt.open(uri)
        if conn is None:
            raise Exception(f"Failed to open connection to {uri}")
        return conn
    except libvirt.libvirtError as e:
        raise Exception(f"Libvirt error: {e}")