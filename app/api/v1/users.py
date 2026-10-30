from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependency import get_db, get_current_user
from app.models import User
from app.schemes import UserRequest, UserResponce
from app.service import users as users_service

router = APIRouter()

@router.post(path="/users", response_model=UserResponce)
def create_user(payload: UserRequest, db: Session = Depends(get_db)):
    return users_service.create_user(db, payload.login)

@router.get(path="/users/me", response_model=UserResponce)
def get_current_user(current_user: User = Depends(get_current_user)):
    return UserResponce.model_validate(current_user)