from fastapi import APIRouter
import asyncio
import json
import subprocess
from typing import Any, Dict, List, Optional, Tuple
import shutil
import re
import struct
import socket
import psutil
import platform

router = APIRouter(prefix="/info", tags=["Info"])


# ---------------------------------------------------------------------------- #
#                                    Helpers                                   #
# ---------------------------------------------------------------------------- #
def _read_int(path: str) -> Optional[int]:
    """
    Reads an integer from a file. Returns None if the file doesn't exist or
    the content is invalid.
    
    :param path: File path
    :type path: str
    :return: Integer value or None
    :rtype: int | None
    """
    try:
        with open(path, "r", encoding="utf-8") as f:
            s = f.read().strip()
        if not s or s == "-1":
            return None
        return int(s)
    except Exception:
        return None


def _iface_link_speed_mbps(iface: str) -> Optional[int]:
    """
    Reads the link speed in Mbps for a given network interface on Linux.
    Returns None if not available.
    
    :param iface: Network interface name
    :type iface: str
    :return: Link speed in Mbps or None if not available
    :rtype: int | None
    """
    return _read_int(f"/sys/class/net/{iface}/speed")


def _tc_json() -> Dict[str, Any]:
    """
    Returns traffic control (tc) configuration as JSON.
    
    :return: Dictionary with qdisc, class, and filter information
    :rtype: Dict[str, Any]
    """
    def run_tc(args):
        try:
            p = subprocess.run(["tc", "-j"] + args, capture_output=True, text=True, timeout=2)
            if p.returncode == 0 and p.stdout.strip():
                return json.loads(p.stdout)
        except Exception:
            pass
        return []

    return {
        "qdisc": run_tc(["qdisc", "show"]),
        "class": run_tc(["class", "show"]),
        "filter": run_tc(["filter", "show"]),
    }


# ---------------------------- command helpers -------------------------------- #

def _run_json(cmd: List[str], timeout: int = 2) -> Any:
    """
    Runs a command and parses its JSON output. Returns None on failure.
    
    :param cmd: Command and arguments to run
    :type cmd: List[str]
    :param timeout: Timeout in seconds
    :type timeout: int
    :return: Parsed JSON output or None
    :rtype: Any
    """
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if p.returncode != 0 or not p.stdout.strip():
            return None
        return json.loads(p.stdout)
    except FileNotFoundError:
        return None
    except Exception:
        return None


def _run_text(cmd: List[str], timeout: int = 2) -> str:
    """
    Runs a command and returns its stdout as text. Returns empty string on failure.
    
    :param cmd: Command and arguments to run
    :type cmd: List[str]
    :param timeout: Timeout in seconds
    :type timeout: int
    :return: Stdout output as text or empty string on failure
    :rtype: str
    """
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if p.returncode != 0:
            return ""
        return p.stdout
    except Exception:
        return ""


def _parse_resolv_conf(path: str = "/etc/resolv.conf") -> Dict[str, Any]:
    """
    Parses /etc/resolv.conf to extract nameservers and search domains.
    
    :param path: Path to the resolv.conf file
    :type path: str
    :return: Dictionary with nameservers and search domains
    :rtype: Dict[str, Any]
    """
    nameservers: List[str] = []
    search: List[str] = []
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                parts = line.split()
                if parts[0] == "nameserver" and len(parts) >= 2:
                    nameservers.append(parts[1])
                elif parts[0] == "search" and len(parts) >= 2:
                    search.extend(parts[1:])
    except Exception:
        pass
    return {"nameservers": nameservers, "search": search}


def _resolvectl_per_link_dns() -> Dict[str, List[str]]:
    """
    Uses `resolvectl dns` to get per-link DNS servers (systemd-resolved).
    
    :return: Mapping of interface names to lists of DNS servers
    :rtype: Dict[str, List[str]]
    """
    out = _run_text(["resolvectl", "dns"])
    if not out:
        return {}
    per_link: Dict[str, List[str]] = {}
    for line in out.splitlines():
        line = line.strip()
        if line.startswith("Link ") and ":" in line and "(" in line and ")" in line:
            left, right = line.split(":", 1)
            iface = left.split("(", 1)[1].split(")", 1)[0]
            servers = right.strip().split()
            if servers:
                per_link[iface] = servers
    return per_link


# ---------------------------- gateway helpers -------------------------------- #

def _default_gateway_macos_with_iface() -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
    """
    Gets the default gateway and associated interface for both IPv4 and IPv6 on macOS.
    
    :return: Tuple of (gw4, gw6, iface4, iface6)
    :rtype: Tuple[str | None, str | None, str | None, str | None]
    """
    out4 = _run_text(["route", "-n", "get", "default"])
    gw4 = None
    iface4 = None
    m4 = re.search(r"gateway:\s+([0-9.]+)", out4)
    if m4:
        gw4 = m4.group(1)
    i4 = re.search(r"interface:\s+(\S+)", out4)
    if i4:
        iface4 = i4.group(1)

    out6 = _run_text(["route", "-n", "get", "-inet6", "default"])
    gw6 = None
    iface6 = None
    m6 = re.search(r"gateway:\s+([0-9a-fA-F:]+)", out6)
    if m6:
        gw6 = m6.group(1)
    i6 = re.search(r"interface:\s+(\S+)", out6)
    if i6:
        iface6 = i6.group(1)

    return gw4, gw6, iface4, iface6


def _default_gateway_linux_proc() -> Tuple[Optional[str], Optional[str]]:
    """
    Gets the default gateway for both IPv4 and IPv6 on Linux using /proc/net/route.
    
    :return: Tuple of (gw4, gw6)
    :rtype: Tuple[str | None, str | None]
    """
    gw4 = None
    try:
        with open("/proc/net/route", "r", encoding="utf-8") as f:
            next(f)  # header
            for line in f:
                parts = line.split()
                if len(parts) >= 3:
                    dst_hex = parts[1]
                    gw_hex = parts[2]
                    if dst_hex == "00000000":
                        gw_bytes = struct.pack("<L", int(gw_hex, 16))
                        gw4 = socket.inet_ntoa(gw_bytes)
                        break
    except Exception:
        pass

    # IPv6: best-effort; leave None
    gw6 = None
    return gw4, gw6


# ---------------------- unified network config collection --------------------- #

def collect_network_config() -> Dict[str, Any]:
    """
    Collects network configuration information from the system.
    
    :return: Dictionary with platform, interfaces, and meta information
    :rtype: Dict[str, Any]
    
    Example return:
      {
        "platform": "...",
        "interfaces": {
            "eth0": {
                "addresses": [...],
                "default_routes": [...],     # only if known
                "dns_nameservers": [...],    # only if known
                "state/mac/mtu": ...         # linux iproute2 path only
            },
            ...
        },
        "meta": {
            "default_routes": [...],     # all default routes found (may be multiple)
            "dns_effective": {...},      # from resolv.conf
            "dhcp": {...}                # best-effort hint
        }
      }
    """
    dns_effective = _parse_resolv_conf()
    system = platform.system().lower()

    has_ip = shutil.which("ip") is not None # iproute2 available

    # Linux
    if has_ip:
        addrs = _run_json(["ip", "-j", "addr"]) or []
        routes = _run_json(["ip", "-j", "route"]) or []

        per_iface: Dict[str, Any] = {}

        # addresses
        for iface in addrs:
            if not isinstance(iface, dict):
                continue
            name = iface.get("ifname")
            if not name:
                continue
            per_iface[name] = {
                "state": iface.get("operstate"),
                "mac": iface.get("address"),
                "mtu": iface.get("mtu"),
                "addresses": [],
            }
            for a in iface.get("addr_info", []) or []:
                if not isinstance(a, dict):
                    continue
                family = a.get("family")   # inet / inet6
                local = a.get("local")
                prefix = a.get("prefixlen")
                if not (family and local and isinstance(prefix, int)):
                    continue
                per_iface[name]["addresses"].append({
                    "family": family,
                    "ip": local,
                    "prefixlen": prefix,
                })

        # default routes (can be multiple)
        default_routes: List[Dict[str, Any]] = []
        for r in routes:
            if isinstance(r, dict) and r.get("dst") == "default":
                gw = r.get("gateway")
                dev = r.get("dev")
                metric = r.get("metric")
                fam = "inet6" if (gw and ":" in gw) else "inet"
                entry = {"family": fam, "gateway": gw, "iface": dev, "metric": metric}
                default_routes.append(entry)
                if dev:
                    per_iface.setdefault(dev, {"addresses": []})
                    per_iface[dev].setdefault("default_routes", []).append(entry)

        # per-link DNS (systemd-resolved), if available
        per_link_dns = _resolvectl_per_link_dns()
        for dev, servers in per_link_dns.items():
            per_iface.setdefault(dev, {"addresses": []})
            per_iface[dev]["dns_nameservers"] = servers

        # best-effort dhcp hint
        dhcp_hint = {"hint": "DHCP detection depends on network manager (nmcli/networkctl)."}

        return {
            "platform": "linux(iproute2)",
            "interfaces": per_iface,
            "meta": {
                "default_routes": default_routes,
                "dns_effective": dns_effective,
                "dhcp": dhcp_hint,
            }
        }

    # MacOS and generic fallback (psutil)
    per_iface: Dict[str, Any] = {}
    for name, addrs in psutil.net_if_addrs().items():
        per_iface[name] = {"addresses": []}
        for a in addrs:
            if getattr(a.family, "name", "") == "AF_INET":
                family = "inet"
            elif getattr(a.family, "name", "") == "AF_INET6":
                family = "inet6"
            else:
                # macOS AF_LINK etc. (we keep them, but you can filter later)
                family = str(a.family)

            per_iface[name]["addresses"].append({
                "family": family,
                "ip": a.address,
                "netmask": a.netmask,
                "broadcast": a.broadcast,
            })

    default_routes: List[Dict[str, Any]] = []

    # macOS: route -n get default gives iface
    if system == "darwin":
        gw4, gw6, iface4, iface6 = _default_gateway_macos_with_iface()

        if gw4 and iface4:
            entry4 = {"family": "inet", "gateway": gw4, "iface": iface4, "metric": None}
            default_routes.append(entry4)
            per_iface.setdefault(iface4, {"addresses": []})
            per_iface[iface4].setdefault("default_routes", []).append(entry4)

            # attach effective DNS (best effort) to the “main” interface
            if dns_effective.get("nameservers"):
                per_iface[iface4]["dns_nameservers"] = dns_effective["nameservers"]

        if gw6 and iface6:
            entry6 = {"family": "inet6", "gateway": gw6, "iface": iface6, "metric": None}
            default_routes.append(entry6)
            per_iface.setdefault(iface6, {"addresses": []})
            per_iface[iface6].setdefault("default_routes", []).append(entry6)

            if dns_effective.get("nameservers"):
                per_iface[iface6].setdefault("dns_nameservers", dns_effective["nameservers"])

        dhcp_hint = {"hint": "Not available in fallback mode (depends on OS/network manager)."}

        return {
            "platform": "fallback(darwin)",
            "interfaces": per_iface,
            "meta": {
                "default_routes": default_routes,
                "dns_effective": dns_effective,
                "dhcp": dhcp_hint,
            }
        }

    # generic fallback: try linux /proc gateway (no iface mapping)
    if system == "linux":
        gw4, gw6 = _default_gateway_linux_proc()
        if gw4:
            default_routes.append({"family": "inet", "gateway": gw4, "iface": None, "metric": None})
        if gw6:
            default_routes.append({"family": "inet6", "gateway": gw6, "iface": None, "metric": None})

    return {
        "platform": "fallback(psutil)",
        "interfaces": per_iface,
        "meta": {
            "default_routes": default_routes,
            "dns_effective": dns_effective,
            "dhcp": {"hint": "Not available in fallback mode."},
        }
    }


# ---------------------------------------------------------------------------- #
#                                   Endpoint                                   #
# ---------------------------------------------------------------------------- #
@router.get("/")
async def info(sample_interval: float = 1.0, include_tc: bool = False) -> Dict[str, Any]:
    # ---------------------------------------------------------------------------- #
    #                                CPU Information                               #
    # ---------------------------------------------------------------------------- #
    physical_cores = psutil.cpu_count(logical=False)
    logical_cpus = psutil.cpu_count(logical=True)

    freq = psutil.cpu_freq()
    cpu_freq = None
    if freq:
        cpu_freq = {"current_mhz": freq.current, "min_mhz": freq.min, "max_mhz": freq.max}

    # CPU sampling + network throughput sampling
    psutil.cpu_percent(interval=None, percpu=True)
    c1 = psutil.net_io_counters(pernic=True)

    # One sleep for both CPU + network sampling
    await asyncio.sleep(sample_interval)

    # CPU utilization
    per_cpu_percent = psutil.cpu_percent(interval=None, percpu=True)
    total_cpu_percent = sum(per_cpu_percent) / max(len(per_cpu_percent), 1)

    # ---------------------------------------------------------------------------- #
    #                                    Memory                                    #
    # ---------------------------------------------------------------------------- #
    vm = psutil.virtual_memory()
    memory = {
        "total_bytes": vm.total,
        "available_bytes": vm.available,
        "used_bytes": vm.used,
        "percent_used": vm.percent,
    }

    # ---------------------------------------------------------------------------- #
    #                                     Disks                                    #
    # ---------------------------------------------------------------------------- #
    disks = []
    for part in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(part.mountpoint)
        except PermissionError:
            continue
        disks.append({
            "device": part.device,
            "mountpoint": part.mountpoint,
            "fstype": part.fstype,
            "total_bytes": usage.total,
            "used_bytes": usage.used,
            "free_bytes": usage.free,
            "percent_used": usage.percent,
        })

    root_usage = psutil.disk_usage("/")
    disk_summary = {
        "root": {
            "total_bytes": root_usage.total,
            "used_bytes": root_usage.used,
            "free_bytes": root_usage.free,
            "percent_used": root_usage.percent,
        }
    }

    # ---------------------------------------------------------------------------- #
    #                                    Network                                   #
    # ---------------------------------------------------------------------------- #
    c2 = psutil.net_io_counters(pernic=True)

    net: Dict[str, Any] = {}
    dt = sample_interval if sample_interval > 0 else 1.0
    for iface, a in c1.items():
        b = c2.get(iface)
        if not b:
            continue

        rx_Bps = (b.bytes_recv - a.bytes_recv) / dt
        tx_Bps = (b.bytes_sent - a.bytes_sent) / dt

        net[iface] = {
            "rx_bytes_total": b.bytes_recv,
            "tx_bytes_total": b.bytes_sent,
            "rx_bits_per_sec": rx_Bps * 8.0,
            "tx_bits_per_sec": tx_Bps * 8.0,
            "packets_recv_total": b.packets_recv,
            "packets_sent_total": b.packets_sent,
            "errors_in_total": b.errin,
            "errors_out_total": b.errout,
            "drops_in_total": b.dropin,
            "drops_out_total": b.dropout,
            "link_speed_mbps": _iface_link_speed_mbps(iface),
        }

    # ---------------------------------------------------------------------------- #
    #                        Network + Network Configuration                       #
    # ---------------------------------------------------------------------------- #
    cfg = collect_network_config()

    # Merge per-interface stuff into "network"
    for iface, icfg in (cfg.get("interfaces") or {}).items():
        net.setdefault(iface, {})

        # attach addresses (filter to inet/inet6 so you don't get AF_LINK "18" noise on macOS)
        addrs = icfg.get("addresses", [])
        if isinstance(addrs, list):
            addrs = [x for x in addrs if isinstance(x, dict) and x.get("family") in ("inet", "inet6")]
        net[iface]["addresses"] = addrs

        # attach per-interface default routes/dns if present
        if "default_routes" in icfg:
            net[iface]["default_routes"] = icfg.get("default_routes", [])
        if "dns_nameservers" in icfg:
            net[iface]["dns_nameservers"] = icfg.get("dns_nameservers", [])

        # linux-only extras if present
        for k in ("state", "mac", "mtu"):
            if k in icfg:
                net[iface][k] = icfg[k]

    # Keep only global/effective metadata here (no duplicated interfaces)
    network_meta = {
        "platform": cfg.get("platform"),
        "default_routes": (cfg.get("meta") or {}).get("default_routes", []),
        "dns_effective": (cfg.get("meta") or {}).get("dns_effective", {}),
        "dhcp": (cfg.get("meta") or {}).get("dhcp", {}),
    }

    # ---------------------------------------------------------------------------- #
    #                                    Result                                    #
    # ---------------------------------------------------------------------------- #

    result: Dict[str, Any] = {
        "cpu": {
            "physical_cores": physical_cores,
            "logical_cpus": logical_cpus,
            "freq": cpu_freq,
            "total_percent": total_cpu_percent,
            "per_logical_cpu_percent": per_cpu_percent,
        },
        "memory": memory,
        "disks": disks,
        "disk_summary": disk_summary,
        "network": net,
        "network_meta": network_meta,
    }

    if include_tc:
        result["traffic_control"] = _tc_json()

    return result
