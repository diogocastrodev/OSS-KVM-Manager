#!/usr/bin/env bash
set -euo pipefail

############################################
# OSS-KVM Agent Updater (agent-only)
# - Works even if WorkingDirectory is NOT a git repo
# - Uses a repo cache + sparse-checkout + rsync deploy
############################################

SERVICE_NAME="${SERVICE_NAME:-agent.service}"

# Config file created on first run (edit later if you want)
CONF_FILE="${CONF_FILE:-/etc/oss-kvm-agent/update.env}"

# Where updater keeps the git clone (includes .git)
REPO_CACHE_DIR="${REPO_CACHE_DIR:-/opt/oss-kvm-agent/repo-cache}"

log(){ echo -e "\n[+] $*"; }
warn(){ echo -e "\n[!] $*" >&2; }
die(){ echo -e "\n[-] $*" >&2; exit 1; }

require_root(){
  [[ "${EUID}" -eq 0 ]] || die "Run as root: sudo $0"
}

get_unit_line(){
  # Reads first match from merged unit (includes drop-ins)
  systemctl cat "$SERVICE_NAME" 2>/dev/null | sed -n "s/^$1=//p" | head -n1
}

apt_ensure(){
  local pkg="$1"
  dpkg -s "$pkg" >/dev/null 2>&1 && return 0
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y --no-install-recommends "$pkg"
}

ensure_conf(){
  if [[ -f "$CONF_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$CONF_FILE"
    return 0
  fi

  log "Config missing; creating $CONF_FILE"
  mkdir -p "$(dirname "$CONF_FILE")"

  # Defaults (override by exporting AGENT_GIT_URL/AGENT_GIT_REF/etc before running)
  cat >"$CONF_FILE" <<EOF
# Updater config for OSS-KVM Agent
# Edit this file if you want to change what gets deployed.
AGENT_GIT_URL="${AGENT_GIT_URL:-https://github.com/diogocastrodev/OSS-KVM-Manager.git}"
AGENT_GIT_REF="${AGENT_GIT_REF:-main}"
AGENT_SUBDIR="${AGENT_SUBDIR:-agent}"

# Sparse-checkout paths (keep server "agent-only")
AGENT_SPARSE_PATHS="${AGENT_SPARSE_PATHS:-agent}"
EOF

  chmod 0644 "$CONF_FILE"
  # shellcheck disable=SC1090
  source "$CONF_FILE"
}

git_sparse_clone_or_update(){
  local url="$1" ref="$2" sparse_paths="$3"

  if [[ ! -d "$REPO_CACHE_DIR/.git" ]]; then
    log "Creating repo cache at $REPO_CACHE_DIR (sparse)"
    rm -rf "$REPO_CACHE_DIR"
    git clone --depth 1 --filter=blob:none --no-checkout --branch "$ref" "$url" "$REPO_CACHE_DIR"
    git -C "$REPO_CACHE_DIR" sparse-checkout init --cone
    # shellcheck disable=SC2086
    git -C "$REPO_CACHE_DIR" sparse-checkout set $sparse_paths
    git -C "$REPO_CACHE_DIR" checkout "$ref"
  else
    log "Updating repo cache (ref=$ref)"
    git -C "$REPO_CACHE_DIR" fetch --prune origin "$ref"
    git -C "$REPO_CACHE_DIR" checkout "$ref"
    git -C "$REPO_CACHE_DIR" pull --ff-only origin "$ref" || true
    git -C "$REPO_CACHE_DIR" sparse-checkout init --cone 2>/dev/null || true
    # shellcheck disable=SC2086
    git -C "$REPO_CACHE_DIR" sparse-checkout set $sparse_paths
  fi
}

main(){
  require_root

  systemctl daemon-reload >/dev/null 2>&1 || true
  systemctl status "$SERVICE_NAME" >/dev/null 2>&1 || die "Service not found: $SERVICE_NAME"

  ensure_conf

  : "${AGENT_GIT_URL:?AGENT_GIT_URL missing in $CONF_FILE}"
  AGENT_GIT_REF="${AGENT_GIT_REF:-main}"
  AGENT_SUBDIR="${AGENT_SUBDIR:-agent}"
  AGENT_SPARSE_PATHS="${AGENT_SPARSE_PATHS:-agent}"

  local workdir user group execstart pybin
  workdir="$(get_unit_line WorkingDirectory)"
  user="$(get_unit_line User)"
  group="$(get_unit_line Group)"
  execstart="$(get_unit_line ExecStart)"

  [[ -n "$workdir" ]] || die "No WorkingDirectory= in $SERVICE_NAME"
  [[ -n "${user:-}" ]] || user="root"
  [[ -n "${group:-}" ]] || group="$user"
  [[ -n "$execstart" ]] || die "No ExecStart= in $SERVICE_NAME"

  pybin="$(awk '{print $1}' <<<"$execstart")"
  [[ -x "$pybin" ]] || die "Python not executable: $pybin"

  log "Service:  $SERVICE_NAME"
  log "Workdir:  $workdir"
  log "User:     $user"
  log "Group:    $group"
  log "Python:   $pybin"
  log "Repo URL: $AGENT_GIT_URL"
  log "Ref:      $AGENT_GIT_REF"
  log "Sparse:   $AGENT_SPARSE_PATHS"
  log "Cache:    $REPO_CACHE_DIR"

  # Tools
  apt_ensure git
  apt_ensure rsync

  # Update cache (agent-only)
  git_sparse_clone_or_update "$AGENT_GIT_URL" "$AGENT_GIT_REF" "$AGENT_SPARSE_PATHS"

  local sha src_dir
  sha="$(git -C "$REPO_CACHE_DIR" rev-parse --short HEAD || true)"
  log "Cache now at: $sha"

  src_dir="$REPO_CACHE_DIR/$AGENT_SUBDIR"
  [[ -d "$src_dir" ]] || die "Expected agent dir missing in cache: $src_dir"

  # Deploy only agent/ into live workdir
  log "Deploying agent to $workdir"
  mkdir -p "$workdir"
  rsync -a --delete "$src_dir/" "$workdir/"

  # Ownership for runtime user
  chown -R "$user:$group" "$workdir" 2>/dev/null || true

  # Update python deps
  log "Updating python deps"
  "$pybin" -m pip install --upgrade pip setuptools wheel

  if [[ -f "$workdir/requirements.txt" ]]; then
    "$pybin" -m pip install -r "$workdir/requirements.txt"
  elif [[ -f "$workdir/pyproject.toml" ]]; then
    "$pybin" -m pip install "$workdir"
  else
    warn "No requirements.txt or pyproject.toml in $workdir — skipping pip install."
  fi

  log "Restarting $SERVICE_NAME"
  systemctl restart "$SERVICE_NAME"
  systemctl --no-pager -l status "$SERVICE_NAME" || true

  log "Done."
}

main "$@"
