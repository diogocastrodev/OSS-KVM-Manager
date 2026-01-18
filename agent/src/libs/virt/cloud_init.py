import os
import shutil
from pathlib import Path
from dataclasses import dataclass
from typing import Optional
import tempfile
import subprocess
import xml.etree.ElementTree as ET
import subprocess

@dataclass
class MetaTemplate:
    vm_id: str
    hostname: str

@dataclass
class NetworkingTemplate:
    mac_address: str
    ip_cidr: str
    gateway: str
    dns_servers: Optional[list[str]] = None

@dataclass
class UserKeyTemplate:
    hostname: str
    username: str
    ssh_public_key: str

@dataclass
class UserPasswordTemplate:
    hostname: str
    username: str
    password: str


def sha512_crypt(password: str) -> str:
    # -6 = SHA-512 crypt, output is $6$... which cloud-init accepts in users[].passwd
    out = subprocess.check_output(
        ["openssl", "passwd", "-6", "-stdin"],
        input=password.encode("utf-8"),
    )
    return out.decode("utf-8").strip()


def load_template(template_name: str) -> str:
    template_dir = Path(__file__).resolve().parent / 'templates' / 'cloud_init'
    return (template_dir / template_name).read_text()

def generate_meta_data(template: MetaTemplate) -> str:
    template_str = load_template('meta_template.yaml')
    return template_str.format(vm_id=template.vm_id, hostname=template.hostname)

def gen_dns_defaults(dns_list: list[str]) -> str:
    if not dns_list:
        dns_list = ["1.1.1.1", "8.8.8.8"]
    return ", ".join(f'"{dns}"' for dns in dns_list)

# def generate_networking_data(template: NetworkingTemplate) -> str:
#     template_str = load_template('networking_template.yaml')

#     dns_list = template.dns_servers or ["1.1.1.1", "8.8.8.8"]
#     dns_servers_str = ", ".join(f'"{dns}"' for dns in dns_list)

#     return template_str.format(
#         mac=template.mac_address,
#         vm_ip=template.ip_cidr,
#         vm_prefix=24, # TODO: Send prefix in template
#         vms_gateway=template.gateway,
#         dns_servers=dns_servers_str
#     )

def generate_user_data_key(template: UserKeyTemplate, network: NetworkingTemplate) -> str:
    template_str = load_template('user_keys_template.yaml')
    return template_str.format(
        hostname=template.hostname,
        username=template.username,
        ssh_public_key=template.ssh_public_key,
        mac=network.mac_address,
        vm_ip=network.ip_cidr,
        vm_prefix=24, # TODO: Send prefix in template
        vms_gateway=network.gateway,
        dns_servers=gen_dns_defaults(network.dns_servers)
    )

def generate_user_data_password(template: UserPasswordTemplate, network: NetworkingTemplate) -> str:
    template_str = load_template('user_pwd_template.yaml')
    password_hashed = sha512_crypt(template.password)
    print(f"Generated hashed password: {password_hashed}")
    return template_str.format(
        hostname=template.hostname,
        username=template.username,
        password=password_hashed,
        mac=network.mac_address,
        vm_ip=network.ip_cidr,
        vm_prefix=24, # TODO: Send prefix in template
        vms_gateway=network.gateway,
        dns_servers=gen_dns_defaults(network.dns_servers)
    )

def vm_uses_user_network(domain) -> bool:
    root = ET.fromstring(domain.XMLDesc(0))
    iface = root.find("./devices/interface")
    return iface is not None and iface.get("type") == "user"

def generate_cloud_init_iso(meta_data: str, networking_data: Optional[str], user_data: str, iso_path: str) -> bool:
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        (tmp / "meta-data").write_text(meta_data)
        (tmp / "user-data").write_text(user_data)

        files = ["meta-data", "user-data"]

        if networking_data is not None:
            (tmp / "network-config").write_text(networking_data)
            files.insert(1, "network-config")

        iso_tool = shutil.which("genisoimage") or shutil.which("mkisofs")
        if not iso_tool:
            raise FileNotFoundError("Need genisoimage or mkisofs in PATH to build seed ISO")

        subprocess.run(
            [iso_tool, "-output", iso_path, "-volid", "cidata", "-joliet", "-rock", *files],
            check=True,
            cwd=tmpdir,
        )
    return True


def generate_cloud_init_iso_alt(
    meta_data: MetaTemplate,
    networking_data: Optional[NetworkingTemplate],
    user_data: UserKeyTemplate | UserPasswordTemplate,
    iso_path: str
) -> bool:
    meta_str = generate_meta_data(meta_data)

    if isinstance(user_data, UserKeyTemplate):
        user_str = generate_user_data_key(user_data, networking_data)
    else:
        user_str = generate_user_data_password(user_data, networking_data)

    return generate_cloud_init_iso(meta_str, None, user_str, iso_path)