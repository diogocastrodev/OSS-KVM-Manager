import os
from pathlib import Path
from dataclasses import dataclass
from typing import Optional
import tempfile
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


def load_template(template_name: str) -> str:
    template_dir = Path(__file__).resolve().parent / 'templates' / 'cloud_init'
    return (template_dir / template_name).read_text()

def generate_meta_data(template: MetaTemplate) -> str:
    template_str = load_template('meta_template.yaml')
    return template_str.format(vm_id=template.vm_id, hostname=template.hostname)

def generate_networking_data(template: NetworkingTemplate) -> str:
    template_str = load_template('networking_template.yaml')

    dns_list = template.dns_servers or ["1.1.1.1", "8.8.8.8"]
    dns_servers_str = ", ".join(f'"{dns}"' for dns in dns_list)

    return template_str.format(
        mac_address=template.mac_address,
        ip_cidr=template.ip_cidr,
        gateway=template.gateway,
        dns_servers=dns_servers_str
    )

def generate_user_data_key(template: UserKeyTemplate) -> str:
    template_str = load_template('user_data_key_template.yaml')
    return template_str.format(
        hostname=template.hostname,
        username=template.username,
        ssh_public_key=template.ssh_public_key
    )

def generate_user_data_password(template: UserPasswordTemplate) -> str:
    template_str = load_template('user_data_password_template.yaml')
    return template_str.format(
        hostname=template.hostname,
        username=template.username,
        password=template.password
    )

def generate_cloud_init_iso(meta_data: str, networking_data: str, user_data: str, iso_path: str) -> bool:
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        (tmp / "meta-data").write_text(meta_data)
        (tmp / "network-config").write_text(networking_data)
        (tmp / "user-data").write_text(user_data)

        subprocess.run(
            [
                "genisoimage",
                "-output", iso_path,
                "-volid", "cidata",
                "-joliet",
                "-rock",
                "meta-data",
                "network-config",
                "user-data",
            ],
            check=True,
            cwd=tmpdir,
        )
    return True


def generate_cloud_init_iso_alt(
    meta_data: MetaTemplate,
    networking_data: NetworkingTemplate,
    user_data: UserKeyTemplate | UserPasswordTemplate,
    iso_path: str,
) -> bool:
    meta_str = generate_meta_data(meta_data)

    # FIX: keep dns_servers as list[str]
    if not networking_data.dns_servers:
        networking_data.dns_servers = ["1.1.1.1", "8.8.8.8"]

    network_str = generate_networking_data(networking_data)

    if isinstance(user_data, UserKeyTemplate):
        user_str = generate_user_data_key(user_data)
    else:
        user_str = generate_user_data_password(user_data)

    return generate_cloud_init_iso(meta_str, network_str, user_str, iso_path)
