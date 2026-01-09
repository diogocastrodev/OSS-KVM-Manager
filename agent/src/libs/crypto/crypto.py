import os
import base64, time, uuid
from urllib.parse import urlencode, urlsplit
import requests

from cryptography.hazmat.primitives.serialization import load_pem_private_key
from pathlib import Path

PRIVATE_KEY_PEM = Path(os.getenv("AGENT_PRIVATE_KEY_PATH", "./keys/agent_private.pem")).read_bytes()
PRIVATE_KEY = load_pem_private_key(PRIVATE_KEY_PEM, password=None)

AGENT_ID = os.getenv("AGENT_ID", "agent-1")


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


def agent_get(url: str, params: dict | None = None, range_header: str = "", **kwargs):
    """
    Signed GET request to a FULL url.
    Supports requests kwargs like stream=True, timeout=(10,300), etc.
    """
    u = urlsplit(url)

    # Build path+query exactly how Fastify verifies it.
    # We sign the query that requests will send (params) if provided.
    if params:
        qs = urlencode(params, doseq=True)
        path_with_query = u.path + "?" + qs
    else:
        path_with_query = u.path + (("?" + u.query) if u.query else "")

    headers = kwargs.pop("headers", {}) or {}
    headers.update(sign_headers("GET", path_with_query, range_header=range_header))
    if range_header:
        headers["Range"] = range_header

    # Default timeout if caller didn't provide one
    kwargs.setdefault("timeout", 60)

    return requests.get(url, params=params, headers=headers, **kwargs)
