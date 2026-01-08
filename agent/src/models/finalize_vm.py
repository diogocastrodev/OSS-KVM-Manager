from typing import Optional
from pydantic import BaseModel, model_validator

class FinalizeRequest(BaseModel):
    seed_iso_path: Optional[str] = None   # default: /tmp/{vm_id}-seed.iso
    delete_iso: bool = True