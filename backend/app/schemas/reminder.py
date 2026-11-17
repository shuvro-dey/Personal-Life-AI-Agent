from datetime import date, time, datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict


class ReminderBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    due_date: date
    due_time: time
    repeat: Literal["none", "daily", "weekly"] = "none"


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    repeat: Optional[Literal["none", "daily", "weekly"]] = None
    status: Optional[Literal["pending", "done", "missed"]] = None


class ReminderResponse(ReminderBase):
    id: int
    user_id: int
    status: Literal["pending", "done", "missed"]
    notified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SmartReminderParseRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    current_time_iso: Optional[str] = None


class ExtractedReminderData(BaseModel):
    title: str
    due_date: str  # YYYY-MM-DD
    due_time: str  # HH:MM or HH:MM:SS
    repeat: Literal["none", "daily", "weekly"] = "none"


class SmartReminderParseResponse(BaseModel):
    status: Literal["ready", "needs_clarification"]
    clarification_question: Optional[str] = None
    data: Optional[ExtractedReminderData] = None
