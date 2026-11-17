import logging
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from app.database import SessionLocal
from app.models.reminder import Reminder
from app.utils.timezone import now_dhaka, today_dhaka

logger = logging.getLogger("scheduler_service")
scheduler = BackgroundScheduler()


def check_due_reminders_job():
    """Background job executed periodically to inspect due reminders in Asia/Dhaka time."""
    db = SessionLocal()
    try:
        current_date = today_dhaka()
        current_time = now_dhaka().time()

        # Query pending reminders whose scheduled datetime has arrived
        due_reminders = db.query(Reminder).filter(
            Reminder.status == "pending",
            (
                (Reminder.due_date < current_date) |
                ((Reminder.due_date == current_date) & (Reminder.due_time <= current_time))
            )
        ).all()

        if due_reminders:
            logger.info(f"Found {len(due_reminders)} due reminder(s) in background check.")

    except Exception as e:
        logger.error(f"Error checking due reminders: {str(e)}")
    finally:
        db.close()


def start_scheduler():
    """Start the APScheduler background scheduler."""
    if not scheduler.running:
        scheduler.add_job(
            check_due_reminders_job,
            "interval",
            seconds=30,
            id="due_reminders_checker",
            replace_existing=True
        )
        scheduler.start()
        logger.info("APScheduler started successfully.")


def stop_scheduler():
    """Stop the background scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")
