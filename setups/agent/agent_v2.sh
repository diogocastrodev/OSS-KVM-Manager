#!/usr/bin/env bash
set -euo pipefail

############################################
# OSS-KVM-Manager: KVM Host + Agent bootstrap
# Debian 12 / Ubuntu 22.04+ friendly
############################################

log(){ echo -e "\n[+] $*"; }
warn(){ echo -e "\n[!] $*" >&2; }
die(){ echo -e "\n[-] $*" >&2; exit 1; }

require_root(){
  if [[ "${EUID}" -ne 0 ]]; then
    die "Run as root: sudo ./setup-agent-host.sh"
  fi
}

have(){ command -v "$1" >/dev/null 2>&1; }

############################################
# Config (override via environment variables)
############################################

# --- Agent runtime vars (written to /etc/agent/agent.env) ---
# Host: default auto-detect tailscale0 -> bind to tailscale IP, else 0.0.0.0
AGENT_HOST="${AGENT_HOST:-AUTO}"
AGENT_PORT="${AGENT_PORT:-5000}"
LIBVIRT_URI="${LIBVIRT_URI:-qemu:///system}"         # your app uses this
LIBVIRT_DEFAULT_URI="${LIBVIRT_DEFAULT_URI:-qemu:///system}" # libvirt-python often uses this env var
DEBUG="${DEBUG:-true}"
SYSTEM="${SYSTEM:-linux}"
AGENT_PRIVATE_KEY_PATH="${AGENT_PRIVATE_KEY_PATH:-/etc/agent/agent_private.pem}"
AGENT_PUBLIC_KEY_PATH="${AGENT_PUBLIC_KEY_PATH:-/etc/agent/agent_public.pem}"
CLOUDIMG_DIR="${CLOUDIMG_DIR:-/var/lib/agent/cloudimgs}"

# --- Agent installation ---
AGENT_USER="${AGENT_USER:-agent}"
AGENT_GROUP="${AGENT_GROUP:-agent}"
AGENT_HOME="${AGENT_HOME:-/var/lib/agent}"

# Where your python agent code lives:
# - If AGENT_GIT_URL is set, script clones here.
# - Otherwise, script expects code already exists here.
AGENT_APP_DIR="${AGENT_APP_DIR:-/var/lib/agent/app}"
AGENT_GIT_URL="${AGENT_GIT_URL:-}"                  # e.g. https://github.com/you/OSS-KVM-Manager.git
AGENT_GIT_REF="${AGENT_GIT_REF:-main}"              # branch/tag
AGENT_SUBDIR="${AGENT_SUBDIR:-agent}"               # if repo contains /agent folder

# --- Libvirt storage pool ---
POOL_NAME="${POOL_NAME:-default}"
POOL_PATH="${POOL_PATH:-/var/lib/libvirt/images}"

# --- Libvirt VM network (creates bridge br-vms) ---
VM_NET_NAME="${VM_NET_NAME:-vms}"
VM_BRIDGE_NAME="${VM_BRIDGE_NAME:-br-vms}"
VM_NET_FORWARD_MODE="${VM_NET_FORWARD_MODE:-nat}"   # nat or none
VM_NET_IP="${VM_NET_IP:-192.168.50.1}"
VM_NET_MASK="${VM_NET_MASK:-255.255.255.0}"
VM_DHCP_START="${VM_DHCP_START:-192.168.50.100}"
VM_DHCP_END="${VM_DHCP_END:-192.168.50.254}"

# --- Optional firewall restriction for agent port ---
FIREWALL_ENABLE="${FIREWALL_ENABLE:-1}"
MANAGEMENT_IP="${MANAGEMENT_IP:-}"                  # if set, only this IP can hit AGENT_PORT

# --- Dangerous: configure host NIC IP (OFF by default) ---
CONFIGURE_HOST_NIC="${CONFIGURE_HOST_NIC:-0}"
HOST_NIC_NAME="${HOST_NIC_NAME:-}"                  # e.g. enp0s1
HOST_IP_CIDR="${HOST_IP_CIDR:-}"                    # e.g. 10.0.0.21/24
HOST_GATEWAY="${HOST_GATEWAY:-}"                    # e.g. 10.0.0.1

############################################
# Helpers
############################################
apt_install(){
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y --no-install-recommends "$@"
}

ensure_group(){
  local g="$1"
  getent group "$g" >/dev/null 2>&1 || addgroup --system "$g"
}

ensure_user(){
  local u="$1" g="$2" home="$3"
  id -u "$u" >/dev/null 2>&1 && return 0
  adduser --system --ingroup "$g" --home "$home" --shell /usr/sbin/nologin "$u"
}

ensure_dir(){
  local path="$1" owner="$2" mode="$3"
  mkdir -p "$path"
  chown "$owner" "$path"
  chmod "$mode" "$path"
}

configure_host_nic(){
  [[ "$CONFIGURE_HOST_NIC" -eq 1 ]] || return 0
  [[ -n "$HOST_NIC_NAME" && -n "$HOST_IP_CIDR" && -n "$HOST_GATEWAY" ]] || \
    die "CONFIGURE_HOST_NIC=1 but HOST_NIC_NAME/HOST_IP_CIDR/HOST_GATEWAY not set"

  warn "Configuring host NIC from script can break SSH if wrong. Proceeding..."
  ip addr replace "$HOST_IP_CIDR" dev "$HOST_NIC_NAME"
  ip link set "$HOST_NIC_NAME" up
  ip route replace default via "$HOST_GATEWAY"
}

detect_agent_host(){
  if [[ "$AGENT_HOST" != "AUTO" ]]; then
    echo "$AGENT_HOST"
    return 0
  fi

  # Prefer tailscale0 if present
  if ip link show tailscale0 >/dev/null 2>&1; then
    local ts_ip
    ts_ip="$(ip -4 addr show dev tailscale0 | awk '/inet /{print $2}' | cut -d/ -f1 | head -n1 || true)"
    if [[ -n "$ts_ip" ]]; then
      echo "$ts_ip"
      return 0
    fi
  fi

  # Fallback
  echo "0.0.0.0"
}

ensure_polkit_rule(){
  # Allow members of libvirt group to manage libvirt without interactive polkit prompts
  # This is helpful on headless servers.
  log "Ensuring polkit rule for libvirt manage (group=libvirt)"
  mkdir -p /etc/polkit-1/rules.d
  cat >/etc/polkit-1/rules.d/49-libvirt-manage.rules <<'EOF'
polkit.addRule(function(action, subject) {
  if (action.id == "org.libvirt.unix.manage" && subject.isInGroup("libvirt")) {
    return polkit.Result.YES;
  }
});
EOF
}

ensure_keys(){
  log "Ensuring agent keypair in /etc/agent"
  mkdir -p /etc/agent
  chmod 0750 /etc/agent

  if [[ ! -f "$AGENT_PRIVATE_KEY_PATH" ]]; then
    openssl genpkey -algorithm ed25519 -out "$AGENT_PRIVATE_KEY_PATH"
  fi
  if [[ ! -f "$AGENT_PUBLIC_KEY_PATH" ]]; then
    openssl pkey -in "$AGENT_PRIVATE_KEY_PATH" -pubout -out "$AGENT_PUBLIC_KEY_PATH"
  fi

  chown root:"$AGENT_GROUP" "$AGENT_PRIVATE_KEY_PATH" "$AGENT_PUBLIC_KEY_PATH" || true
  chmod 0640 "$AGENT_PRIVATE_KEY_PATH"
  chmod 0644 "$AGENT_PUBLIC_KEY_PATH"
}

write_agent_env(){
  local host
  host="$(detect_agent_host)"

  log "Writing /etc/agent/agent.env (HOST=$host PORT=$AGENT_PORT)"
  cat >/etc/agent/agent.env <<EOF
# Agent runtime config
HOST=$host
PORT=$AGENT_PORT
LIBVIRT_URI=$LIBVIRT_URI
LIBVIRT_DEFAULT_URI=$LIBVIRT_DEFAULT_URI
DEBUG=$DEBUG
SYSTEM=$SYSTEM

# Keys
AGENT_PRIVATE_KEY_PATH=$AGENT_PRIVATE_KEY_PATH
AGENT_PUBLIC_KEY_PATH=$AGENT_PUBLIC_KEY_PATH

# Cache
CLOUDIMG_DIR=$CLOUDIMG_DIR
EOF

  chown root:"$AGENT_GROUP" /etc/agent/agent.env
  chmod 0640 /etc/agent/agent.env
}

ensure_libvirt_pool(){
  log "Ensuring libvirt pool '$POOL_NAME' at '$POOL_PATH' (URI: $LIBVIRT_URI)"
  mkdir -p "$POOL_PATH"

  # Use libvirt-qemu group if present, else libvirt
  if getent group libvirt-qemu >/dev/null 2>&1; then
    chown root:libvirt-qemu "$POOL_PATH" || true
  else
    chown root:libvirt "$POOL_PATH" || true
  fi
  chmod 2770 "$POOL_PATH" || true

  # ACL so agent user can read/write if your code still uses qemu-img on files
  if have setfacl; then
    setfacl -m "u:${AGENT_USER}:rwx" "$POOL_PATH" || true
    setfacl -d -m "u:${AGENT_USER}:rwx" "$POOL_PATH" || true
  fi

  if ! virsh -c "$LIBVIRT_URI" pool-info "$POOL_NAME" >/dev/null 2>&1; then
    virsh -c "$LIBVIRT_URI" pool-define-as "$POOL_NAME" dir - - - - "$POOL_PATH"
    virsh -c "$LIBVIRT_URI" pool-build "$POOL_NAME" || true
  fi
  virsh -c "$LIBVIRT_URI" pool-start "$POOL_NAME" || true
  virsh -c "$LIBVIRT_URI" pool-autostart "$POOL_NAME" || true
}

ensure_libvirt_network(){
  log "Ensuring libvirt network '$VM_NET_NAME' (bridge=$VM_BRIDGE_NAME mode=$VM_NET_FORWARD_MODE)"
  local xml="/tmp/${VM_NET_NAME}.xml"

  if [[ "$VM_NET_FORWARD_MODE" == "nat" ]]; then
    cat >"$xml" <<EOF
<network>
  <name>${VM_NET_NAME}</name>
  <bridge name='${VM_BRIDGE_NAME}' stp='on' delay='0'/>
  <forward mode='nat'/>
  <ip address='${VM_NET_IP}' netmask='${VM_NET_MASK}' />
</network>
EOF
  else
    cat >"$xml" <<EOF
<network>
  <name>${VM_NET_NAME}</name>
  <bridge name='${VM_BRIDGE_NAME}' stp='on' delay='0'/>
</network>
EOF
  fi

  if ! virsh -c "$LIBVIRT_URI" net-info "$VM_NET_NAME" >/dev/null 2>&1; then
    virsh -c "$LIBVIRT_URI" net-define "$xml"
  fi

  # If bridge exists but libvirt network is inactive, remove stale bridge so libvirt can recreate it
  if ip link show "$VM_BRIDGE_NAME" >/dev/null 2>&1; then
    if ! virsh -c "$LIBVIRT_URI" net-info "$VM_NET_NAME" 2>/dev/null | grep -q "Active:.*yes"; then
      warn "Stale bridge '$VM_BRIDGE_NAME' exists; removing so libvirt can start network."
      ip link set "$VM_BRIDGE_NAME" down 2>/dev/null || true
      ip link delete "$VM_BRIDGE_NAME" type bridge 2>/dev/null || true
    fi
  fi

  virsh -c "$LIBVIRT_URI" net-start "$VM_NET_NAME" || true
  virsh -c "$LIBVIRT_URI" net-autostart "$VM_NET_NAME" || true
}

configure_firewall(){
  [[ "$FIREWALL_ENABLE" -eq 1 ]] || { warn "Firewall disabled (FIREWALL_ENABLE=0)"; return 0; }

  if [[ -z "$MANAGEMENT_IP" ]]; then
    warn "MANAGEMENT_IP not set; not restricting inbound to AGENT_PORT."
    return 0
  fi

  log "Restricting inbound agent port $AGENT_PORT to MANAGEMENT_IP=$MANAGEMENT_IP"
  apt_install iptables-persistent >/dev/null 2>&1 || true

  # Add rule only if it doesn't exist (idempotent-ish)
  iptables -C INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT 2>/dev/null || \
    iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

  iptables -C INPUT -p tcp -s "$MANAGEMENT_IP" --dport "$AGENT_PORT" -j ACCEPT 2>/dev/null || \
    iptables -A INPUT -p tcp -s "$MANAGEMENT_IP" --dport "$AGENT_PORT" -j ACCEPT

  iptables -C INPUT -p tcp --dport "$AGENT_PORT" -j DROP 2>/dev/null || \
    iptables -A INPUT -p tcp --dport "$AGENT_PORT" -j DROP

  netfilter-persistent save || true
}

clone_or_update_agent(){
  if [[ -z "$AGENT_GIT_URL" ]]; then
    log "AGENT_GIT_URL not set; expecting agent code already present at: $AGENT_APP_DIR"
    [[ -d "$AGENT_APP_DIR" ]] || die "Agent dir missing: $AGENT_APP_DIR (set AGENT_GIT_URL or place code there)"
    return 0
  fi

  log "Cloning/updating agent from Git: $AGENT_GIT_URL (ref=$AGENT_GIT_REF)"
  apt_install git

  if [[ ! -d "$AGENT_APP_DIR/.git" ]]; then
    rm -rf "$AGENT_APP_DIR"
    git clone --depth 1 --branch "$AGENT_GIT_REF" "$AGENT_GIT_URL" "$AGENT_APP_DIR"
  else
    git -C "$AGENT_APP_DIR" fetch --depth 1 origin "$AGENT_GIT_REF"
    git -C "$AGENT_APP_DIR" checkout "$AGENT_GIT_REF"
    git -C "$AGENT_APP_DIR" pull --ff-only || true
  fi

  # If the python agent lives in a subfolder like repo/agent, adjust
  if [[ -n "$AGENT_SUBDIR" && -d "$AGENT_APP_DIR/$AGENT_SUBDIR" ]]; then
    AGENT_APP_DIR="$AGENT_APP_DIR/$AGENT_SUBDIR"
  fi

  chown -R "$AGENT_USER:$AGENT_GROUP" "$(dirname "$AGENT_APP_DIR")" || true
}

install_python_deps(){
  log "Creating venv + installing python deps"
  ensure_dir "$AGENT_HOME" "$AGENT_USER:$AGENT_GROUP" 0750
  ensure_dir "$CLOUDIMG_DIR" "$AGENT_USER:$AGENT_GROUP" 0750

  local venv="$AGENT_HOME/venv"
  if [[ ! -d "$venv" ]]; then
    python3 -m venv "$venv"
  fi

  "$venv/bin/pip" install --upgrade pip setuptools wheel

  # Install requirements
  if [[ -f "$AGENT_APP_DIR/requirements.txt" ]]; then
    "$venv/bin/pip" install -r "$AGENT_APP_DIR/requirements.txt"
  elif [[ -f "$AGENT_APP_DIR/pyproject.toml" ]]; then
    "$venv/bin/pip" install "$AGENT_APP_DIR"
  else
    warn "No requirements.txt or pyproject.toml found in $AGENT_APP_DIR — skipping pip install."
  fi

  chown -R "$AGENT_USER:$AGENT_GROUP" "$AGENT_HOME"
}

install_systemd_service(){
  log "Installing systemd service (agent.service)"

  cat >/etc/systemd/system/agent.service <<EOF
[Unit]
Description=OSS KVM Manager Agent
After=network-online.target libvirtd.service
Wants=network-online.target

[Service]
Type=simple
User=${AGENT_USER}
Group=${AGENT_GROUP}
WorkingDirectory=${AGENT_APP_DIR}
EnvironmentFile=/etc/agent/agent.env
Environment=PYTHONUNBUFFERED=1
ExecStart=${AGENT_HOME}/venv/bin/python -m src.server
Restart=on-failure
RestartSec=2

# hardening (safe defaults)
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable --now agent.service
}

############################################
# Main
############################################
require_root

log "Installing system packages"
apt_install \
  ca-certificates curl openssl \
  python3 python3-venv python3-pip python3-dev \
  gcc pkg-config \
  acl \
  qemu-kvm qemu-utils qemu-system-x86 \
  libvirt-daemon-system libvirt-clients libvirt-dev \
  ovmf \
  genisoimage \
  policykit-1 \
  iproute2 iptables

log "Starting libvirt"
systemctl enable --now libvirtd

log "Creating agent user/group"
ensure_group "$AGENT_GROUP"
ensure_user "$AGENT_USER" "$AGENT_GROUP" "$AGENT_HOME"

# Libvirt/KVM access
usermod -aG kvm,libvirt "$AGENT_USER" || true
getent group libvirt-qemu >/dev/null 2>&1 && usermod -aG libvirt-qemu "$AGENT_USER" || true

ensure_polkit_rule

configure_host_nic

ensure_keys
write_agent_env

ensure_libvirt_pool
ensure_libvirt_network

configure_firewall

clone_or_update_agent
install_python_deps
install_systemd_service

log "Done!"
echo "Service:    systemctl status agent.service --no-pager"
echo "Logs:       journalctl -u agent.service -f"
echo "Env file:   cat /etc/agent/agent.env"
echo "Networks:   virsh -c ${LIBVIRT_URI} net-list --all"
echo "Pools:      virsh -c ${LIBVIRT_URI} pool-list --all"
