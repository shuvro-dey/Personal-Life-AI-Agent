import json
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.shopping import ShoppingList, ShoppingItem
from app.models.reminder import Reminder
from app.models.study import StudySession
from app.models.audit import AuditLog
from app.schemas.dashboard import DashboardOverviewResponse, CommandRequest, CommandResponse, ActivityItemResponse
from app.schemas.reminder import ReminderResponse
from app.schemas.shopping import ShoppingListSummaryResponse
from app.schemas.study import StudySessionSummaryResponse
from app.api.deps import get_current_user
from app.api.shopping import calculate_list_cost
from app.services.ai_service import parse_reminder, parse_shopping_items
from app.utils.timezone import today_dhaka, now_dhaka

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve consolidated overview for current user."""
    dhaka_now = now_dhaka()
    dhaka_date = today_dhaka()

    # 1. Today's pending reminders
    today_reminders_db = db.query(Reminder).filter(
        Reminder.user_id == current_user.id,
        Reminder.due_date == dhaka_date,
        Reminder.status != "done"
    ).order_by(Reminder.due_time.asc()).limit(5).all()

    today_reminders_count = db.query(Reminder).filter(
        Reminder.user_id == current_user.id,
        Reminder.due_date == dhaka_date,
        Reminder.status != "done"
    ).count()

    # 2. Active shopping lists
    lists_db = db.query(ShoppingList).filter(
        ShoppingList.user_id == current_user.id
    ).order_by(ShoppingList.updated_at.desc()).all()

    shopping_lists_res = []
    for s in lists_db[:3]:
        items = s.items
        shopping_lists_res.append(
            ShoppingListSummaryResponse(
                id=s.id,
                user_id=s.user_id,
                title=s.title,
                item_count=len(items),
                checked_count=sum(1 for i in items if i.is_checked),
                total_cost=calculate_list_cost(items),
                created_at=s.created_at,
                updated_at=s.updated_at
            )
        )

    # 3. Recent study sessions
    sessions_db = db.query(StudySession).filter(
        StudySession.user_id == current_user.id
    ).order_by(StudySession.updated_at.desc()).limit(3).all()

    study_sessions_res = [
        StudySessionSummaryResponse(
            id=s.id,
            user_id=s.user_id,
            title=s.title,
            document_name=s.document_name,
            document_type=s.document_type,
            language=s.language,
            has_summary=bool(s.summary),
            has_explanation=bool(s.explanation),
            question_count=len(s.questions),
            created_at=s.created_at,
            updated_at=s.updated_at
        )
        for s in sessions_db
    ]

    total_study_count = db.query(StudySession).filter(StudySession.user_id == current_user.id).count()

    # 4. Recent user activities from AuditLog
    audit_logs_db = db.query(AuditLog).filter(
        AuditLog.user_id == current_user.id
    ).order_by(AuditLog.created_at.desc()).limit(8).all()

    recent_activities_res = []
    for a in audit_logs_db:
        details_obj = None
        if a.details_json:
            try:
                details_obj = json.loads(a.details_json)
            except Exception:
                details_obj = {"raw": a.details_json}
        recent_activities_res.append(
            ActivityItemResponse(
                id=a.id,
                action=a.action,
                details=details_obj,
                status=a.status,
                created_at=a.created_at
            )
        )

    return DashboardOverviewResponse(
        user_name=current_user.name,
        current_time_dhaka=dhaka_now.strftime("%Y-%m-%d %H:%M"),
        today_reminders_count=today_reminders_count,
        shopping_lists_count=len(lists_db),
        study_sessions_count=total_study_count,
        today_reminders=[ReminderResponse.model_validate(r) for r in today_reminders_db],
        active_shopping_lists=shopping_lists_res,
        recent_study_sessions=study_sessions_res,
        recent_activities=recent_activities_res
    )


@router.post("/command", response_model=CommandResponse)
def execute_dashboard_command(
    payload: CommandRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Intelligent command input routing.
    Analyzes user intent and routes to Shopping, Reminders, or Study.
    """
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Command query cannot be empty")

    lower = query.lower()

    # Reminder Intent Detection
    reminder_keywords = ["remind", "reminder", "alarm", "মনে করিয়ে", "রিমাইন্ডার", "ডেডলাইন", "deadline", "কাল সকাল", "বিকাল", "schedule"]
    if any(k in lower or k in query for k in reminder_keywords):
        parsed = parse_reminder(query, current_time_iso=now_dhaka().isoformat())
        if parsed.get("status") == "ready" and parsed.get("data"):
            # Auto-save reminder
            data = parsed["data"]
            new_r = Reminder(
                user_id=current_user.id,
                title=data["title"],
                due_date=datetime.strptime(data["due_date"], "%Y-%m-%d").date(),
                due_time=datetime.strptime(data["due_time"], "%H:%M:%S" if len(data["due_time"]) == 8 else "%H:%M").time(),
                repeat=data.get("repeat", "none"),
                status="pending"
            )
            db.add(new_r)
            db.commit()
            db.refresh(new_r)
            return CommandResponse(
                intent="reminder",
                message=f"Reminder created for {new_r.due_date} at {new_r.due_time}: \"{new_r.title}\"",
                action_url="/reminders",
                payload={"reminder_id": new_r.id}
            )
        else:
            return CommandResponse(
                intent="reminder",
                message=parsed.get("clarification_question") or "Please specify the date and time for the reminder.",
                action_url="/reminders",
                payload=parsed
            )

    # Shopping Intent Detection
    shopping_keywords = ["buy", "grocery", "groceries", "bazaar", "বাজার", "চাল", "ডাল", "তেল", "ডিম", "লবণ", "kg", "কেজি", "দোকান", "shopping"]
    if any(k in lower or k in query for k in shopping_keywords):
        parsed = parse_shopping_items(query, language=current_user.preferred_language)
        items = parsed.get("items", [])
        return CommandResponse(
            intent="shopping",
            message=f"Parsed {len(items)} shopping item(s). Open shopping to review and add to a list.",
            action_url="/shopping",
            payload={"items": items}
        )

    # Study Intent Detection
    study_keywords = ["study", "summarize", "summary", "explain", "quiz", "lecture", "পড়াশোনা", "অধ্যায়", "সারাংশ", "কুইজ"]
    if any(k in lower or k in query for k in study_keywords):
        return CommandResponse(
            intent="study",
            message="Ready to assist with your studies. Upload a document or paste material to start a session.",
            action_url="/study",
            payload={"suggested_title": query}
        )

    # Default / General Guidance
    return CommandResponse(
        intent="general",
        message="I can assist with Shopping lists, Reminders, and Study sessions. Try typing \"Add 2 kg rice to groceries\" or \"Remind me tomorrow at 9 AM to review notes\".",
        action_url=None,
        payload=None
    )
