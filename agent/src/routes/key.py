from fastapi import APIRouter
from pathlib import Path

router = APIRouter(prefix="/info", tags=["Key"])

@router.get("/key")
async def get_public_key():
    """
    Endpoint to retrieve the agent's public key.
    """

    PUBLIC_KEY_PEM = Path("/etc/agent/agent_public.pem").read_text()
    return {"public_key": PUBLIC_KEY_PEM}