from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    name: str
    preferred_language: str = "en"
    timezone: str = "Asia/Dhaka"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    preferred_language: Optional[str] = None
    timezone: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    preferred_language: str
    timezone: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
