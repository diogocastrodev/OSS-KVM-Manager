import base64, time, uuid
from urllib.parse import urlencode
import requests

from cryptography.hazmat.primitives.serialization import load_pem_private_key
from pathlib import Path

PRIVATE_KEY_PEM = Path("/etc/agent/agent_private.pem").read_bytes()
PRIVATE_KEY = load_pem_private_key(PRIVATE_KEY_PEM, password=None)

AGENT_ID = "agent-1"

def sign_headers(method: str, path_with_query: str, range_header: str = "") -> dict:
    ts = str(int(time.time()))
    nonce = str(uuid.uuid4())
    canonical = f"{method}\n{path_with_query}\n{ts}\n{nonce}\n{range_header}\n"

    sig = PRIVATE_KEY.sign(canonical.encode("utf-8"))
    sig_b64 = base64.b64encode(sig).decode("ascii")

    return {
        "X-Agent-Id": AGENT_ID,
        "X-Timestamp": ts,
        "X-Nonce": nonce,
        "X-Signature": sig_b64,
    }

def agent_get(base_url: str, path: str, params: dict | None = None, range_header: str = ""):
    if params:
        qs = urlencode(params, doseq=True)
        path_with_query = f"{path}?{qs}"
    else:
        path_with_query = path

    headers = sign_headers("GET", path_with_query, range_header=range_header)
    if range_header:
        headers["Range"] = range_header

    return requests.get(base_url + path, params=params, headers=headers, timeout=60)
