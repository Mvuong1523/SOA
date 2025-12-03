# 🛒 Online Ordering Microservices System

Hệ thống đặt hàng trực tuyến sử dụng kiến trúc microservices với FastAPI, PostgreSQL, React, và Nginx.

**Sinh viên:** Lê Minh Vương - B21DCCN802

---

## 🚀 Quick Start

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Khởi động toàn bộ hệ thống
docker-compose up --build

# 3. Truy cập ứng dụng
# Frontend: http://localhost:3000
# API Gateway: http://localhost:8080
```

---

## 🏗️ Tech Stack

- **Backend:** Python FastAPI
- **Frontend:** React 18 + Tailwind CSS + Vite
- **Database:** PostgreSQL 15 (Database per Service)
- **Gateway:** Nginx
- **Auth:** JWT
- **Container:** Docker & Docker Compose

---

## 📦 Microservices Architecture

### Services (6 microservices)

| Service | Port | Endpoints |
|---------|------|-----------|
| **Make-Order** | 8007 | `POST /ordering` |
| **Auth** | 8001 | `POST /auth/login`, `GET /auth/validate` |
| **Customer** | 8003 | `GET /customers/{id}` |
| **Product** | 8002 | `GET /products`, `GET /products/{id}`, `GET /products/{id}/stock`, `PUT /products/{id}/stock` |
| **Cart** | 8004 | `GET /customers/{customer_id}/cart`, `POST`, `PUT`, `DELETE` |
| **Order** | 8005 | `GET /orders`, `POST /orders`, `PUT /orders/{id}/status` |

### Databases (Database per Service)

| Database | Port | Service |
|----------|------|---------|
| `auth_db` | 5433 | Auth Service |
| `customer_db` | 5434 | Customer Service |
| `product_db` | 5435 | Product Service |
| `cart_db` | 5436 | Cart Service |
| `order_db` | 5437 | Order Service |

### Infrastructure

- **Nginx Gateway:** Port 8080
- **Frontend:** Port 3000

---

## 👤 Demo Accounts

**Customer:**
- Username: `user` / Password: `user123`

**Admin:**
- Username: `admin` / Password: `admin123`

---

## 🔄 Order Flow

1. Validate Token → Auth Service
2. Verify Customer → Customer Service
3. Get Cart → Cart Service
4. Check Stock → Product Service
5. Update Stock → Product Service
6. Create Order → Order Service
7. Clear Cart → Cart Service
8. Return Result → Frontend

---

## 📁 Project Structure

```
.
├── docs/                    # Documentation & API specs
├── services/                # 6 microservices
│   ├── auth-service/
│   ├── customer-service/
│   ├── product-service/
│   ├── cart-service/
│   ├── order-service/
│   └── make-order-service/
├── frontend/                # React frontend
├── gateway/                 # Nginx config
├── scripts/                 # Database init scripts
└── docker-compose.yml
```

---

## 🛠️ Development

### Chạy service riêng lẻ:
```bash
cd services/product-service
pip install -r requirements.txt
uvicorn main:app --port 8002
```

### Chạy frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 🔍 API Testing

```bash
# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"user123"}'

# Get products
curl http://localhost:8080/products

# Place order
curl -X POST http://localhost:8080/ordering \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"12345","items":[{"product_id":1,"quantity":2}]}'
```

---

## 📚 Documentation

- **Architecture:** [docs/architecture.md](docs/architecture.md)
- **Analysis & Design:** [docs/analysis-and-design.md](docs/analysis-and-design.md)
- **API Specs:** [docs/api-specs/](docs/api-specs/)

---

## 🎯 Microservices Patterns

✅ Database per Service  
✅ API Gateway  
✅ Circuit Breaker Pattern  
✅ JWT Authentication  
✅ RESTful APIs  

---

## 🐛 Troubleshooting

```bash
# Check logs
docker-compose logs <service-name>

# Restart service
docker-compose restart <service-name>

# Rebuild
docker-compose up --build
```

---

## 📝 License

Educational purposes only.
