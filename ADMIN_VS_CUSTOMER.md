# Admin vs Customer - Phân Quyền Hệ Thống

## 🔐 Accounts

### Customer Account
```
Username: user
Password: user123
Role: customer
Customer ID: 12345
```

### Admin Account
```
Username: admin
Password: admin123
Role: admin
Customer ID: admin
```

---

## 📊 Sự Khác Biệt

### 1. **Products Tab**

#### 👤 Customer View
- ✅ Xem danh sách sản phẩm
- ✅ Xem giá, mô tả, tồn kho
- ✅ **Button "Add to Cart"** - Thêm vào giỏ hàng
- ❌ Không thể tạo/sửa/xóa sản phẩm

**UI Elements:**
- Tab name: "Products"
- Product cards với button "Add to Cart"
- Không có form quản lý

#### 👑 Admin View
- ✅ Xem danh sách sản phẩm
- ✅ **Button "+ Add Product"** - Tạo sản phẩm mới
- ✅ **Button "Edit"** - Sửa sản phẩm
- ✅ **Button "Delete"** - Xóa sản phẩm
- ✅ Form tạo/sửa sản phẩm
- ❌ Không có button "Add to Cart"

**UI Elements:**
- Tab name: "Product Management"
- Badge "(Admin Mode)"
- Green "+ Add Product" button
- Product cards với "Edit" và "Delete" buttons
- Form với fields: Name, Price, Inventory, Description

---

### 2. **Cart Tab**

#### 👤 Customer View
- ✅ **Tab "Cart" hiển thị**
- ✅ Xem giỏ hàng
- ✅ Thêm/Sửa/Xóa items
- ✅ Tính tổng tiền
- ✅ Nhập note đơn hàng
- ✅ Chọn payment method (COD/Online)
- ✅ **Button "Place Order"** - Đặt hàng

**UI Elements:**
- Tab "Cart" với badge số lượng items
- Cart items với +/- buttons
- Total amount
- Order note textarea
- Payment method radio buttons
- Green "Place Order" button

#### 👑 Admin View
- ❌ **Tab "Cart" KHÔNG hiển thị**
- ❌ Admin không có giỏ hàng
- ❌ Admin không mua hàng

**Lý do:** Admin quản lý hệ thống, không phải khách hàng mua hàng.

---

### 3. **Orders Tab**

#### 👤 Customer View
- ✅ Tab name: "My Orders"
- ✅ **Chỉ xem orders của mình** (filter by customer_id)
- ✅ Xem chi tiết đơn hàng
- ✅ Xem trạng thái đơn hàng
- ❌ Không thể update status

**UI Elements:**
- Tab "My Orders"
- Order cards với status badge
- Order items list
- Total amount
- Không có dropdown update status

#### 👑 Admin View
- ✅ Tab name: "Order Management"
- ✅ **Xem TẤT CẢ orders** trong hệ thống
- ✅ Badge "Total: X orders"
- ✅ Xem chi tiết tất cả đơn hàng
- ✅ **Dropdown "Update Status"** - Cập nhật trạng thái
- ✅ Thay đổi status: pending → confirmed → shipping → delivered → completed

**UI Elements:**
- Tab "Order Management"
- Total orders badge
- Order cards với status badge
- Dropdown select để update status
- Tất cả orders của tất cả customers

---

## 🎯 Use Cases

### Customer Journey
1. **Login** với `user / user123`
2. **Products Tab**:
   - Browse sản phẩm
   - Click "Add to Cart" cho items muốn mua
3. **Cart Tab**:
   - Review items
   - Adjust quantities
   - Add note
   - Choose payment method
   - Click "Place Order"
4. **My Orders Tab**:
   - Xem đơn hàng vừa đặt
   - Track status

### Admin Journey
1. **Login** với `admin / admin123`
2. **Product Management Tab**:
   - Click "+ Add Product" để tạo sản phẩm mới
   - Click "Edit" để sửa sản phẩm
   - Click "Delete" để xóa sản phẩm
   - Quản lý inventory
3. **Order Management Tab**:
   - Xem tất cả orders
   - Update status từ pending → confirmed → shipping → delivered
   - Monitor tất cả đơn hàng trong hệ thống

---

## 🔍 Visual Differences

### Header Badge
```
Customer: 👤 Customer (12345)
Admin:    👑 Admin (admin)
```

### Navigation Tabs
```
Customer:
- Products
- Cart (with badge)
- My Orders

Admin:
- Product Management
- Order Management
```

### Products Tab
```
Customer:
┌─────────────────────┐
│ Laptop Dell XPS 13  │
│ $1500               │
│ Stock: 10           │
│ [Add to Cart]       │
└─────────────────────┘

Admin:
┌─────────────────────┐
│ Product Management  │
│ (Admin Mode)        │
│ [+ Add Product]     │
└─────────────────────┘
┌─────────────────────┐
│ Laptop Dell XPS 13  │
│ $1500               │
│ Stock: 10           │
│ [Edit] [Delete]     │
└─────────────────────┘
```

### Orders Tab
```
Customer:
┌─────────────────────┐
│ My Orders           │
│                     │
│ Order #1            │
│ Status: pending     │
│ (No update option)  │
└─────────────────────┘

Admin:
┌─────────────────────┐
│ All Orders          │
│ Total: 5 orders     │
│                     │
│ Order #1            │
│ Customer: 12345     │
│ Status: [dropdown]  │
│ ▼ pending           │
│   confirmed         │
│   shipping          │
└─────────────────────┘
```

---

## 🎨 Color Coding

### Role Indicators
- **Customer**: Blue theme (👤 icon)
- **Admin**: Gold/Yellow theme (👑 icon)

### Buttons
- **Customer Actions**: Blue buttons (Add to Cart, Place Order)
- **Admin Actions**: 
  - Green (+ Add Product)
  - Yellow (Edit)
  - Red (Delete)

### Status Badges
- **pending**: Yellow
- **confirmed**: Blue
- **shipping**: Purple
- **delivered**: Green
- **completed**: Gray
- **cancelled**: Red

---

## 🔐 Permission Summary

| Feature | Customer | Admin |
|---------|----------|-------|
| View Products | ✅ | ✅ |
| Add to Cart | ✅ | ❌ |
| View Cart | ✅ | ❌ |
| Place Order | ✅ | ❌ |
| View Own Orders | ✅ | ❌ |
| View All Orders | ❌ | ✅ |
| Create Product | ❌ | ✅ |
| Edit Product | ❌ | ✅ |
| Delete Product | ❌ | ✅ |
| Update Order Status | ❌ | ✅ |

---

## 🧪 Testing

### Test Customer Features
1. Login: `user / user123`
2. Verify:
   - ✅ Tab "Products" (not "Product Management")
   - ✅ Tab "Cart" visible
   - ✅ Tab "My Orders" (not "Order Management")
   - ✅ Products have "Add to Cart" button
   - ✅ Can place orders
   - ✅ Only see own orders

### Test Admin Features
1. Login: `admin / admin123`
2. Verify:
   - ✅ Tab "Product Management" with "(Admin Mode)"
   - ✅ Tab "Cart" NOT visible
   - ✅ Tab "Order Management"
   - ✅ Products have "Edit" and "Delete" buttons
   - ✅ "+ Add Product" button visible
   - ✅ Can create/edit/delete products
   - ✅ See all orders with update status dropdown

---

## 💡 Tips

### For Customers
- Add multiple items to cart before checkout
- Use note field for delivery instructions
- Choose payment method (COD recommended for demo)
- Track order status in "My Orders"

### For Admins
- Create products with realistic prices
- Set appropriate inventory levels
- Update order status as they progress
- Monitor all orders in the system
- Delete test products when needed

---

## 🚀 Quick Switch Test

```bash
# Test as Customer
1. Login: user / user123
2. Add products to cart
3. Place order
4. Logout

# Test as Admin
1. Login: admin / admin123
2. View the order customer just placed
3. Update order status to "confirmed"
4. Create a new product
5. Edit existing product
```

---

## 📝 Notes

- Admin không thể đặt hàng (không có cart)
- Customer không thể quản lý products
- Customer chỉ xem orders của mình
- Admin xem tất cả orders
- Role được xác định bởi JWT token
- Frontend tự động adjust UI based on role

Enjoy the role-based access control! 🎉
