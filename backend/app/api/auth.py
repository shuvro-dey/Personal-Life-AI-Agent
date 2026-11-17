import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.schemas.user import UserResponse, UserUpdate
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account with email and password."""
    # Check if email already in use
    existing_user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )

    # Hash password with bcrypt - never stored as plain text
    hashed = hash_password(request.password)

    new_user = User(
        email=request.email.lower().strip(),
        password_hash=hashed,
        name=request.name.strip(),
        preferred_language=request.preferred_language or "en",
        timezone="Asia/Dhaka"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit log
    audit = AuditLog(
        user_id=new_user.id,
        action="user_registered",
        details_json=json.dumps({"email": new_user.email, "language": new_user.preferred_language}),
        status="success"
    )
    db.add(audit)
    db.commit()

    token = create_access_token(user_id=new_user.id, email=new_user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate existing user and issue a JWT token."""
    user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="user_login",
        details_json=json.dumps({"email": user.email}),
        status="success"
    )
    db.add(audit)
    db.commit()

    token = create_access_token(user_id=user.id, email=user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve the current logged-in user's profile."""
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
def update_profile(
    updates: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update profile preferences such as language or timezone."""
    if updates.name is not None and updates.name.strip():
        current_user.name = updates.name.strip()
    if updates.preferred_language in ["en", "bn"]:
        current_user.preferred_language = updates.preferred_language
    if updates.timezone is not None and updates.timezone.strip():
        current_user.timezone = updates.timezone.strip()

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
