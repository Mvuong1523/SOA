# Online Ordering Microservices

Hệ thống đặt hàng trực tuyến sử dụng kiến trúc microservices với FastAPI, PostgreSQL, React + Tailwind CSS, và Nginx gateway.

## 

- Lê Minh Vương - B21DCCN802

## Tech Stack
- **Backend**: Python FastAPI
- **Frontend**: React 18 + Tailwind CSS + Vite
- **Database**: PostgreSQL 15
- **Gateway**: Nginx
- **Container**: Docker & Docker Compose
- **Authentication**: JWT (JSON Web Tokens)

## Architecture

Hệ thống bao gồm 7 microservices chính:

### 1. Auth Service (Port 8001)
- `POST /auth/login` - Đăng nhập và nhận JWT token
- `GET /auth/validate` - Xác thực token JWT

### 2. Customer Service (Port 8003)
- `GET /customers/{id}` - Lấy thông tin khách hàng

### 3. Product Service (Port 8002)
- `GET /products` - Danh sách sản phẩm
- `GET /products/{id}` - Chi tiết sản phẩm
- `POST /products` - Tạo sản phẩm (Admin only)
- `PUT /products/{id}` - Cập nhật sản phẩm (Admin only)
- `DELETE /products/{id}` - Xóa sản phẩm (Admin only)
- `GET /products/{id}/stock` - Kiểm tra tồn kho
- `PUT /products/{id}/stock` - Cập nhật tồn kho

### 4. Cart Service (Port 8004)
- `GET /customers/{customer_id}/cart` - Lấy giỏ hàng
- `POST /customers/{customer_id}/cart` - Thêm vào giỏ
- `PUT /customers/{customer_id}/cart/{product_id}` - Cập nhật số lượng
- `DELETE /customers/{customer_id}/cart/{product_id}` - Xóa khỏi giỏ
- `DELETE /customers/{customer_id}/cart` - Xóa toàn bộ giỏ

### 5. Order Service (Port 8005)
- `POST /orders` - Tạo đơn hàng
- `GET /orders` - Danh sách đơn hàng
- `GET /orders/{id}` - Chi tiết đơn hàng
- `PUT /orders/{id}/status` - Cập nhật trạng thái (Admin only)

### 6. Notification Service (Port 8006)
- `POST /notifications/email` - Gửi email thông báo
- **Event Consumer**: Lắng nghe `order.created` events từ RabbitMQ

### 7. Make Order Service (Port 8007)
- `POST /ordering` - Orchestrate quy trình đặt hàng hoàn chỉnh
- **Event Publisher**: Publish `order.created` events tới RabbitMQ

### 8. RabbitMQ (Ports 5672, 15672)
- Message broker cho event-driven communication
- Management UI: http://localhost:15672
- Username: `admin` / Password: `admin123`
- Queue: `order.created` - Thông báo khi có đơn hàng mới

### Gateway (Port 8080)
- Nginx reverse proxy cho tất cả services

### Micro-Frontends Architecture
Mỗi service có UI riêng biệt để đảm bảo tính độc lập:

- **Product Frontend** (Port 3002) - Quản lý sản phẩm
- **Cart Frontend** (Port 3004) - Quản lý giỏ hàng
- **Order Frontend** (Port 3005) - Quản lý đơn hàng
- **Main Frontend** (Port 3000) - Orchestrator tích hợp tất cả

## Prerequisites
- Docker & Docker Compose
- (Optional) Node.js 18+ để chạy frontend locally
- (Optional) Python 3.11+ để chạy services locally

## Quick Start

### 1. Clone và setup environment
```bash
# Copy environment variables
cp .env.example .env

# (Optional) Copy frontend env
cp frontend/.env.example frontend/.env
```

### 2. Khởi động toàn bộ hệ thống
```bash
docker-compose up --build
```

Hệ thống sẽ khởi động:
- 5 PostgreSQL databases riêng biệt (database per service)
- RabbitMQ message broker
- 7 microservices (backend)
- 4 micro-frontends (UI riêng cho mỗi service)
- Nginx gateway tại http://localhost:8080

**Access Points:**
- Main Frontend: http://localhost:3000 (Tích hợp tất cả)
- Product UI: http://localhost:3002 (Quản lý sản phẩm)
- Cart UI: http://localhost:3004 (Quản lý giỏ hàng)
- Order UI: http://localhost:3005 (Quản lý đơn hàng)
- RabbitMQ Management: http://localhost:15672 (admin/admin123)

### 3. Truy cập ứng dụng

**Micro-Frontends (Mỗi service có UI riêng):**
- Product Management: http://localhost:3002
- Cart Management: http://localhost:3004
- Order Management: http://localhost:3005

**Main Frontend (Tích hợp tất cả):**
- Full Application: http://localhost:3000

## Demo Accounts

### Customer Account
- Username: `user`
- Password: `user123`
- Customer ID: `12345`

### Admin Account
- Username: `admin`
- Password: `admin123`
- Customer ID: `admin`

## Database Architecture

Hệ thống sử dụng **Database per Service** pattern - mỗi microservice có database riêng biệt:

### 1. Auth Database (Port 5433)
- Database: `auth_db`
- User: `authuser` / Password: `authpass`
- Tables: `users`
- Data: Demo accounts (admin, user)

### 2. Customer Database (Port 5434)
- Database: `customer_db`
- User: `customeruser` / Password: `customerpass`
- Tables: `customers`
- Data: 3 demo customers

### 3. Product Database (Port 5435)
- Database: `product_db`
- User: `productuser` / Password: `productpass`
- Tables: `products`
- Data: 5 demo products (Laptop, iPhone, iPad, Samsung, MacBook)

### 4. Cart Database (Port 5436)
- Database: `cart_db`
- User: `cartuser` / Password: `cartpass`
- Tables: `cart_items`

### 5. Order Database (Port 5437)
- Database: `order_db`
- User: `orderuser` / Password: `orderpass`
- Tables: `orders`, `order_items`

**Lợi ích của Database per Service:**
- ✅ Độc lập hoàn toàn giữa các services
- ✅ Mỗi service tự do chọn database engine phù hợp
- ✅ Scale database theo nhu cầu từng service
- ✅ Fault isolation - lỗi database không ảnh hưởng service khác
- ✅ Tuân thủ nguyên tắc microservices architecture

Chi tiết: Xem [DATABASE_PER_SERVICE.md](DATABASE_PER_SERVICE.md)

## API Documentation

Chi tiết API specs có trong thư mục `docs/api-specs/`:
- `service-auth.yaml` - Authentication API
- `service-customer.yaml` - Customer API
- `service-product.yaml` - Product API
- `service-cart.yaml` - Cart API
- `service-order.yaml` - Order API
- `service-notification.yaml` - Notification API
- `service-make-order.yaml` - Order Orchestration API

## Development

### Chạy từng service riêng lẻ

```bash
# Auth Service
cd services/auth-service
pip install -r requirements.txt
DATABASE_URL=postgresql://orderuser:orderpass@localhost:5432/orderdb uvicorn main:app --port 8001

# Product Service
cd services/product-service
pip install -r requirements.txt
DATABASE_URL=postgresql://orderuser:orderpass@localhost:5432/orderdb uvicorn main:app --port 8002

# Tương tự cho các services khác...
```

### Chạy từng Frontend riêng

```bash
# Product Frontend
cd services/product-service/frontend
npm install
npm run dev  # http://localhost:3002

# Cart Frontend
cd services/cart-service/frontend
npm install
npm run dev  # http://localhost:3004

# Order Frontend
cd services/order-service/frontend
npm install
npm run dev  # http://localhost:3005

# Main Frontend (Orchestrator)
cd frontend
npm install
npm run dev  # http://localhost:3000
```

## Order Flow

Luồng đặt hàng hoàn chỉnh qua Make Order Service (Orchestration Pattern):

### Synchronous Steps (HTTP API Calls):
1. **Validate Token** - Xác thực JWT token (Auth Service)
2. **Verify Customer** - Kiểm tra thông tin khách hàng (Customer Service)
3. **Get Product Info** - Lấy thông tin sản phẩm (Product Service)
4. **Check Stock** - Kiểm tra tồn kho (Product Service)
5. **Update Stock** - Trừ tồn kho (Product Service)
6. **Create Order** - Tạo đơn hàng (Order Service)
7. **Clear Cart** - Xóa giỏ hàng (Cart Service)
8. **Process Payment** - Xử lý thanh toán (stub)

### Asynchronous Steps (RabbitMQ Events):
9. **Publish Event** - Make Order Service publish `order.created` event tới RabbitMQ
10. **Send Notification** - Notification Service consume event và gửi thông báo

**Event-Driven Architecture:**
- Notification service không block order creation
- Nếu notification service down, order vẫn tạo thành công
- Message được lưu trong queue cho đến khi được xử lý
- Dễ dàng thêm consumers khác (SMS, Analytics, etc.)

## Project Structure

```
.
├── docs/                           # Documentation
│   ├── api-specs/                  # OpenAPI specifications
│   ├── architecture.md             # System architecture
│   ├── analysis-and-design.md      # Analysis & design docs
│   └── comparison-report.md        # Code vs design comparison
├── services/
│   ├── auth-service/               # JWT authentication
│   ├── customer-service/           # Customer management
│   ├── product-service/            # Product & inventory
│   ├── cart-service/               # Shopping cart
│   ├── order-service/              # Order management
│   ├── notification-service/       # Email notifications
│   └── make-order-service/         # Order orchestration
├── services/
│   ├── product-service/
│   │   ├── main.py                 # Backend API
│   │   ├── database.py             # SQLAlchemy models
│   │   └── frontend/               # Product UI (Port 3002)
│   ├── cart-service/
│   │   ├── main.py
│   │   ├── database.py
│   │   └── frontend/               # Cart UI (Port 3004)
│   ├── order-service/
│   │   ├── main.py
│   │   ├── database.py
│   │   └── frontend/               # Order UI (Port 3005)
│   └── ...
├── frontend/                       # Main Frontend (Port 3000)
│   ├── src/
│   │   ├── components/             # React components
│   │   ├── App.jsx                 # Orchestrator
│   │   └── main.jsx
│   └── package.json
├── gateway/                        # Nginx reverse proxy
├── scripts/
│   └── init-db.sql                 # Database initialization
├── docker-compose.yml              # Docker orchestration
└── README.md
```

## Micro-Frontends Architecture

Hệ thống sử dụng kiến trúc **micro-frontends** - mỗi service có UI riêng biệt:

### Benefits
-  **Independence**: Mỗi team phát triển UI riêng, không ảnh hưởng lẫn nhau
-  **Scalability**: Scale frontend theo nhu cầu từng service
-  **Technology Freedom**: Có thể dùng framework khác nhau
-  **Fault Isolation**: Lỗi ở một UI không ảnh hưởng UI khác
-  **Team Autonomy**: Product team → Product UI, Cart team → Cart UI

### Product Frontend (Port 3002)
- View all products
- Create/Edit/Delete products (Admin)
- Manage inventory
- Real-time stock updates

### Cart Frontend (Port 3004)
- View cart items
- Add/Update/Remove items
- Calculate total
- Clear cart

### Order Frontend (Port 3005)
- View all orders
- Order details
- Update order status (Admin)
- Order history

### Main Frontend (Port 3000)
- Integrated experience
- User authentication
- Navigation between services
- Full shopping flow

Chi tiết: Xem [MICRO_FRONTENDS.md](MICRO_FRONTENDS.md)

## RESTful API Design

Tất cả APIs tuân theo RESTful conventions:
- Resource-based URLs (e.g., `/products`, `/customers/{id}/cart`)
- HTTP methods: GET, POST, PUT, DELETE
- Proper status codes (200, 201, 400, 401, 403, 404, 502)
- JSON request/response format
- JWT Bearer token authentication

## Environment Variables

### Backend Services (.env)
```env
# JWT Configuration
JWT_SECRET_KEY=your_jwt_secret_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# RabbitMQ Configuration
RABBITMQ_USER=admin
RABBITMQ_PASS=admin123

# Database URLs (mỗi service có database riêng)
# Auth Service
DATABASE_URL=postgresql://authuser:authpass@postgres-auth:5432/auth_db

# Customer Service
DATABASE_URL=postgresql://customeruser:customerpass@postgres-customer:5432/customer_db

# Product Service
DATABASE_URL=postgresql://productuser:productpass@postgres-product:5432/product_db

# Cart Service
DATABASE_URL=postgresql://cartuser:cartpass@postgres-cart:5432/cart_db

# Order Service
DATABASE_URL=postgresql://orderuser:orderpass@postgres-order:5432/order_db
```

### Frontend
```env
VITE_API_BASE=http://localhost:8080
```

## Troubleshooting

### Database connection issues
```bash
# Check if all PostgreSQL databases are running
docker-compose ps | grep postgres

# View specific database logs
docker-compose logs postgres-auth
docker-compose logs postgres-product
docker-compose logs postgres-cart
docker-compose logs postgres-order
docker-compose logs postgres-customer

# Restart specific database
docker-compose restart postgres-auth

# Restart all databases
docker-compose restart postgres-auth postgres-customer postgres-product postgres-cart postgres-order
```

### RabbitMQ issues
```bash
# Check RabbitMQ status
docker-compose ps rabbitmq

# View RabbitMQ logs
docker-compose logs rabbitmq

# Access RabbitMQ Management UI
# http://localhost:15672 (admin/admin123)

# Restart RabbitMQ
docker-compose restart rabbitmq
```

### Service not responding
```bash
# Check service logs
docker-compose logs <service-name>

# Restart specific service
docker-compose restart <service-name>

# Rebuild and restart
docker-compose up --build <service-name>
```

### Frontend not loading
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up --build frontend
```

## Testing

### Test API endpoints với curl

```bash
# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"user123"}'

# Get products
curl http://localhost:8080/products

# Add to cart (requires token)
curl -X POST http://localhost:8080/customers/12345/cart \
  -H "Content-Type: application/json" \
  -d '{"product_id":1,"quantity":2}'

# Place order (requires token)
curl -X POST http://localhost:8080/ordering \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "customer_id":"12345",
    "items":[{"product_id":1,"quantity":2}],
    "payment_method":"COD"
  }'
```

## Microservices Patterns Implemented

**Database per Service** - Mỗi service có database riêng  
**API Gateway** - Nginx reverse proxy  
**Service Discovery** - Docker DNS  
**Event-Driven Architecture** - RabbitMQ message broker  
**Orchestration Pattern** - Make Order Service  
**Micro-Frontends** - UI độc lập cho mỗi service  
**JWT Authentication** - Stateless auth  
**Health Checks** - Database health monitoring  

## Future Enhancements

- [ ] Add unit tests and integration tests
- [ ] Implement real email service (SendGrid, AWS SES)
- [ ] Add payment gateway integration
- [ ] Implement caching with Redis
- [ ] Add monitoring with Prometheus/Grafana
- [ ] Implement CI/CD pipeline
- [ ] Add API rate limiting
- [ ] Circuit Breaker pattern (Resilience4j, Hystrix)
- [ ] Add search functionality with Elasticsearch
- [ ] Implement file upload for product images
- [ ] Service mesh (Istio, Linkerd)
- [ ] Distributed tracing (Jaeger, Zipkin)

## License

This project is for educational purposes.

## Contact

For questions or issues, please contact the team members listed above.
