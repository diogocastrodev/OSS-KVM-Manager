from typing import Optional
from pydantic import BaseModel, model_validator

from enum import Enum

class FormatMode(str, Enum):
    CLOUD = "cloud"
    ISO = "iso"

class CreateVMHost(BaseModel):
    hostname: str
    username: str
    password: Optional[str] = None
    public_key: Optional[str] = None

    @model_validator(mode="after")
    def _check_authentication(self):
        has_pwd = bool(self.password)
        has_key = bool(self.public_key)
        if has_pwd == has_key:
            raise ValueError("Either password or public_key must be provided, but not both.")
        return self

class FormatOSVM(BaseModel):
    os_name: str
    os_url: str
    os_checksum: Optional[str] = None

class FormatOSNetwork(BaseModel):
    mac_address: str
    ip_cidr: str
    gateway: str
    dns_servers: Optional[list[str]] = None

class VMFormatBody(BaseModel):
    mode: Optional[FormatMode] = FormatMode.CLOUD 
    vm_id: str
    host: Optional[CreateVMHost] = None
    network: Optional[FormatOSNetwork] = None
    os: FormatOSVM

    @model_validator(mode="after")
    def check_host_for_iso_mode(self):
        if self.mode == FormatMode.CLOUD and (self.host is None or self.network is None):
            raise ValueError("Host and Network must be provided for cloud mode")
        return self

