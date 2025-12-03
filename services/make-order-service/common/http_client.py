import os
from typing import Any, Dict, Optional
from collections import deque
import time

import requests
from fastapi import HTTPException
from pybreaker import CircuitBreaker


CB_RESET_TIMEOUT = int(os.getenv("CB_COOLDOWN_SECONDS", "30"))       # Thời gian chờ trước khi thử lại
CB_ERROR_RATE_THRESHOLD = float(os.getenv("CB_ERROR_RATE", "0.5"))   # Tỷ lệ lỗi: 50% (0.5)
CB_WINDOW_SIZE = int(os.getenv("CB_WINDOW_SIZE", "10"))              # Số requests để tính tỷ lệ
CB_MIN_REQUESTS = int(os.getenv("CB_MIN_REQUESTS", "5"))             # Số requests tối thiểu trước khi tính tỷ lệ
CACHE_TTL = int(os.getenv("CACHE_TTL_SECONDS", "300"))               # Cache time-to-live: 5 phút

_breakers: Dict[str, CircuitBreaker] = {}
_request_history: Dict[str, deque] = {}  # Lưu lịch sử requests để tính tỷ lệ
_circuit_state: Dict[str, str] = {}      # Trạng thái circuit: CLOSED, OPEN, HALF_OPEN
_response_cache: Dict[str, tuple] = {}   # Cache responses: {cache_key: (response, timestamp)}


def _get_breaker(name: str) -> CircuitBreaker:
    """
    Tạo circuit breaker với cấu hình:
    - fail_max: Set rất cao (999) để vô hiệu hóa cơ chế liên tiếp
    - reset_timeout: Thời gian chờ trước khi thử lại
    """
    if name not in _breakers:
        _breakers[name] = CircuitBreaker(
            fail_max=999,  # Set cao để chỉ dùng tỷ lệ lỗi
            reset_timeout=CB_RESET_TIMEOUT,
            name=f"{name}-breaker",
        )
        _request_history[name] = deque(maxlen=CB_WINDOW_SIZE)
        _circuit_state[name] = "CLOSED"
    return _breakers[name]


def _check_error_rate(service_name: str) -> bool:
    """
    Kiểm tra tỷ lệ lỗi trong sliding window.
    Returns True nếu vượt ngưỡng (cần mở circuit).
    """
    if service_name not in _request_history:
        return False
    
    history = _request_history[service_name]
    
    # Cần ít nhất CB_MIN_REQUESTS để tính tỷ lệ
    if len(history) < CB_MIN_REQUESTS:
        return False
    
    # Đếm số lỗi
    error_count = sum(1 for success in history if not success)
    error_rate = error_count / len(history)
    
    # Log để debug
    print(f"[Circuit Breaker] {service_name}: {error_count}/{len(history)} errors = {error_rate:.1%} (threshold: {CB_ERROR_RATE_THRESHOLD:.1%})")
    
    return error_rate >= CB_ERROR_RATE_THRESHOLD


def _record_request(service_name: str, success: bool):
    """Ghi nhận kết quả request vào history"""
    if service_name not in _request_history:
        _request_history[service_name] = deque(maxlen=CB_WINDOW_SIZE)
    _request_history[service_name].append(success)


def _get_cache_key(service_name: str, method: str, path: str, kwargs: Dict) -> str:
    """Tạo cache key từ request parameters"""
    # Chỉ cache GET requests
    if method.lower() != "get":
        return None
    
    params_str = str(kwargs.get("params", ""))
    return f"{service_name}:{method}:{path}:{params_str}"


def _get_cached_response(cache_key: str) -> Optional[requests.Response]:
    """Lấy cached response nếu còn valid"""
    if not cache_key or cache_key not in _response_cache:
        return None
    
    cached_resp, timestamp = _response_cache[cache_key]
    
    # Kiểm tra TTL
    if time.time() - timestamp > CACHE_TTL:
        # Cache expired
        del _response_cache[cache_key]
        return None
    
    print(f"[Circuit Breaker] Using cached response for {cache_key}")
    return cached_resp


def _cache_response(cache_key: str, response: requests.Response):
    """Cache response nếu là GET request thành công"""
    if cache_key and response.status_code == 200:
        _response_cache[cache_key] = (response, time.time())


def request_with_cb(
    service_name: str,
    base_url: str,
    method: str,
    path: str,
    *,
    timeout: int = 5,
    use_fallback: bool = True,
    **kwargs: Any,
) -> requests.Response:
    """
    Gọi HTTP request với Circuit Breaker protection và Fallback strategy.
    
    Cơ chế Circuit Breaker:
    - Tính tỷ lệ lỗi trong sliding window (CB_WINDOW_SIZE requests gần nhất)
    - Nếu error_rate >= CB_ERROR_RATE_THRESHOLD → Circuit OPEN
    - Circuit OPEN: Chặn tất cả requests
    - Sau CB_RESET_TIMEOUT giây: Circuit HALF-OPEN, thử 1 request
    - Request thành công → Circuit CLOSED, thất bại → Circuit OPEN lại
    
    Fallback Strategy:
    - Khi circuit OPEN hoặc service unreachable:
      * GET requests: Trả về cached response (nếu có)
      * POST/PUT/DELETE: Raise exception (không thể dùng cache)
    - Cache TTL: CACHE_TTL_SECONDS (mặc định 5 phút)
    
    Args:
        service_name: Tên service (để tracking circuit state)
        base_url: Base URL của service
        method: HTTP method (GET, POST, PUT, DELETE)
        path: Request path
        timeout: Request timeout (giây)
        use_fallback: Có sử dụng fallback strategy không (mặc định True)
        **kwargs: Các tham số khác cho requests.request()
    
    Returns:
        requests.Response object
        
    Raises:
        HTTPException: Khi service không khả dụng và không có fallback
    """
    url = f"{base_url}{path}"
    breaker = _get_breaker(service_name)
    cache_key = _get_cache_key(service_name, method, path, kwargs)
    
    # Kiểm tra trạng thái circuit
    current_state = _circuit_state.get(service_name, "CLOSED")
    
    # Nếu circuit đang OPEN, thử dùng cached response
    if current_state == "OPEN":
        if breaker.current_state == "open":
            if use_fallback and cache_key:
                cached = _get_cached_response(cache_key)
                if cached:
                    print(f"[Circuit Breaker] {service_name}: Circuit OPEN, using cached response")
                    return cached
            
            # Không có cache hoặc không phải GET request
            raise HTTPException(
                status_code=503,
                detail=f"Circuit OPEN for {service_name}: Error rate exceeded {CB_ERROR_RATE_THRESHOLD:.0%}. No cached data available."
            )
    
    # Kiểm tra tỷ lệ lỗi trước khi gọi
    if _check_error_rate(service_name):
        # Tỷ lệ lỗi vượt ngưỡng → Mở circuit
        _circuit_state[service_name] = "OPEN"
        breaker.open()
        
        # Thử dùng cached response
        if use_fallback and cache_key:
            cached = _get_cached_response(cache_key)
            if cached:
                print(f"[Circuit Breaker] {service_name}: Circuit OPEN, using cached response")
                return cached
        
        raise HTTPException(
            status_code=503,
            detail=f"Circuit OPEN for {service_name}: Error rate {_get_current_error_rate(service_name):.0%} exceeded threshold {CB_ERROR_RATE_THRESHOLD:.0%}. No cached data available."
        )

    try:
        # Gọi service
        resp = requests.request(method=method, url=url, timeout=timeout, **kwargs)
        
        # Cache response nếu thành công
        _cache_response(cache_key, resp)
        
        # Ghi nhận success
        _record_request(service_name, success=True)
        
        # Nếu thành công và circuit đang HALF-OPEN → Đóng circuit
        if current_state == "OPEN":
            _circuit_state[service_name] = "CLOSED"
            print(f"[Circuit Breaker] {service_name}: Circuit CLOSED (recovered)")
        
        return resp
        
    except requests.RequestException as exc:
        # Ghi nhận failure
        _record_request(service_name, success=False)
        
        # Thử dùng cached response
        if use_fallback and cache_key:
            cached = _get_cached_response(cache_key)
            if cached:
                print(f"[Circuit Breaker] {service_name}: Service unreachable, using cached response")
                return cached
        
        raise HTTPException(
            status_code=502,
            detail=f"{service_name} unreachable: {exc}. No cached data available."
        )


def _get_current_error_rate(service_name: str) -> float:
    """Lấy tỷ lệ lỗi hiện tại"""
    if service_name not in _request_history:
        return 0.0
    
    history = _request_history[service_name]
    if len(history) == 0:
        return 0.0
    
    error_count = sum(1 for success in history if not success)
    return error_count / len(history)
