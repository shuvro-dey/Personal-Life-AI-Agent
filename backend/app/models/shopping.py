from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class ShoppingList(Base):
    __tablename__ = "shopping_lists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="shopping_lists")
    items = relationship("ShoppingItem", back_populates="shopping_list", cascade="all, delete-orphan")


class ShoppingItem(Base):
    __tablename__ = "shopping_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    list_id = Column(Integer, ForeignKey("shopping_lists.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    quantity = Column(Float, default=1.0, nullable=False)
    unit = Column(String(50), default="piece", nullable=False)
    price = Column(Float, nullable=True)
    is_checked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="shopping_items")
    shopping_list = relationship("ShoppingList", back_populates="items")
