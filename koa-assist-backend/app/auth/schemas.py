from pydantic import BaseModel, EmailStr
from typing import Optional
from app.database.models import RoleEnum

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: RoleEnum = RoleEnum.PATIENT

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: RoleEnum

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[RoleEnum] = None