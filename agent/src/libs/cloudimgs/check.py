import os
import re
import time
from pathlib import Path
from typing import Optional

from src.libs.crypto.crypto import agent_get

CLOUDIMG_DIR = Path(os.getenv("CLOUDIMG_DIR", "./.cache/cloudimgs")).resolve()
_SAFE_NAME = re.compile(r"^[a-zA-Z0-9._-]+$")


def ensure_cloudimg_dir() -> None:
    try:
        CLOUDIMG_DIR.mkdir(parents=True, exist_ok=True)
    except PermissionError as e:
        raise PermissionError(
            f"Cannot create CLOUDIMG_DIR={CLOUDIMG_DIR}. Set CLOUDIMG_DIR to a writable path."
        ) from e


def _validate_name(os_name: str) -> str:
    if not _SAFE_NAME.match(os_name):
        raise ValueError("Invalid os_name (allowed: letters, numbers, dot, underscore, dash)")
    return os_name


def _img_path(os_name: str) -> Path:
    _validate_name(os_name)
    return CLOUDIMG_DIR / f"{os_name}.qcow2"


def get_cloudimg_path(os_name: str) -> Path:
    p = _img_path(os_name)
    if not p.exists():
        raise FileNotFoundError(f"Cloud image '{os_name}' not found at {p}")
    return p


def _acquire_lock(lock_path: Path, timeout_s: int = 300) -> None:
    deadline = time.time() + timeout_s
    while True:
        try:
            fd = os.open(str(lock_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.close(fd)
            return
        except FileExistsError:
            if time.time() > deadline:
                raise TimeoutError(f"Timed out waiting for lock: {lock_path}")
            time.sleep(0.25)


def _release_lock(lock_path: Path) -> None:
    try:
        lock_path.unlink()
    except FileNotFoundError:
        pass


def download_cloudimg(os_name: str, url: str, sha256: Optional[str] = None) -> Path:
    ensure_cloudimg_dir()

    dst = _img_path(os_name)
    part = dst.with_suffix(dst.suffix + ".part")
    lock = dst.with_suffix(dst.suffix + ".lock")

    _acquire_lock(lock)
    try:
        if dst.exists():
            return dst

        if part.exists():
            part.unlink()

        with agent_get(url, stream=True, timeout=(10, 300)) as r:
            r.raise_for_status()

            ct = (r.headers.get("Content-Type") or "").lower()
            if "application/json" in ct:
                raise ValueError(f"URL returned JSON (did you forget /download?): {url}")

            h = None
            if sha256:
                import hashlib
                h = hashlib.sha256()

            with open(part, "wb") as f:
                for chunk in r.iter_content(chunk_size=1024 * 1024):
                    if not chunk:
                        continue
                    f.write(chunk)
                    if h:
                        h.update(chunk)

        if sha256 and h:
            got = h.hexdigest().lower()
            if got != sha256.lower():
                part.unlink(missing_ok=True)
                raise ValueError(f"SHA256 mismatch for {os_name}: expected {sha256}, got {got}")

        os.replace(part, dst)
        return dst

    finally:
        part.unlink(missing_ok=True)
        _release_lock(lock)


def ensure_cloudimg(os_name: str, url: str, sha256: Optional[str] = None) -> Path:
    try:
        return get_cloudimg_path(os_name)
    except FileNotFoundError:
        return download_cloudimg(os_name, url, sha256)
