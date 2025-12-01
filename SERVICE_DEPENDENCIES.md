# Service Dependencies Analysis

## 🔍 Tóm tắt

**Câu trả lời**: ❌ **KHÔNG có service nào gọi chéo nhau**

Chỉ có **Make-Order-Service** (Task Service) gọi các services khác theo pattern **Orchestration**.

---

## 📊 Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    Make-Order-Service                        │
│                   (Orchestrator/Task Service)                │
└────────┬────────┬────────┬────────┬────────┬────────────────┘
         │        │        │        │        │        │
         ▼        ▼        ▼        ▼        ▼        ▼
    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
    │  Auth  │ │Customer│ │Product │ │  Cart  │ │ Order  │ │Notif.  │
    │Service │ │Service │ │Service │ │Service │ │Service │ │Service │
    └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
         ▲        ▲        ▲        ▲        ▲        ▲
         │        │        │        │        │        │
         └────────┴────────┴────────┴────────┴────────┘
                    NO CROSS CALLS
              (Không gọi lẫn nhau)
```

---

## 🎯 Service Roles

### 1. **Entity Services** (Độc lập)
Không gọi service khác, chỉ xử lý database của mình:

#### Auth Service (Port 8001)
```python
# KHÔNG gọi service nào
# Chỉ xử lý:
- Login
- Validate token
- Database: users table
```

#### Customer Service (Port 8003)
```python
# KHÔNG gọi service nào
# Chỉ xử lý:
- Get customer info
- Database: customers table
```

#### Product Service (Port 8002)
```python
# KHÔNG gọi service nào
# Chỉ xử lý:
- CRUD products
- Check/update stock
- Database: products table
```

#### Cart Service (Port 8004)
```python
# KHÔNG gọi service nào
# Chỉ xử lý:
- CRUD cart items
- Database: cart_items table
```

#### Order Service (Port 8005)
```python
# KHÔNG gọi service nào
# Chỉ xử lý:
- Create orders
- Update order status
- Database: orders, order_items tables
```

#### Notification Service (Port 8006)
```python
# KHÔNG gọi service nào
# Chỉ xử lý:
- Send email (stub)
- No database
```

---

### 2. **Task Service** (Orchestrator)

#### Make-Order Service (Port 8007)
```python
# GỌI TẤT CẢ services khác
# Orchestrate order placement flow

SERVICE_URLS = {
    "auth": "http://auth-service:8001",
    "customer": "http://customer-service:8003",
    "product": "http://product-service:8002",
    "order": "http://order-service:8005",
    "notification": "http://notification-service:8006",
    "cart": "http://cart-service:8004",
}
```

**Calls:**
1. Auth Service → Validate token
2. Customer Service → Get customer info
3. Product Service → Check stock, update stock
4. Order Service → Create order
5. Cart Service → Clear cart
6. Notification Service → Send email

---

## 🔄 Call Flow

### Order Placement Flow (POST /ordering)

```
User Request
    ↓
Make-Order-Service
    ↓
    ├─→ 1. Auth Service (validate token)
    │       ↓ return customer_id
    │
    ├─→ 2. Customer Service (get customer)
    │       ↓ return customer data
    │
    ├─→ 3. Product Service (check stock)
    │       ↓ return availability
    │
    ├─→ 4. Product Service (update stock)
    │       ↓ return updated product
    │
    ├─→ 5. Order Service (create order)
    │       ↓ return order data
    │
    ├─→ 6. Notification Service (send email)
    │       ↓ return status
    │
    └─→ 7. Cart Service (clear cart)
            ↓ return status
    ↓
Response to User
```

---

## ✅ Advantages (Không có gọi chéo)

### 1. **Loose Coupling**
- Services độc lập
- Dễ maintain
- Dễ scale riêng biệt

### 2. **No Circular Dependencies**
- Không có vòng lặp gọi
- Không có deadlock
- Clear dependency tree

### 3. **Easy Testing**
- Test từng service riêng
- Mock dependencies dễ dàng
- Unit test đơn giản

### 4. **Clear Responsibility**
- Mỗi service có 1 nhiệm vụ rõ ràng
- Entity services: CRUD data
- Task service: Orchestrate workflow

### 5. **Scalability**
- Scale entity services theo load
- Scale orchestrator riêng
- Không ảnh hưởng lẫn nhau

---

## 🚫 What We DON'T Have

### ❌ Circular Dependencies
```
# KHÔNG có:
Product Service → Order Service → Product Service
Auth Service → Customer Service → Auth Service
```

### ❌ Chain Calls
```
# KHÔNG có:
Service A → Service B → Service C → Service D
```

### ❌ Peer-to-Peer Calls
```
# KHÔNG có:
Product Service ←→ Cart Service
Order Service ←→ Customer Service
```

---

## 📐 Architecture Pattern

### Pattern Used: **Orchestration**

```
┌─────────────────────────────────────┐
│         Orchestrator                │
│    (Make-Order-Service)             │
│                                     │
│  Coordinates all services           │
│  Knows about all dependencies       │
│  Handles business logic flow        │
└─────────────────────────────────────┘
              │
              │ Calls
              ▼
┌─────────────────────────────────────┐
│      Entity Services                │
│  (Auth, Product, Cart, etc.)        │
│                                     │
│  Independent                        │
│  No knowledge of other services     │
│  Focus on single responsibility     │
└─────────────────────────────────────┘
```

### Alternative Pattern: **Choreography** (NOT used)
```
# Nếu dùng Choreography (event-driven):
Order Created Event
    ↓
    ├─→ Inventory Service (listen & update stock)
    ├─→ Notification Service (listen & send email)
    └─→ Cart Service (listen & clear cart)

# Ưu điểm: Loose coupling hơn
# Nhược điểm: Phức tạp hơn, cần message queue
```

---

## 🔧 Configuration

### Make-Order-Service Environment Variables
```yaml
# docker-compose.yml
make-order-service:
  environment:
    AUTH_URL: http://auth-service:8001
    CUSTOMER_URL: http://customer-service:8003
    PRODUCT_URL: http://product-service:8002
    ORDER_URL: http://order-service:8005
    NOTIF_URL: http://notification-service:8006
    CART_URL: http://cart-service:8004
```

### Other Services
```yaml
# Không có SERVICE_URL configs
# Vì không gọi service khác
auth-service:
  environment:
    DATABASE_URL: postgresql://...
    JWT_SECRET_KEY: ...

product-service:
  environment:
    DATABASE_URL: postgresql://...
    JWT_SECRET_KEY: ...
```

---

## 📊 Dependency Matrix

| Service | Calls Auth | Calls Customer | Calls Product | Calls Cart | Calls Order | Calls Notif |
|---------|-----------|---------------|--------------|-----------|------------|------------|
| Auth | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Customer | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Product | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cart | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Order | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Notification | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Make-Order** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Total Cross-Service Calls**: 0 (giữa entity services)
**Orchestrator Calls**: 6 (make-order → others)

---

## 🎯 Benefits of This Design

### 1. **Single Point of Orchestration**
- Dễ debug
- Dễ monitor
- Clear business logic flow

### 2. **Independent Services**
- Deploy riêng biệt
- Update không ảnh hưởng nhau
- Test độc lập

### 3. **No Cascading Failures** (between entity services)
- Product service down → không ảnh hưởng Cart service
- Auth service down → không ảnh hưởng Order service
- Chỉ Make-Order service bị ảnh hưởng (có circuit breaker)

### 4. **Clear Data Ownership**
- Auth service owns users
- Product service owns products
- Order service owns orders
- No data duplication

---

## 🔮 Future Enhancements

### If Need Cross-Service Calls:

#### Option 1: Add More Orchestrators
```
Make-Order-Service → Order placement
Make-Return-Service → Return processing
Make-Payment-Service → Payment processing
```

#### Option 2: Event-Driven (Choreography)
```
# Add message queue (RabbitMQ/Kafka)
Order Created → Event Bus → Multiple listeners
```

#### Option 3: Service Mesh
```
# Add Istio/Linkerd
- Service discovery
- Load balancing
- Circuit breaking at infrastructure level
```

---

## ✅ Summary

### Current Architecture:
- ✅ **NO cross-service calls** between entity services
- ✅ **ONE orchestrator** (Make-Order-Service)
- ✅ **Clear separation** of concerns
- ✅ **Loose coupling** between services
- ✅ **Easy to maintain** and scale

### Service Communication:
```
Frontend → Gateway → Entity Services (direct)
Frontend → Gateway → Make-Order-Service → Entity Services (orchestrated)
```

### Dependency Count:
- **Entity Services**: 0 dependencies on other services
- **Make-Order Service**: 6 dependencies (all entity services)
- **Total**: Clean, one-way dependency tree

**Kết luận**: Kiến trúc sạch, không có gọi chéo, dễ maintain! ✨
