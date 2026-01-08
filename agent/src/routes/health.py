from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["Health Check"])

@router.get("/")
def health():
    return {"status": "ok"}, 200
