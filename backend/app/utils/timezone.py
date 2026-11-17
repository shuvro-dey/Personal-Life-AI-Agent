from datetime import datetime, timezone, date, time
from zoneinfo import ZoneInfo
from app.config import get_settings

settings = get_settings()
DHAKA_TZ = ZoneInfo(settings.DEFAULT_TIMEZONE)


def now_utc() -> datetime:
    """Return current datetime in UTC."""
    return datetime.now(timezone.utc)


def now_dhaka() -> datetime:
    """Return current datetime in Asia/Dhaka timezone."""
    return datetime.now(DHAKA_TZ)


def today_dhaka() -> date:
    """Return today's date in Asia/Dhaka timezone."""
    return now_dhaka().date()


def format_bangla_digits(number_str: str) -> str:
    """Convert western digits (0-9) to Bangla numerals."""
    bengali_digits = {'0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
                      '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'}
    return ''.join(bengali_digits.get(char, char) for char in str(number_str))


def format_western_digits(bangla_str: str) -> str:
    """Convert Bangla numerals to western digits."""
    reverse_map = {'০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
                   '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'}
    return ''.join(reverse_map.get(char, char) for char in str(bangla_str))
