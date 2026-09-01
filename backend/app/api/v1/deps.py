from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.core.security import decode_token

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    # 1. Try reading access_token from HttpOnly cookie
    token = request.cookies.get("access_token")
    
    # 2. Fallback to Authorization header if cookie not present
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        # For development / guest convenience, check if a demo user can be auto-created/used
        demo_user = db.query(User).filter(User.email == "demo@asklytix.com").first()
        if not demo_user:
            from app.core.security import get_password_hash
            demo_user = User(
                email="demo@asklytix.com",
                name="Data Analyst",
                hashed_password=get_password_hash("DemoPass123!")
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        return demo_user

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user

def get_optional_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    try:
        return get_current_user(request, db)
    except Exception:
        return None
