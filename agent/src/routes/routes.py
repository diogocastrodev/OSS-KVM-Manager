from fastapi import APIRouter
from .vms import router as vms
from .health import router as health
from .uuid import router as uuid

api_router = APIRouter(prefix="/v1")

api_router.include_router(health)
api_router.include_router(uuid)
api_router.include_router(vms)