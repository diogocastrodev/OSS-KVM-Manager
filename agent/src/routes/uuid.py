from fastapi import APIRouter
import uuid

router = APIRouter(prefix="/uuid", tags=["UUID Gen"])

@router.get("/")
async def random_uuid():
    return {"uuid": str(uuid.uuid4())}
