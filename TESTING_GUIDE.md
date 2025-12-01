# Testing Guide - Hướng Dẫn Test Hệ Thống

## ✅ Hệ thống đã hoạt động!

### Status Check
- ✅ PostgreSQL: Running với database `orderdb`
- ✅ All Backend Services: Running với CORS enabled
- ✅ All Frontends: Running
- ✅ API Gateway: Running
- ✅ Login API: Working (200 OK)

## 🔐 Demo Accounts

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

**⚠️ Lưu ý**: Username và password phải chính xác, phân biệt hoa thường!

## 🧪 Test Cases

### 1. Test Login (Main Frontend)

**URL**: http://localhost:3000

**Steps**:
1. Mở http://localhost:3000
2. Nhập username: `user` (chữ thường)
3. Nhập password: `user123`
4. Click "Login"
5. ✅ Nên thấy dashboard với Products/Cart/Orders tabs

**Common Issues**:
- ❌ 401 Unauthorized → Check username/password chính xác
- ❌ CORS error → Đã fix, restart services nếu cần
- ❌ Network error → Check backend services đang chạy

### 2. Test Product Management (Product UI)

**URL**: http://localhost:3002

**Steps**:
1. Login vào Main Frontend (http://localhost:3000) với admin account
2. Mở DevTools (F12) → Application → Local Storage
3. Copy `token` value
4. Mở http://localhost:3002
5. Paste token vào ô "Admin JWT Token"
6. Click "Add Product"
7. Nhập thông tin sản phẩm
8. Click "Create"
9. ✅ Sản phẩm mới xuất hiện trong danh sách

### 3. Test Cart Management (Cart UI)

**URL**: http://localhost:3004

**Steps**:
1. Mở http://localhost:3004
2. Nhập Customer ID: `12345`
3. Click "Load Cart"
4. ✅ Nên thấy giỏ hàng (có thể rỗng)
5. Thêm items từ Main Frontend
6. Refresh Cart UI
7. ✅ Items xuất hiện

### 4. Test Order Management (Order UI)

**URL**: http://localhost:3005

**Steps**:
1. Mở http://localhost:3005
2. ✅ Xem danh sách đơn hàng
3. Paste Admin token để update status
4. Chọn status mới từ dropdown
5. ✅ Status được cập nhật

### 5. Test Complete Shopping Flow (Main Frontend)

**URL**: http://localhost:3000

**Steps**:
1. Login với `user / user123`
2. Tab "Products":
   - Click "Add to Cart" cho 2-3 sản phẩm
   - ✅ Thấy message "Added to cart"
3. Tab "Cart":
   - ✅ Thấy items vừa thêm
   - Thay đổi số lượng với +/-
   - Nhập note: "Giao hàng buổi sáng"
   - Chọn payment: COD hoặc Online
   - Click "Place Order"
   - ✅ Thấy "Order placed successfully"
4. Tab "Orders":
   - ✅ Thấy đơn hàng vừa tạo
   - Status: pending

### 6. Test Admin Features

**URL**: http://localhost:3000

**Steps**:
1. Logout (nếu đang login)
2. Login với `admin / admin123`
3. Tab "Products":
   - ✅ Có thể thêm/sửa/xóa sản phẩm
4. Tab "Orders":
   - ✅ Thấy tất cả đơn hàng
   - Có dropdown để update status
   - Chọn status mới
   - ✅ Status được cập nhật

## 🔧 API Testing (với curl/Postman)

### Login
```bash
# PowerShell
$body = @{username='user';password='user123'} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:8080/auth/login -Method POST -Body $body -ContentType 'application/json'

# Expected: 200 OK với access_token
```

### Get Products
```bash
Invoke-WebRequest -Uri http://localhost:8080/products -Method GET
# Expected: 200 OK với list products
```

### Get Cart
```bash
Invoke-WebRequest -Uri http://localhost:8080/customers/12345/cart -Method GET
# Expected: 200 OK với cart items
```

### Get Orders
```bash
Invoke-WebRequest -Uri http://localhost:8080/orders -Method GET
# Expected: 200 OK với list orders
```

### Place Order (cần token)
```bash
$token = "YOUR_JWT_TOKEN"
$body = @{
  customer_id='12345'
  items=@(@{product_id=1;quantity=2})
  payment_method='COD'
} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:8080/ordering -Method POST -Body $body -ContentType 'application/json' -Headers @{Authorization="Bearer $token"}
# Expected: 200 OK với order details
```

## 📊 Database Verification

### Check Users
```bash
docker-compose exec postgres psql -U orderuser -d orderdb -c "SELECT * FROM users;"
```

### Check Products
```bash
docker-compose exec postgres psql -U orderuser -d orderdb -c "SELECT id, name, price, inventory FROM products;"
```

### Check Orders
```bash
docker-compose exec postgres psql -U orderuser -d orderdb -c "SELECT id, customer_id, status, total_amount FROM orders;"
```

### Check Cart Items
```bash
docker-compose exec postgres psql -U orderuser -d orderdb -c "SELECT * FROM cart_items;"
```

## 🐛 Troubleshooting

### Login fails (401)
```bash
# Check database có users không
docker-compose exec postgres psql -U orderuser -d orderdb -c "SELECT username, password FROM users;"

# Verify username/password chính xác
# user / user123
# admin / admin123
```

### CORS errors
```bash
# Restart backend services
docker-compose restart auth-service product-service customer-service cart-service order-service notification-service make-order-service
```

### Frontend not loading
```bash
# Check logs
docker-compose logs frontend
docker-compose logs product-frontend
docker-compose logs cart-frontend
docker-compose logs order-frontend

# Rebuild if needed
docker-compose up --build -d frontend
```

### Database connection errors
```bash
# Check postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres

# Recreate if needed
docker-compose down -v
docker-compose up postgres
```

## ✨ Success Indicators

### Backend Services
```bash
docker-compose ps
# All services should be "Up"
```

### Frontend Access
- ✅ http://localhost:3000 - Main app loads
- ✅ http://localhost:3002 - Product UI loads
- ✅ http://localhost:3004 - Cart UI loads
- ✅ http://localhost:3005 - Order UI loads

### API Gateway
```bash
curl http://localhost:8080/health
# Should return: ok
```

### Database
```bash
docker-compose exec postgres psql -U orderuser -d orderdb -c "SELECT COUNT(*) FROM users;"
# Should return: 2
```

## 📝 Test Checklist

- [ ] Login với customer account thành công
- [ ] Login với admin account thành công
- [ ] Xem danh sách products
- [ ] Add product to cart
- [ ] View cart
- [ ] Update cart quantities
- [ ] Place order
- [ ] View order history
- [ ] Admin: Create product
- [ ] Admin: Update product
- [ ] Admin: Delete product
- [ ] Admin: Update order status
- [ ] Product UI: CRUD operations
- [ ] Cart UI: View and manage cart
- [ ] Order UI: View and update orders

## 🎉 All Tests Passed?

Congratulations! Hệ thống micro-frontends với PostgreSQL database đang hoạt động hoàn hảo!

## 📞 Support

Nếu gặp vấn đề:
1. Check logs: `docker-compose logs <service-name>`
2. Restart service: `docker-compose restart <service-name>`
3. Rebuild: `docker-compose up --build -d`
4. Check database: `docker-compose exec postgres psql -U orderuser -d orderdb`

Happy Testing! 🚀
