from typing import Optional
from pydantic import BaseModel, model_validator

class NetworkSpec (BaseModel):
    in_avg_mbps: float
    in_peak_mbps: float
    in_burst_mbps: float
    out_avg_mbps: float
    out_peak_mbps: float
    out_burst_mbps: float

class CreateVMParams (BaseModel):
    vcpus: int
    memory: int
    disk_size: int
    network: NetworkSpec
    mac: str

class VMCreateRequest(BaseModel):
    vm_id: str
    vm: CreateVMParams
