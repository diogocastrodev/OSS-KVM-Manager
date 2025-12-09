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
  python3-libvirt

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