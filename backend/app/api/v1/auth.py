from datetime import timedelta
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.api.v1.deps import get_current_user

router = APIRouter()

class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str

def set_auth_cookies(response: Response, user_id: str):
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)

    # 15 minutes for access token
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    # 7 days for refresh token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )

def clear_auth_cookies(response: Response):
    response.delete_cookie(key="access_token", path="/", httponly=True, samesite=settings.COOKIE_SAMESITE)
    response.delete_cookie(key="refresh_token", path="/", httponly=True, samesite=settings.COOKIE_SAMESITE)

@router.post("/signup", response_model=Dict[str, Any])
def signup(req: UserRegisterRequest, response: Response, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user = User(
        name=req.name,
        email=req.email,
        hashed_password=get_password_hash(req.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    set_auth_cookies(response, user.id)

    return {
        "success": True,
        "message": "User registered successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "createdAt": user.created_at.isoformat()
        }
    }

@router.post("/login", response_model=Dict[str, Any])
def login(req: UserLoginRequest, response: Response, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    # Auto-seed demo account if needed
    if not user and email_clean in {"demo@asklytix.com", "google.user@asklytix.ai", "analyst@asklytix.ai"}:
        user = User(
            name="Data Analyst" if "demo" in email_clean or "analyst" in email_clean else "Google User",
            email=email_clean,
            hashed_password=get_password_hash(req.password or "Demo1234!")
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user or not verify_password(req.password, user.hashed_password):
        # If demo login attempt with standard password
        if email_clean == "demo@asklytix.com" and req.password in {"Demo1234!", "password", "demo1234", "123456"}:
            if user:
                user.hashed_password = get_password_hash("Demo1234!")
                db.commit()
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password. Please try Demo Login or check your credentials."
            )

    # ZERO-PERSISTENCE: Clear any stale leftover files from previous session
    try:
        from app.services.storage_manager import StorageManager
        StorageManager.purge_user_storage(user.id, db)
    except Exception:
        pass

    set_auth_cookies(response, user.id)

    return {
        "success": True,
        "message": "Logged in successfully (Fresh Session)",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "createdAt": user.created_at.isoformat()
        }
    }

from app.services.storage_manager import StorageManager

@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    user_id = None
    token = request.cookies.get("access_token") or request.cookies.get("refresh_token")
    if token:
        try:
            payload = decode_token(token)
            if payload and "sub" in payload:
                user_id = payload["sub"]
        except Exception:
            pass

    # Purge all physical dataset files and DB records for zero persistence
    StorageManager.purge_user_storage(user_id, db)
    clear_auth_cookies(response)
    return {"success": True, "message": "Logged out and all session data removed from storage"}

@router.post("/refresh")
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")

    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Issue new access token cookie
    new_access_token = create_access_token(user.id)
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    return {"success": True, "message": "Access token refreshed"}

@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "createdAt": user.created_at.isoformat()
    }
