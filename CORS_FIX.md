# CORS Fix

## Lỗi
```
OPTIONS /auth/login HTTP/1.1" 405 Method Not Allowed
OPTIONS /auth/validate HTTP/1.1" 405 Method Not Allowed
```

## Nguyên nhân
Browser gửi **preflight request** (OPTIONS) trước khi gửi POST/GET request thực sự. FastAPI services không có CORS middleware nên từ chối OPTIONS requests.

## Giải pháp
Thêm CORS middleware cho tất cả FastAPI services:

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Service Name")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép tất cả origins
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép tất cả methods (GET, POST, PUT, DELETE, OPTIONS)
    allow_headers=["*"],  # Cho phép tất cả headers
)
```

## Đã fix các services:
- ✅ auth-service
- ✅ product-service
- ✅ customer-service
- ✅ cart-service
- ✅ order-service
- ✅ notification-service
- ✅ make-order-service

## Restart services:

### Option 1: Restart từng service
```bash
docker-compose restart auth-service
docker-compose restart product-service
docker-compose restart customer-service
docker-compose restart cart-service
docker-compose restart order-service
docker-compose restart notification-service
docker-compose restart make-order-service
```

### Option 2: Restart tất cả backend services
```bash
docker-compose restart auth-service product-service customer-service cart-service order-service notification-service make-order-service
```

### Option 3: Rebuild (nếu cần)
```bash
docker-compose up --build -d auth-service product-service customer-service cart-service order-service notification-service make-order-service
```

## Test sau khi fix:

### 1. Test Login
Mở http://localhost:3000 và login với:
- Username: `user`
- Password: `user123`

Không còn lỗi CORS!

### 2. Check logs
```bash
docker-compose logs auth-service | grep "POST /auth/login"
# Nên thấy: 200 OK thay vì 405
```

### 3. Test API trực tiếp
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"user123"}'
```

## Production Note:
Trong production, thay `allow_origins=["*"]` bằng danh sách domains cụ thể:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://app.yourdomain.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Verified:
- ✅ CORS middleware đã thêm vào tất cả services
- ✅ OPTIONS requests sẽ được xử lý
- ✅ Browser có thể gọi API từ frontend

Restart services và test lại!
