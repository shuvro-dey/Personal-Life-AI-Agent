from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Date, Time, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    due_time = Column(Time, nullable=False)
    repeat = Column(String(20), default="none", nullable=False)  # none, daily, weekly
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending, done, missed
    notified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="reminders")
