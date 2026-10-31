from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal # <-- Импортируем фабрику сессий
from app.models import User
from app.schemes import OperationRequest, OperationResponse
from app.repository import wallets as wallets_repository
from app.repository import operations as operations_repository

def add_income(db: Session, current_user: User, operation: OperationRequest) -> OperationResponse:
    # Проверить существует ли кошелек
    if not wallets_repository.is_wallet_exist(db, current_user.id, operation.wallet_name):
        raise HTTPException(
            status_code=404,
            detail=f"Wallet '{operation.wallet_name}' not found"
        )
    # Добавить доход к балансу кошелька
    wallet = wallets_repository.add_income(db, current_user.id, operation.wallet_name, operation.amount)
    operation = operations_repository.create_operation(
        db=db,
        wallet_id=wallet.id,
        type="income",
        amount=operation.amount,
        currency=wallet.currency,
        category=operation.description,
    )
    db.commit()
    # Возратить информацию по операции
    return OperationResponse.model_validate(operation)

def add_expense(db: Session, current_user: User, operation: OperationRequest) -> OperationResponse:
    # Проверить существует ли кошелек
    if not wallets_repository.is_wallet_exist(db, current_user.id, operation.wallet_name):
        raise HTTPException(
            status_code=404,
            detail=f"Wallet '{operation.wallet_name}' not found"
        )
    # Проверяем достаточно ли средств
    wallet = wallets_repository.get_wallet_balance_by_name(db, current_user.id, operation.wallet_name)
    if operation.amount > wallet.balance:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient funds. Available: {wallet.balance}"
        )
    # Вычитаем расход из баланса кошелька
    wallet = wallets_repository.add_expense(db, current_user.id, operation.wallet_name, operation.amount)
    operation = operations_repository.create_operation(
        db=db,
        wallet_id=wallet.id,
        type="expense",
        amount=operation.amount,
        currency=wallet.currency,
        category=operation.description,
    )
    db.commit()
    # Возратить информацию об операции
    return OperationResponse.model_validate(operation)


def get_operations_list(
    db: Session,
    current_user: User,
    wallet_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None
) -> list[OperationResponse]:

    if wallet_id:
        wallet = wallets_repository.get_wallet_by_id(db, current_user.id, wallet_id)
        if not wallet:
            raise HTTPException(
                status_code=404,
                detail=f"Wallet '{wallet_id}' not found"
            )
        wallets_ids = [wallet.id]
    else:
        wallets = wallets_repository.get_all_wallets(db, current_user.id)
        wallets_ids = [w.id for w in wallets]

    operations = operations_repository.get_operations_list(
        db,
        wallets_ids,
        date_from,
        date_to
    )
    result = []
    for operation in operations:
        result.append(OperationResponse.model_validate(operation))
    return result