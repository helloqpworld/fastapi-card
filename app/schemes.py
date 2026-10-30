from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


class OperationRequest(BaseModel):
    wallet_name: str = Field(..., max_length=127)
    amount: Decimal
    description: str | None = Field(None, max_length=255)

    @field_validator('amount')
    def amount_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v

    @field_validator('wallet_name')
    def wallet_name_not_empty(cls, v: str) -> str:
        # Убрать пробелы по краям
        v = v.strip()
        # Проверяем что строка не пустая
        if not v:
            raise ValueError("Wallet name cannot be empty")
        return v


class CreateWalletRequest(BaseModel):
    name: str = Field(..., max_length=127)
    initial_balance: Decimal = 0

    @field_validator('name')
    def name_not_empty(cls, v: str) -> str:
        # Убрать пробелы по краям
        v = v.strip()
        # Проверяем что строка не пустая
        if not v:
            raise ValueError("Wallet name cannot be empty")
        return v

    @field_validator('initial_balance')
    def amount_is_positive(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError('Amouth must be positive')
        return v


class UserRequest(BaseModel):
    login: str = Field(..., max_length=64)

class UserResponce(UserRequest):
    model_config = {'from_attributes': True}

    id: int