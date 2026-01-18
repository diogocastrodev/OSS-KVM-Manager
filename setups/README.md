Agent setup example

```
sudo mkdir -p /opt/oss-kvm-agent && \
sudo curl -fsSL "https://raw.githubusercontent.com/diogocastrodev/OSS-KVM-Manager/main/setups/agent/agent_v2.sh" \
  -o /opt/oss-kvm-agent/agent_v2.sh && \
sudo chmod +x /opt/oss-kvm-agent/agent_v2.sh && \
sudo AGENT_GIT_URL="https://github.com/diogocastrodev/OSS-KVM-Manager.git" \
     AGENT_GIT_REF="main" \
     AGENT_APP_DIR="/opt/oss-kvm-agent/agent" \
     AGENT_SUBDIR="agent" \
     /opt/oss-kvm-agent/agent_v2.sh

```
