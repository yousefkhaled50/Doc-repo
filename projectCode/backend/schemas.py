from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# ---------------- Department ----------------
class DepartmentBase(BaseModel):
    name: str

class DepartmentOut(DepartmentBase):
    dep_id: int
    class Config:
        from_attributes = True

# ---------------- User ----------------
class UserBase(BaseModel):
    username: str
    role: str
    dep_id: int

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    user_id: int
    class Config:
        from_attributes = True


# ---------------- Tag ----------------
class TagBase(BaseModel):
    name: str

class TagOut(TagBase):
    tag_id: int
    class Config:
        from_attributes = True

# ---------------- Document Version ----------------
class DocumentVersionOut(BaseModel):
    version_id: int
    doc_id: int
    uploaded_by: int
    ver_num: int
    file_path: str
    upload_date: datetime
    class Config:
        from_attributes = True

# ---------------- Document ----------------
class DocumentBase(BaseModel):
    title: str

class DocumentOut(DocumentBase):
    doc_id: int
    current_ver_id: Optional[int]
    tags: List[TagOut] = []
    versions: List[DocumentVersionOut] = []
    class Config:
        from_attributes = True

# ---------------- Permission ----------------
class PermissionOut(BaseModel):
    document_id: int
    department_id: int
    class Config:
        from_attributes = True
