# Quick Start Guide - Micro-Frontends Architecture

## 🚀 Khởi động nhanh

### 1. Setup
```bash
# Clone repo
git clone <repo-url>
cd online-ordering-microservices

# Copy environment
cp .env.example .env
```

### 2. Chạy toàn bộ hệ thống
```bash
docker-compose up --build
```

Đợi khoảng 2-3 phút để tất cả services khởi động.

## 🌐 Access Points

### Micro-Frontends (UI riêng cho mỗi service)

#### 1. Product Management UI
**URL**: http://localhost:3002

**Chức năng**:
- Xem danh sách sản phẩm
- Thêm sản phẩm mới (cần Admin token)
- Sửa sản phẩm (cần Admin token)
- Xóa sản phẩm (cần Admin token)
- Quản lý tồn kho

**Demo**:
1. Mở http://localhost:3002
2. Nhập Admin JWT token (lấy từ Main Frontend)
3. Click "Add Product" để tạo sản phẩm mới
4. Click "Edit" hoặc "Delete" để quản lý

---

#### 2. Cart Management UI
**URL**: http://localhost:3004

**Chức năng**:
- Xem giỏ hàng theo Customer ID
- Thêm/Sửa/Xóa sản phẩm trong giỏ
- Tính tổng tiền
- Xóa toàn bộ giỏ hàng

**Demo**:
1. Mở http://localhost:3004
2. Nhập Customer ID: `12345` (hoặc `67890`)
3. Click "Load Cart"
4. Thêm/Sửa số lượng sản phẩm
5. Xem tổng tiền tự động cập nhật

---

#### 3. Order Management UI
**URL**: http://localhost:3005

**Chức năng**:
- Xem tất cả đơn hàng
- Chi tiết từng đơn hàng
- Cập nhật trạng thái đơn hàng (cần Admin token)
- Lọc theo trạng thái

**Demo**:
1. Mở http://localhost:3005
2. Xem danh sách đơn hàng
3. Nhập Admin JWT token để cập nhật trạng thái
4. Chọn trạng thái mới từ dropdown

---

#### 4. Main Frontend (Orchestrator)
**URL**: http://localhost:3000

**Chức năng**:
- Tích hợp tất cả chức năng
- Đăng nhập với JWT
- Shopping flow hoàn chỉnh
- Navigation giữa các trang

**Demo**:
1. Mở http://localhost:3000
2. Đăng nhập với:
   - Customer: `user / user123`
   - Admin: `admin / admin123`
3. Browse products → Add to cart → Checkout → View orders

---

## 🔑 Demo Accounts

### Customer Account
```
Username: user
Password: user123
Customer ID: 12345
```

### Admin Account
```
Username: admin
Password: admin123
Customer ID: admin
```

## 📊 Demo Data

### Products (5 items)
1. Laptop Dell XPS 13 - $1500 (Stock: 10)
2. iPhone 15 Pro - $899 (Stock: 25)
3. iPad Air - $499 (Stock: 15)
4. Samsung Galaxy S24 - $799 (Stock: 20)
5. MacBook Pro 14 - $1999 (Stock: 8)

### Customers (3 users)
1. Admin User (admin)
2. Alice Nguyen (12345)
3. Bob Tran (67890)

## 🎯 Use Cases

### Use Case 1: Customer mua hàng (Main Frontend)
1. Mở http://localhost:3000
2. Login: `user / user123`
3. Tab "Products" → Click "Add to Cart" cho sản phẩm
4. Tab "Cart" → Xem giỏ hàng
5. Nhập note, chọn payment method
6. Click "Place Order"
7. Tab "Orders" → Xem đơn hàng vừa tạo

### Use Case 2: Admin quản lý sản phẩm (Product UI)
1. Mở http://localhost:3000 → Login: `admin / admin123`
2. Copy JWT token từ localStorage (F12 → Application → Local Storage)
3. Mở http://localhost:3002
4. Paste token vào ô "Admin JWT Token"
5. Click "Add Product" → Nhập thông tin → Create
6. Click "Edit" để sửa sản phẩm
7. Click "Delete" để xóa

### Use Case 3: Admin quản lý đơn hàng (Order UI)
1. Mở http://localhost:3000 → Login: `admin / admin123`
2. Copy JWT token
3. Mở http://localhost:3005
4. Paste token vào ô "Admin JWT Token"
5. Chọn trạng thái mới từ dropdown
6. Đơn hàng tự động cập nhật

### Use Case 4: Quản lý giỏ hàng độc lập (Cart UI)
1. Mở http://localhost:3004
2. Nhập Customer ID: `12345`
3. Click "Load Cart"
4. Thêm/Sửa/Xóa items
5. Xem tổng tiền real-time

## 🔧 Troubleshooting

### Frontend không load
```bash
# Check logs
docker-compose logs product-frontend
docker-compose logs cart-frontend
docker-compose logs order-frontend
docker-compose logs frontend

# Restart specific frontend
docker-compose restart product-frontend
```

### Backend không response
```bash
# Check backend logs
docker-compose logs product-service
docker-compose logs cart-service
docker-compose logs order-service

# Check database
docker-compose logs postgres
```

### Port conflicts
```bash
# Stop all containers
docker-compose down

# Check ports
netstat -ano | findstr :3000
netstat -ano | findstr :3002
netstat -ano | findstr :3004
netstat -ano | findstr :3005

# Kill process if needed
taskkill /PID <PID> /F
```

## 📝 API Testing

### Get JWT Token
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Get Products
```bash
curl http://localhost:8080/products
```

### Get Cart
```bash
curl http://localhost:8080/customers/12345/cart
```

### Get Orders
```bash
curl http://localhost:8080/orders
```

## 🎨 Architecture Benefits

### 1. Independence
- Product team phát triển Product UI độc lập
- Cart team phát triển Cart UI độc lập
- Order team phát triển Order UI độc lập
- Không ảnh hưởng lẫn nhau

### 2. Scalability
- Scale Product UI nếu traffic cao
- Scale Cart UI riêng biệt
- Optimize performance từng phần

### 3. Technology Freedom
- Product UI có thể dùng React
- Cart UI có thể dùng Vue
- Order UI có thể dùng Angular
- Main Frontend orchestrate tất cả

### 4. Fault Isolation
- Lỗi ở Product UI → Cart UI vẫn hoạt động
- Lỗi ở Cart UI → Order UI vẫn hoạt động
- Better user experience

## 📚 Next Steps

1. **Explore Code**
   - `services/product-service/frontend/src/App.jsx`
   - `services/cart-service/frontend/src/App.jsx`
   - `services/order-service/frontend/src/App.jsx`

2. **Customize UI**
   - Thay đổi Tailwind colors
   - Thêm components mới
   - Customize layout

3. **Add Features**
   - Product search
   - Cart persistence
   - Order filters
   - Real-time updates

4. **Deploy**
   - Setup CI/CD
   - Deploy to cloud
   - Configure domains

## 🆘 Support

Có vấn đề? Check:
1. [README.md](README.md) - Full documentation
2. [MICRO_FRONTENDS.md](MICRO_FRONTENDS.md) - Architecture details
3. [CHANGELOG.md](CHANGELOG.md) - Recent changes

## 🎉 Happy Coding!

Enjoy exploring the micro-frontends architecture! 🚀
