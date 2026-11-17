from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict
from app.schemas.reminder import ReminderResponse
from app.schemas.shopping import ShoppingListSummaryResponse
from app.schemas.study import StudySessionSummaryResponse


class ActivityItemResponse(BaseModel):
    id: int
    action: str
    details: Optional[Dict[str, Any]] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardOverviewResponse(BaseModel):
    user_name: str
    current_time_dhaka: str
    today_reminders_count: int
    shopping_lists_count: int
    study_sessions_count: int
    today_reminders: List[ReminderResponse]
    active_shopping_lists: List[ShoppingListSummaryResponse]
    recent_study_sessions: List[StudySessionSummaryResponse]
    recent_activities: List[ActivityItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class CommandRequest(BaseModel):
    query: str


class CommandResponse(BaseModel):
    intent: str  # "shopping", "reminder", "study", "general"
    message: str
    action_url: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None
