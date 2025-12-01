# Circuit Breaker Pattern Implementation

## 📍 Location
`services/make-order-service/common/http_client.py`

## 🎯 Purpose
Implement Circuit Breaker pattern để bảo vệ hệ thống khi một service downstream bị lỗi hoặc chậm response.

---

## 🔧 Implementation

### Library Used
**pybreaker** - Python implementation của Circuit Breaker pattern (tương tự Hystrix của Netflix)

### Configuration
```python
CB_FAILURE_THRESHOLD = int(os.getenv("CB_THRESHOLD", "3"))
CB_RESET_TIMEOUT = int(os.getenv("CB_COOLDOWN_SECONDS", "30"))
```

**Environment Variables:**
- `CB_THRESHOLD`: Số lần fail liên tiếp trước khi circuit mở (default: 3)
- `CB_COOLDOWN_SECONDS`: Thời gian chờ trước khi thử lại (default: 30s)

---

## 🔄 Circuit States

### 1. **CLOSED** (Normal)
- Circuit đóng, requests được gửi bình thường
- Nếu fail < threshold → vẫn CLOSED
- Nếu fail >= threshold → chuyển sang OPEN

### 2. **OPEN** (Failing)
- Circuit mở, requests bị reject ngay lập tức
- Không gọi service downstream
- Trả về lỗi 503 "Circuit open"
- Sau `reset_timeout` → chuyển sang HALF_OPEN

### 3. **HALF_OPEN** (Testing)
- Cho phép 1 request thử nghiệm
- Nếu success → chuyển về CLOSED
- Nếu fail → quay lại OPEN

---

## 📊 Flow Diagram

```
┌─────────┐
│ CLOSED  │ ◄─────────────────┐
│ (Normal)│                   │
└────┬────┘                   │
     │                        │
     │ Fail >= 3 times        │ Success
     │                        │
     ▼                        │
┌─────────┐                   │
│  OPEN   │                   │
│(Failing)│                   │
└────┬────┘                   │
     │                        │
     │ After 30s              │
     │                        │
     ▼                        │
┌──────────┐                  │
│HALF_OPEN │──────────────────┘
│(Testing) │
└──────────┘
```

---

## 💻 Code Structure

### Per-Service Breakers
```python
_breakers: Dict[str, CircuitBreaker] = {}

def _get_breaker(name: str) -> CircuitBreaker:
    if name not in _breakers:
        _breakers[name] = CircuitBreaker(
            fail_max=CB_FAILURE_THRESHOLD,
            reset_timeout=CB_RESET_TIMEOUT,
            name=f"{name}-breaker",
        )
    return _breakers[name]
```

**Mỗi service có breaker riêng:**
- `auth-breaker`
- `customer-breaker`
- `product-breaker`
- `order-breaker`
- `cart-breaker`
- `notification-breaker`

### Request Wrapper
```python
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
            raise HTTPException(status_code=502, detail=f"{service_name} unreachable: {exc}")

    try:
        resp = _call()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Circuit open for {service_name}: {exc}")

    return resp
```

---

## 🎯 Usage in Make-Order-Service

### Example: Validate Token
```python
def _validate_token(auth_header: str) -> str:
    resp = request_with_cb(
        "auth",                              # Service name
        SERVICE_URLS["auth"],                # Base URL
        "get",                               # HTTP method
        "/auth/validate",                    # Path
        headers={"Authorization": auth_header}
    )
    if resp.status_code != 200:
        _raise_http_error(resp, 401)
    return str(resp.json().get("customer_id"))
```

### Example: Check Stock
```python
def _check_stock(product_id: int, quantity: int):
    resp = request_with_cb(
        "product",
        SERVICE_URLS["product"],
        "get",
        f"/products/{product_id}/stock",
        params={"quantity": quantity},
    )
    if resp.status_code != 200:
        _raise_http_error(resp, 404)
    data = resp.json()
    if not data.get("available"):
        raise HTTPException(status_code=400, detail=f"Product {product_id} insufficient stock")
```

---

## 🧪 Testing Circuit Breaker

### Scenario 1: Normal Operation (CLOSED)
```bash
# All services running
# Circuit: CLOSED
# Requests: Success ✅
```

### Scenario 2: Service Down (OPEN)
```bash
# Stop product-service
docker-compose stop product-service

# Try to place order
# 1st request: Fail (count: 1)
# 2nd request: Fail (count: 2)
# 3rd request: Fail (count: 3) → Circuit OPEN
# 4th request: Immediate 503 "Circuit open" (no call to service)
```

### Scenario 3: Service Recovery (HALF_OPEN → CLOSED)
```bash
# Start product-service
docker-compose start product-service

# Wait 30 seconds (reset_timeout)
# Circuit: HALF_OPEN

# Next request: Success → Circuit CLOSED
# System recovered! ✅
```

---

## 📈 Benefits

### 1. **Fail Fast**
- Không chờ timeout khi service down
- Trả về lỗi ngay lập tức
- Giảm response time

### 2. **Prevent Cascade Failures**
- Service A down → không làm chết Service B
- Cô lập lỗi
- Hệ thống vẫn hoạt động một phần

### 3. **Automatic Recovery**
- Tự động thử lại sau cooldown
- Không cần manual intervention
- Self-healing system

### 4. **Resource Protection**
- Không waste threads/connections
- Giảm load lên service đang lỗi
- Cho service thời gian recover

---

## 🔧 Configuration Options

### Environment Variables
```bash
# .env file
CB_THRESHOLD=3              # Fail 3 lần → circuit open
CB_COOLDOWN_SECONDS=30      # Chờ 30s trước khi thử lại
```

### Tuning Guidelines

**High Traffic System:**
```bash
CB_THRESHOLD=5              # Cho phép nhiều lỗi hơn
CB_COOLDOWN_SECONDS=60      # Chờ lâu hơn
```

**Low Latency System:**
```bash
CB_THRESHOLD=2              # Fail nhanh
CB_COOLDOWN_SECONDS=10      # Thử lại nhanh
```

**Critical Services:**
```bash
CB_THRESHOLD=1              # Không chấp nhận lỗi
CB_COOLDOWN_SECONDS=120     # Chờ lâu trước khi thử lại
```

---

## 📊 Monitoring

### Check Circuit State
```python
# In code
breaker = _get_breaker("product")
print(f"State: {breaker.current_state}")
print(f"Fail count: {breaker.fail_counter}")
```

### Logs
```bash
# Check make-order-service logs
docker-compose logs make-order-service | grep "Circuit"

# Look for:
# - "Circuit open for product"
# - "product unreachable"
```

---

## 🎯 Real-World Example

### Order Placement Flow with Circuit Breaker

```python
@app.post("/ordering")
def ordering(request: OrderingRequest, authorization: str | None = Header(default=None)):
    # 1. Validate token (with circuit breaker)
    validated_customer_id = _validate_token(auth_header)
    # If auth-service down 3 times → circuit open → 503 immediately
    
    # 2. Get customer (with circuit breaker)
    customer = _get_customer(request.customer_id)
    # If customer-service down → circuit open → 503
    
    # 3. Check stock (with circuit breaker)
    for item in request.items:
        _check_stock(item.product_id, item.quantity)
    # If product-service down → circuit open → 503
    
    # 4. Update stock (with circuit breaker)
    for item in request.items:
        _update_stock(item.product_id, item.quantity)
    
    # 5. Create order (with circuit breaker)
    order = _create_order(...)
    
    # 6. Send notification (with circuit breaker)
    _send_notification(customer.get("email", ""), order.get("id"))
    # If notification fails → circuit open but order still created
    
    return {"status": "success", "order": order}
```

---

## 🚀 Advanced Features

### Per-Service Configuration (Future Enhancement)
```python
# Different thresholds for different services
BREAKER_CONFIG = {
    "auth": {"threshold": 2, "timeout": 60},      # Critical
    "product": {"threshold": 3, "timeout": 30},   # Normal
    "notification": {"threshold": 5, "timeout": 10}  # Non-critical
}
```

### Metrics & Alerting (Future Enhancement)
```python
# Export metrics to Prometheus
from prometheus_client import Counter, Gauge

circuit_open_count = Counter('circuit_breaker_open_total', 'Circuit breaker opened', ['service'])
circuit_state = Gauge('circuit_breaker_state', 'Circuit breaker state', ['service'])
```

---

## 📚 References

- **pybreaker**: https://github.com/danielfm/pybreaker
- **Netflix Hystrix**: https://github.com/Netflix/Hystrix
- **Martin Fowler - Circuit Breaker**: https://martinfowler.com/bliki/CircuitBreaker.html

---

## ✅ Summary

Circuit Breaker pattern đã được implement trong `make-order-service` để:
- ✅ Bảo vệ hệ thống khỏi cascade failures
- ✅ Fail fast khi service downstream down
- ✅ Tự động recovery khi service khôi phục
- ✅ Mỗi service có breaker riêng
- ✅ Configurable thresholds và timeouts

**Status**: ✅ Implemented and Working!
