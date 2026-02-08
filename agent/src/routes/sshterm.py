from fastapi import APIRouter, FastAPI, WebSocket, WebSocketDisconnect
import asyncio, json
import libvirt
import os

router = APIRouter(prefix="/sshterm", tags=["SSH Terminal"])
    
def get_vm_ip_from_libvirt(vm_name: str) -> str:
    conn = libvirt.open("qemu:///system")
    dom = conn.lookupByName(vm_name)

    # Best effort: try DHCP lease source first (works for libvirt networks),
    # or AGENT if you run qemu-guest-agent inside the VM.
    # Examples in libvirt-python use interfaceAddresses(...SRC_LEASE). :contentReference[oaicite:3]{index=3}
    ifaces = dom.interfaceAddresses(libvirt.VIR_DOMAIN_INTERFACE_ADDRESSES_SRC_LEASE, 0)
    # if you prefer guest agent:
    # ifaces = dom.interfaceAddresses(libvirt.VIR_DOMAIN_INTERFACE_ADDRESSES_SRC_AGENT, 0)  # needs guest agent :contentReference[oaicite:4]{index=4}

    for _, info in (ifaces or {}).items():
        for addr in info.get("addrs", []):
            if addr.get("type") == libvirt.VIR_IP_ADDR_TYPE_IPV4:
                ip = addr.get("addr")
                if ip:
                    return ip

    raise RuntimeError("No VM IP found")

@router.get("/ping")
def ping(): return {"ok": True}

@router.websocket("/ws")
async def ws_sshterm(ws: WebSocket):
    # TODO: auth, validate token, check if user can access this VM, etc.
    await ws.accept()

    hello = json.loads(await ws.receive_text())
    vm_host = hello["targetHost"]
    vm_port = int(hello.get("targetPort", 22))

    reader, writer = await asyncio.open_connection(vm_host, vm_port)
    await ws.send_text("OK")
    vm_public_id = hello.get("vm")
    if not vm_public_id:
        await ws.close(code=1008, reason="missing vm")
        return

    vm_ip = get_vm_ip_from_libvirt(vm_public_id)

    reader, writer = await asyncio.open_connection(vm_ip, 22)
    await ws.send_text("OK")

    async def ws_to_tcp():
        try:
            while True:
                data = await ws.receive_bytes()
                writer.write(data)
                await writer.drain()
        except WebSocketDisconnect:
            pass
        finally:
            try:
                writer.close()
                await writer.wait_closed()
            except Exception:
                pass

    async def tcp_to_ws():
        try:
            while True:
                chunk = await reader.read(32768)
                if not chunk:
                    break
                await ws.send_bytes(chunk)
        finally:
            try:
                await ws.close()
            except Exception:
                pass

    await asyncio.gather(ws_to_tcp(), tcp_to_ws())
