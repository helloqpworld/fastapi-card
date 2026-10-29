from fastapi import HTTPException

from app.database import SessionLocal # <-- Импортируем фабрику сессий
from app.schemes import OperationRequest
from app.repository import wallets as wallets_repository

def add_income(operation: OperationRequest):
    # Проверить существует ли кошелек
    db = SessionLocal() # <-- Создаем сессию, привязанную к БД
    try:
        if not wallets_repository.is_wallet_exist(db, operation.wallet_name):
            raise HTTPException(
                status_code=404,
                detail=f"Wallet '{operation.wallet_name}' not found"
            )
        
        # Добавить доход к балансу кошелька
        wallet = wallets_repository.add_income(db, operation.wallet_name, operation.amount)
        db.commit()
        # Возратить информацию по операции
        return {
            "message": "Income added",
            "wallet": operation.wallet_name,
            "amount": operation.amount,
            "description": operation.description,
            "current_balance": wallet.balance
        }
    finally:
        db.close()

def add_expense(operation: OperationRequest):
    # Проверить существует ли кошелек
    db = SessionLocal() # <-- Создаем сессию, привязанную к БД
    try:
        if not wallets_repository.is_wallet_exist(db, operation.wallet_name):
            raise HTTPException(
                status_code=404,
                detail=f"Wallet '{operation.wallet_name}' not found"
            )

        # Проверяем достаточно ли средств
        wallet = wallets_repository.get_wallet_balance_by_name(db, operation.wallet_name)
        if operation.amount > wallet.balance:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient funds. Available: {wallet.balance}"
            )
        
        # Вычитаем расход из баланса кошелька
        wallet = wallets_repository.add_expense(db, operation.wallet_name, operation.amount)
        db.commit()
        # Возратить информацию об операции
        return {
            "message": "Expense added",
            "wallet": operation.wallet_name,
            "amount": operation.amount,
            "description": operation.description,
            "current_balance": wallet.balance
        }
    finally:
        db.close()