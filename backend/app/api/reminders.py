import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.reminder import Reminder
from app.models.audit import AuditLog
from app.schemas.reminder import (
    ReminderCreate,
    ReminderUpdate,
    ReminderResponse,
    SmartReminderParseRequest,
    SmartReminderParseResponse
)
from app.api.deps import get_current_user
from app.services.ai_service import parse_reminder
from app.utils.timezone import now_dhaka, today_dhaka

router = APIRouter(prefix="/reminders", tags=["Reminder Tracker"])


@router.get("", response_model=List[ReminderResponse])
def get_reminders(
    view: Optional[str] = Query(None, description="Filter view: today, upcoming, completed"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve user reminders filtered by date or status in Asia/Dhaka timezone."""
    query = db.query(Reminder).filter(Reminder.user_id == current_user.id)
    current_date = today_dhaka()

    if view == "today":
        query = query.filter(Reminder.due_date == current_date, Reminder.status != "done").order_by(Reminder.due_time.asc())
    elif view == "upcoming":
        query = query.filter(Reminder.due_date > current_date, Reminder.status != "done").order_by(Reminder.due_date.asc(), Reminder.due_time.asc())
    elif view == "completed":
        query = query.filter(Reminder.status == "done").order_by(Reminder.updated_at.desc())
    else:
        query = query.order_by(Reminder.due_date.asc(), Reminder.due_time.asc())

    reminders = query.all()
    return [ReminderResponse.model_validate(r) for r in reminders]


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    payload: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new scheduled reminder."""
    new_reminder = Reminder(
        user_id=current_user.id,
        title=payload.title.strip(),
        due_date=payload.due_date,
        due_time=payload.due_time,
        repeat=payload.repeat,
        status="pending"
    )
    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="reminder_created",
        details_json=json.dumps({
            "reminder_id": new_reminder.id,
            "title": new_reminder.title,
            "due_date": str(new_reminder.due_date),
            "due_time": str(new_reminder.due_time)
        }),
        status="success"
    )
    db.add(audit)
    db.commit()

    return ReminderResponse.model_validate(new_reminder)


@router.get("/due-notifications", response_model=List[ReminderResponse])
def get_due_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns pending reminders for the current user that have reached their due time.
    Marks notified_at upon retrieval so the client receives them once for notification alert.
    """
    current_date = today_dhaka()
    current_time = now_dhaka().time()

    due = db.query(Reminder).filter(
        Reminder.user_id == current_user.id,
        Reminder.status == "pending",
        Reminder.notified_at.is_(None),
        (
            (Reminder.due_date < current_date) |
            ((Reminder.due_date == current_date) & (Reminder.due_time <= current_time))
        )
    ).all()

    now_val = datetime.now(timezone.utc)
    for r in due:
        r.notified_at = now_val
    if due:
        db.commit()

    return [ReminderResponse.model_validate(r) for r in due]


@router.get("/{reminder_id}", response_model=ReminderResponse)
def get_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single reminder with user ownership check."""
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    return ReminderResponse.model_validate(reminder)


@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: int,
    payload: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update reminder details or status."""
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )

    if payload.title is not None and payload.title.strip():
        reminder.title = payload.title.strip()
    if payload.due_date is not None:
        reminder.due_date = payload.due_date
    if payload.due_time is not None:
        reminder.due_time = payload.due_time
    if payload.repeat is not None:
        reminder.repeat = payload.repeat
    if payload.status is not None:
        reminder.status = payload.status

    db.commit()
    db.refresh(reminder)
    return ReminderResponse.model_validate(reminder)


@router.patch("/{reminder_id}/toggle", response_model=ReminderResponse)
def toggle_reminder_status(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle reminder status between pending and done."""
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )

    reminder.status = "pending" if reminder.status == "done" else "done"
    db.commit()
    db.refresh(reminder)
    return ReminderResponse.model_validate(reminder)


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a reminder with ownership enforcement."""
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )

    title = reminder.title
    db.delete(reminder)
    db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="reminder_deleted",
        details_json=json.dumps({"reminder_id": reminder_id, "title": title}),
        status="success"
    )
    db.add(audit)
    db.commit()

    return None


@router.post("/smart-parse", response_model=SmartReminderParseResponse)
def smart_parse_reminder(
    payload: SmartReminderParseRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Extract reminder title, date, time and repeat schedule from natural language.
    If date or time is missing or ambiguous, asks a clarification question instead of guessing.
    Default timezone is Asia/Dhaka.
    """
    current_dhaka_iso = now_dhaka().isoformat()
    result = parse_reminder(
        text=payload.text,
        current_time_iso=payload.current_time_iso or current_dhaka_iso
    )
    return SmartReminderParseResponse.model_validate(result)
