from fastapi import APIRouter, Request


router = APIRouter(prefix="/my-ip", tags=["UUID Gen"])


@router.get("/")
def whats_my_ip(request: Request):
    xff = request.headers.get("x-forwarded-for")
    if xff:
        # first IP in the list is usually the original client
        ip = xff.split(",")[0].strip()
    else:
        ip = request.client.host
    return {"ip": ip}