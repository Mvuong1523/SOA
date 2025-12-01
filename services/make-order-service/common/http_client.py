import os
from typing import Any, Dict

import requests
from fastapi import HTTPException
from pybreaker import CircuitBreaker

# Hystrix không có SDK Python; pybreaker là lựa chọn tương đương để có circuit breaker.

CB_FAILURE_THRESHOLD = int(os.getenv("CB_THRESHOLD", "3"))
CB_RESET_TIMEOUT = int(os.getenv("CB_COOLDOWN_SECONDS", "30"))

# Mỗi service có một breaker riêng
_breakers: Dict[str, CircuitBreaker] = {}


def _get_breaker(name: str) -> CircuitBreaker:
    if name not in _breakers:
        _breakers[name] = CircuitBreaker(
            fail_max=CB_FAILURE_THRESHOLD,
            reset_timeout=CB_RESET_TIMEOUT,
            name=f"{name}-breaker",
        )
    return _breakers[name]


def request_with_cb(
    service_name: str,
    base_url: str,
    method: str,
    path: str,
    *,
    timeout: int = 5,
    **kwargs: Any,
) -> requests.Response:
    url = f"{base_url}{path}"
    breaker = _get_breaker(service_name)

    @breaker
    def _call() -> requests.Response:
        try:
            return requests.request(method=method, url=url, timeout=timeout, **kwargs)
        except requests.RequestException as exc:
            # Đẩy lỗi lên để breaker ghi nhận
            raise HTTPException(status_code=502, detail=f"{service_name} unreachable: {exc}")

    try:
        resp = _call()
    except HTTPException:
        # Lỗi do requests: đã chuyển thành HTTPException
        raise
    except Exception as exc:
        # Circuit open hoặc lỗi breaker khác
        raise HTTPException(status_code=503, detail=f"Circuit open for {service_name}: {exc}")

    return resp
