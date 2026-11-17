from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class ShoppingItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    quantity: float = Field(default=1.0, gt=0)
    unit: str = Field(default="piece", max_length=50)
    price: Optional[float] = Field(default=None, ge=0)
    is_checked: bool = False


class ShoppingItemCreate(ShoppingItemBase):
    pass


class ShoppingItemUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    quantity: Optional[float] = Field(default=None, gt=0)
    unit: Optional[str] = Field(default=None, max_length=50)
    price: Optional[float] = Field(default=None, ge=0)
    is_checked: Optional[bool] = None


class ShoppingItemResponse(ShoppingItemBase):
    id: int
    user_id: int
    list_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShoppingListCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)


class ShoppingListUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)


class ShoppingListSummaryResponse(BaseModel):
    id: int
    user_id: int
    title: str
    item_count: int
    checked_count: int
    total_cost: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShoppingListDetailResponse(BaseModel):
    id: int
    user_id: int
    title: str
    item_count: int
    checked_count: int
    total_cost: float
    items: List[ShoppingItemResponse]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SmartParseRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    language: Optional[str] = "en"


class ParsedItem(BaseModel):
    name: str
    quantity: float = 1.0
    unit: str = "piece"
    price: Optional[float] = None


class SmartParseResponse(BaseModel):
    items: List[ParsedItem]


class BatchAddItemsRequest(BaseModel):
    items: List[ShoppingItemCreate]
