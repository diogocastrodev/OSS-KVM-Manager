from fastapi import APIRouter, FastAPI, WebSocket, WebSocketDisconnect
import asyncio, json, logging
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

log = logging.getLogger("sshterm")

@router.websocket("/ws")
async def ws_sshterm(ws: WebSocket):
    await ws.accept()
    log.info("ws accepted from %s", ws.client)

    try:
        # Accept handshake as either text or bytes (robust)
        msg = await asyncio.wait_for(ws.receive(), timeout=5)
        raw = msg.get("text") or (msg.get("bytes").decode("utf-8") if msg.get("bytes") else "")
        hello = json.loads(raw)

        target_host = hello.get("targetHost")
        target_port = int(hello.get("targetPort", 22))

        if not target_host:
            await ws.close(code=1008, reason="missing targetHost")
            return

        log.info("connecting to VM ssh %s:%s", target_host, target_port)

        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(target_host, target_port),
            timeout=5,
        )

        await ws.send_text("OK")
        log.info("connected to VM ssh, starting pipe")

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

    except Exception as e:
        # THIS is what will tell us why it closes
        log.exception("sshterm ws crashed: %r", e)
        try:
            await ws.send_text(f"ERR {type(e).__name__}: {e}")
        except Exception:
            pass
        try:
            await ws.close(code=1011, reason="internal error")
        except Exception:
            pass