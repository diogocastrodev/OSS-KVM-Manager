import os
import shutil
import subprocess
from pathlib import Path

def clone_cloudimg(pool_dir: str, vm_name: str, base_image_path: str, disk_gb: int) -> str:
    qemu_img = shutil.which("qemu-img")
    if not qemu_img:
        raise RuntimeError("qemu-img not found on PATH")

    pool_path = Path(pool_dir)
    pool_path.mkdir(parents=True, exist_ok=True)

    vm_disk_path = pool_path / f"{vm_name}.qcow2"
    tmp_path = pool_path / f".{vm_name}.qcow2.tmp"

    if tmp_path.exists():
        tmp_path.unlink()

    # Clone base -> temp file
    subprocess.run([qemu_img, "convert", "-O", "qcow2", base_image_path, str(tmp_path)], check=True)

    # Resize to requested virtual size
    subprocess.run([qemu_img, "resize", str(tmp_path), f"{disk_gb}G"], check=True)

    # Atomic move into place
    os.replace(tmp_path, vm_disk_path)

    return str(vm_disk_path)

def full_clone_cloud_image_into_volume(base_image_path: str, vol_path: str, disk_gb: int) -> None:
    qemu_img = shutil.which("qemu-img")
    if not qemu_img:
        raise RuntimeError("qemu-img not found on PATH")

    base = Path(base_image_path)
    if not base.exists():
        raise FileNotFoundError(f"Base cloud image not found: {base_image_path}")

    # Preserve current ownership/mode of the libvirt-created volume file
    st = os.stat(vol_path)
    uid, gid, mode = st.st_uid, st.st_gid, st.st_mode

    tmp_path = f"{vol_path}.tmp"
    if os.path.exists(tmp_path):
        os.remove(tmp_path)

    # 1) Clone base -> temp file (standalone qcow2)
    subprocess.run([qemu_img, "convert", "-O", "qcow2", str(base), tmp_path], check=True)

    # 2) Resize to requested size
    subprocess.run([qemu_img, "resize", tmp_path, f"{disk_gb}G"], check=True)

    # 3) Atomic replace into the volume path
    os.replace(tmp_path, vol_path)

    # 4) Restore owner/perms (important when libvirt/qemu runs as another user)
    try:
        os.chown(vol_path, uid, gid)
        os.chmod(vol_path, mode)
    except PermissionError:
        # If you're unprivileged (e.g. qemu:///session), this may be fine to ignore.
        pass
