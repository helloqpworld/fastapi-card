from datetime import datetime
from fastapi import APIRouter, Depends
from idlelib.query import Query
from sqlalchemy.orm import Session

from app.dependency import get_db, get_current_user
from app.models import User
from app.schemes import OperationRequest, OperationResponse
from app.service import operations as operations_service

router = APIRouter()


@router.post(path="/operations/income", response_model=OperationResponse)
def add_income(operation: OperationRequest, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    return operations_service.add_income(db, current_user, operation)


@router.post(path="/operations/expense", response_model=OperationResponse)
def add_expense(operation: OperationRequest, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    return operations_service.add_expense(db, current_user, operation)


@router.get(path="/operations", response_model=list[OperationResponse])
def get_operations_list(
    wallet_id: int | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return operations_service.get_operations_list(db, user, wallet_id, date_from, date_to)