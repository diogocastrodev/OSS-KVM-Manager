from fastapi import APIRouter
from .vms import router as vms
from .health import router as health
from .uuid import router as uuid
from .info import router as info
from .key import router as key
from .my_ip import router as my_ip
from .sshterm import router as sshterm_app

api_router = APIRouter(prefix="/v1")

api_router.include_router(health)
api_router.include_router(uuid)
api_router.include_router(vms)
api_router.include_router(info)
api_router.include_router(key)
api_router.include_router(my_ip)
api_router.include_router(my_ip)
api_router.include_router(sshterm_app)