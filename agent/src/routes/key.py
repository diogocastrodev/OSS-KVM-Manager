from fastapi import APIRouter
from pathlib import Path
from os import getenv

router = APIRouter(prefix="/info", tags=["Key"])

@router.get("/key")
async def get_public_key():
    """
    Endpoint to retrieve the agent's public key.
    """

    PUBLIC_KEY_PEM = Path(getenv("AGENT_PUBLIC_KEY_PATH", "/etc/agent/agent_public.pem")).read_text()
    return {"public_key": PUBLIC_KEY_PEM}