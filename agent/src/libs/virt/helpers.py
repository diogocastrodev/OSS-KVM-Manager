import time
import json
import shutil
import subprocess
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

def get_virtual_size_gb(disk_path: str) -> int:
    qemu_img = shutil.which("qemu-img")
    if not qemu_img:
        raise RuntimeError("qemu-img not found on PATH")
    out = subprocess.check_output([qemu_img, "info", "--output=json", disk_path], text=True)
    info = json.loads(out)
    bytes_ = int(info["virtual-size"])
    return max(1, math.ceil(bytes_ / (1024**3)))