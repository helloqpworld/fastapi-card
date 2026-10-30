from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependency import get_db, get_current_user
from app.models import User
from app.schemes import CreateWalletRequest
from app.service import wallets as wallets_service

router = APIRouter()

@router.get("/balance")
def get_balance(wallet_name: str | None = None, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    return wallets_service.get_balance(db, current_user, wallet_name)

@router.post("/wallet")
def create_wallet(wallet: CreateWalletRequest, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    return wallets_service.create_wallet(db, current_user, wallet)