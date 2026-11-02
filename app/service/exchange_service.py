import aiohttp
import requests
from decimal import Decimal
from typing import Dict, Tuple

from app.enum import CurrencyEnum


FALLBACK_RATES: Dict[Tuple[str, str], Decimal] = {
    (CurrencyEnum.USD, CurrencyEnum.RUB): Decimal(str(95.0)),
    (CurrencyEnum.USD, CurrencyEnum.EUR): Decimal(str(0.92)),
    (CurrencyEnum.RUB, CurrencyEnum.USD): Decimal(str(0.0105)),
    (CurrencyEnum.RUB, CurrencyEnum.EUR): Decimal(str(0.0097)),
    (CurrencyEnum.EUR, CurrencyEnum.RUB): Decimal(str(103.26)),
    (CurrencyEnum.EUR, CurrencyEnum.USD): Decimal(str(1.087)),
}

FALLBACK_RATES_SCHEMS: Dict[Tuple[str, str], str] = {
    (CurrencyEnum.USD, CurrencyEnum.RUB): "USD_RUB_in",
    (CurrencyEnum.USD, CurrencyEnum.EUR): "USD_EUR_in",
    (CurrencyEnum.RUB, CurrencyEnum.USD): "USD_RUB_out",
    (CurrencyEnum.RUB, CurrencyEnum.EUR): "RUB_EUR_in",
    (CurrencyEnum.EUR, CurrencyEnum.RUB): "RUB_EUR_out",
    (CurrencyEnum.EUR, CurrencyEnum.USD): "USD_EUR_out",
}


async def get_exchange_rate(base: CurrencyEnum, target: CurrencyEnum) -> Decimal:
    url = "https://belarusbank.by/api/kursExchange"
    timeout = aiohttp.ClientTimeout(total=5.0)
    params = {"city": "Брест"}
    try:
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url, params=params) as response:
                response.raise_for_status()
                data = await response.json()
                data = data[0]
                res = FALLBACK_RATES_SCHEMS.get((base, target), Decimal(1))
        return Decimal(data[res])

    except Exception:
        return FALLBACK_RATES.get((base, target), Decimal(1))