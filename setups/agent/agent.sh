#!/bin/bash
set -e

### Variables ###
# Machine itself
MACHINE_IP=10.0.0.21/24             # Static IP of the host machine
AGENT_PORT=20256                    # Port where the agent will listen
# NIC
NIC_NAME="enp0s1"                   # Name of the NIC to be used
DEFAULT_GATEWAY=10.0.0.1            # Default gateway of the NIC
# Bridge
BRIDGE_NAME="br-vms"                # Name of the bridge to be created
BRIDGE_NETWORK=10.0.101.0/24        # Network of the bridge
BRIDGE_IP=10.0.101.1/24             # IP of the bridge (gateway for VMs)
# Management Server
MANAGEMENT_IP=10.0.0.10             # IP of the management interface
# Download URLs
DOWNLOAD_URL="http://127.0.0.1:9000" # Base URL to download agent components

####### Install Packages #######
echo "[*] Installing Required Packages ..."
echo "\t- Updating System ..."
apt update && apt upgrade -y
echo "\t- Installing Packages ..."
DEBIAN_FRONTEND=noninteractive apt install -y \
  python3-pip \
  qemu-system \
  qemu-kvm \
  libvirt-daemon-system \
  ovmf \
  bridge-utils \
  iptables-persistent \
  python3-libvirt \
  curl \
  qemu-utils \
  genisoimage

### Setup libvirt ###
echo "[*] Setting up libvirt ..."
adduser $USER libvirt
adduser $USER kvm
systemctl enable --now libvirtd
#### DEBUG TOOLS ####
# apt install libvirt-clients           # Manage libvirt from command line (not needed in production)
# apt install virtinst                  # Script to create VMs (not needed in production)

####### Bridge Setup #######
echo "[*] Initializing Network Bridge Setup ..."
# Set NIC Static IP # 
echo "\t- Setting up NIC ..."
ip addr replace $MACHINE_IP dev $NIC_NAME
ip link set $NIC_NAME up
ip route replace default via $DEFAULT_GATEWAY
# Create Bridge for VMs #
echo "\t- Creating Bridge Network ..."
brctl addbr $BRIDGE_NAME 2> /dev/null || true
ip addr replace $BRIDGE_IP dev $BRIDGE_NAME      # gateway for VMs
ip link set $BRIDGE_NAME up
# Enable IP Forwarding #
echo "\t- Enabling IP Forwarding ..."
sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward = 1" > /etc/sysctl.d/99-ipforward.conf
sysctl --system
# Set NAT for VMs #
echo "\t- Setting NAT for VMs ..."
iptables -A INPUT -s "$MANAGEMENT_IP" -p tcp --dport "$AGENT_PORT" -j ACCEPT
iptables -A FORWARD -i "$BRIDGE_NAME" -o "$NIC_NAME" -s "$BRIDGE_NETWORK" -j ACCEPT
iptables -A FORWARD -i "$NIC_NAME" -o "$BRIDGE_NAME" -d "$BRIDGE_NETWORK" -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -t nat -A POSTROUTING -s "$BRIDGE_NETWORK" -o "$NIC_NAME" -j MASQUERADE
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -p tcp --dport "$AGENT_PORT" -j DROP
# Block all other incoming traffic to port 8443 except from the management server
iptables -A FORWARD -s "$BRIDGE_NETWORK" -d "$MANAGEMENT_IP" -j DROP
# Anti-spoofing
iptables -A FORWARD -i "$BRIDGE_NAME" ! -s "$BRIDGE_NETWORK" -j DROP
echo "\t- Saving iptables rules ..."
# Save iptables rules #
netfilter-persistent save
echo "[*] Network Bridge Setup Complete."

####### Certs Setup #######
echo "[*] Generating Agent Keypair ..."
mkdir -p /etc/agent
openssl genpkey -algorithm ed25519 -out /etc/agent/agent_private.pem
openssl pkey -in /etc/agent/agent_private.pem -pubout -out /etc/agent/agent_public.pem
echo "[*] Agent Keypair Generated."

####### Setup Agent #######
echo "[*] Setting up Agent ..."
echo "\t- Creating Agent User and Directories ..."
# Create agent group
addgroup --system agent
# Create agent user
adduser --system --ingroup agent --home /var/lib/agent --shell /usr/sbin/nologin agent
# Create necessary directories
mkdir -p /var/lib/agent
chown -R agent:agent /var/lib/agent
mkdir -p /etc/agent
chown -R agent:agent /etc/agent

####### Fetch Agent #######
echo "[*] Fetching Agent Software ..."
echo "\t- Downloading Agent Server ..."
AGENT_URL="http://$MANAGEMENT_IP:8080/agent"
curl -o /var/lib/agent/app "$AGENT_URL"
chmod +x /var/lib/agent/app
echo "\t- Downloading Agent Service File ..."
AGENT_SERVICE_URL="http://$MANAGEMENT_IP:8080/setups/agent/agent.service"
curl -o /etc/systemd/system/agent.service "$AGENT_SERVICE_URL"
echo "[*] Agent Software Fetched."


echo "\t- Creating Agent Configuration ..."
AGENT_CONFIG_PATH="/etc/agent/agent_config.yaml"
###### Setup Agent Service #######
echo "\t- Setting up Agent Service ..."
AGENT_SERVICE_PATH="/etc/systemd/system/agent.service"
systemctl daemon-reload
systemctl enable --now agent.service
journalctl -u agent.service -f