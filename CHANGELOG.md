# Changelog - Cập Nhật Hệ Thống

## Ngày cập nhật: 2024

### 🎯 Mục tiêu
1. ✅ Sử dụng database thật (PostgreSQL) thay vì in-memory
2. ✅ Chuẩn hóa API naming theo RESTful conventions
3. ✅ Nâng cấp frontend lên React + Tailwind CSS

---

## 📦 Database - PostgreSQL

### Thêm mới
- **PostgreSQL 15** container trong docker-compose
- **SQLAlchemy ORM** cho tất cả services
- **Database initialization script** (`scripts/init-db.sql`)
- **Auto-migration** khi khởi động services

### Database Schema
```sql
- users (id, username, password, role, customer_id)
- customers (id, name, email, phone, address)
- products (id, name, price, inventory, description)
- orders (id, customer_id, note, payment_method, status, total_amount)
- order_items (id, order_id, product_id, quantity, price)
- cart_items (id, customer_id, product_id, quantity)
```

### Demo Data
- 2 users (admin, user)
- 3 customers
- 5 products (Laptop, iPhone, iPad, Samsung, MacBook)

---

## 🔄 API Chuẩn Hóa (RESTful)

### Auth Service
**Trước:**
- `POST /login`
- `GET /validate-token`

**Sau:**
- `POST /auth/login` ✅
- `GET /auth/validate` ✅

### Customer Service
**Trước:**
- `GET /customers/{id}` (đã đúng)

**Sau:**
- `GET /customers/{id}` ✅ (giữ nguyên)

### Product Service
**Trước:**
- `GET /products/{id}/check-stock`
- `PUT /products/{id}/update-stock`

**Sau:**
- `GET /products/{id}/stock` ✅
- `PUT /products/{id}/stock` ✅

### Cart Service
**Trước:**
- `GET /cart/{customer_id}`
- `POST /cart/{customer_id}`
- `PUT /cart/{customer_id}`
- `DELETE /cart/{customer_id}/{product_id}`
- `DELETE /cart/{customer_id}`

**Sau (RESTful nested resources):**
- `GET /customers/{customer_id}/cart` ✅
- `POST /customers/{customer_id}/cart` ✅
- `PUT /customers/{customer_id}/cart/{product_id}` ✅
- `DELETE /customers/{customer_id}/cart/{product_id}` ✅
- `DELETE /customers/{customer_id}/cart` ✅

### Order Service
**Trước:**
- `POST /orders` (đã đúng)
- `GET /orders` (đã đúng)
- `PUT /orders/{id}/status` (đã đúng)

**Sau:**
- `POST /orders` ✅ (giữ nguyên)
- `GET /orders` ✅ (giữ nguyên)
- `GET /orders/{id}` ✅ (thêm mới)
- `PUT /orders/{id}/status` ✅ (giữ nguyên)

### Make Order Service
**Trước:**
- `POST /ordering` (đã đúng)

**Sau:**
- `POST /ordering` ✅ (giữ nguyên)

---

## 🎨 Frontend - React + Tailwind CSS

### Công nghệ
- **React 18** với hooks (useState, useEffect)
- **Tailwind CSS 3** cho styling
- **Vite** build tool (nhanh hơn CRA)
- **Axios** cho HTTP requests

### Components
```
src/
├── App.jsx                 # Main app với routing logic
├── components/
│   ├── Login.jsx          # Login form
│   ├── ProductList.jsx    # Danh sách sản phẩm
│   ├── Cart.jsx           # Giỏ hàng & checkout
│   └── OrderHistory.jsx   # Lịch sử đơn hàng
├── main.jsx               # Entry point
└── index.css              # Tailwind imports
```

### Features
- ✅ Responsive design (mobile-friendly)
- ✅ JWT authentication với localStorage
- ✅ Real-time cart updates
- ✅ Order placement với note & payment method
- ✅ Admin features (product CRUD, order status update)
- ✅ Loading states & error handling
- ✅ Beautiful UI với Tailwind

### Trước (HTML/CSS/JS)
```html
<!-- Static HTML với inline JavaScript -->
<div id="products"></div>
<script>
  fetch('/products')...
</script>
```

### Sau (React + Tailwind)
```jsx
// Component-based với state management
function ProductList({ apiBase, token }) {
  const [products, setProducts] = useState([])
  
  useEffect(() => {
    fetchProducts()
  }, [])
  
  return (
    <div className="grid grid-cols-3 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  )
}
```

---

## 📝 API Specs Cập Nhật

Tất cả API specs trong `docs/api-specs/` đã được cập nhật:
- ✅ `service-auth.yaml` (mới)
- ✅ `service-customer.yaml` (cập nhật)
- ✅ `service-product.yaml` (cập nhật)
- ✅ `service-cart.yaml` (mới, thay thế cart-order.yaml)
- ✅ `service-order.yaml` (cập nhật)
- ✅ `service-notification.yaml` (giữ nguyên)
- ✅ `service-make-order.yaml` (mới)

---

## 🐳 Docker Compose Updates

### Services mới
```yaml
postgres:
  image: postgres:15-alpine
  ports: ["5432:5432"]
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql

frontend:
  build: ./frontend
  ports: ["3000:3000"]
  environment:
    VITE_API_BASE: http://localhost:8080
```

### Environment Variables
Tất cả services backend giờ có:
```yaml
environment:
  DATABASE_URL: postgresql://orderuser:orderpass@postgres:5432/orderdb
  JWT_SECRET_KEY: ${JWT_SECRET_KEY}
  ALGORITHM: ${ALGORITHM}
```

---

## 📂 File Structure Changes

### Thêm mới
```
frontend/
├── src/
│   ├── components/         # React components
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── Dockerfile

services/*/database.py      # SQLAlchemy models cho mỗi service
scripts/init-db.sql         # Database initialization
docs/api-specs/*.yaml       # Updated API specs
CHANGELOG.md               # This file
```

### Xóa/Thay thế
```
frontend/app.js            → Replaced by React components
frontend/styles.css        → Replaced by Tailwind
frontend/index.html        → Updated for React
docs/api-specs/cart-order.yaml → Split into service-cart.yaml & service-make-order.yaml
```

---

## 🚀 Migration Guide

### Từ version cũ sang mới

1. **Pull latest code**
   ```bash
   git pull origin main
   ```

2. **Update environment**
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

3. **Rebuild containers**
   ```bash
   docker-compose down -v  # Remove old volumes
   docker-compose up --build
   ```

4. **Access application**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:8080
   - PostgreSQL: localhost:5432

---

## ✅ Testing Checklist

### Backend
- [x] PostgreSQL khởi động và init data thành công
- [x] Auth service: login & validate token
- [x] Product service: CRUD operations
- [x] Cart service: add/update/remove items
- [x] Order service: create & list orders
- [x] Make-order service: complete order flow

### Frontend
- [x] Login với demo accounts
- [x] View products list
- [x] Add to cart
- [x] Update cart quantities
- [x] Place order
- [x] View order history
- [x] Admin: update order status

### Integration
- [x] Frontend → Gateway → Services
- [x] JWT authentication flow
- [x] Database persistence
- [x] Error handling

---

## 📊 Performance Improvements

1. **Database Indexing**
   - Indexes on customer_id, product_id, order_id
   - Faster queries

2. **Connection Pooling**
   - SQLAlchemy connection pool
   - Reuse database connections

3. **Frontend Optimization**
   - Vite build tool (faster than CRA)
   - Code splitting
   - Lazy loading components

---

## 🔒 Security Enhancements

1. **JWT Token**
   - Secure token storage in localStorage
   - Token validation on every request
   - Role-based access control

2. **Database**
   - Parameterized queries (SQL injection prevention)
   - Password hashing (in production, use bcrypt)

3. **CORS**
   - Proper CORS configuration in gateway

---

## 📚 Documentation Updates

- ✅ README.md - Complete rewrite
- ✅ API specs - All updated to match code
- ✅ CHANGELOG.md - This file
- ✅ docs/comparison-report.md - Updated

---

## 🎯 Next Steps

### Recommended
1. Add unit tests (pytest for backend, Jest for frontend)
2. Implement password hashing (bcrypt)
3. Add real email service (SendGrid/AWS SES)
4. Implement payment gateway
5. Add Redis caching
6. Setup CI/CD pipeline

### Optional
1. Add Prometheus/Grafana monitoring
2. Implement message queue (RabbitMQ)
3. Add Elasticsearch for search
4. Implement file upload for product images
5. Add rate limiting
6. Setup Kubernetes deployment

---

## 🐛 Known Issues

None at the moment. Report issues to team members.

---

## 👥 Contributors

- Nguyen Tran Dat - B21DCCN216
- Duong Thi Hong Ngat - B21DCCN564
- Bui Thanh Dinh - B21DCCN228

---

## 📞 Support

For questions or issues, contact team members or create an issue in the repository.
