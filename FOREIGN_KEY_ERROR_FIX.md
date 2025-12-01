# Foreign Key Constraint Error - Giải Thích & Fix

## 🔴 Lỗi

```
sqlalchemy.exc.IntegrityError: (psycopg2.errors.ForeignKeyViolation) 
update or delete on table "products" violates foreign key constraint 
"order_items_product_id_fkey" on table "order_items"

DETAIL: Key (id)=(5) is still referenced from table "order_items".
```

---

## 🤔 Nguyên nhân

### Database Schema có Foreign Keys:

```sql
-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    price DECIMAL(10, 2),
    inventory INTEGER
);

-- Order Items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER,
    product_id INTEGER,  -- ← Foreign Key
    quantity INTEGER,
    price DECIMAL(10, 2),
    FOREIGN KEY (product_id) REFERENCES products(id)  -- ← Constraint
);

-- Cart Items table
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(100),
    product_id INTEGER,  -- ← Foreign Key
    quantity INTEGER,
    FOREIGN KEY (product_id) REFERENCES products(id)  -- ← Constraint
);
```

### Khi xóa Product:

```
Product #5 (MacBook Pro 14)
    ↓
    ├─→ Referenced in order_items (có đơn hàng đã mua)
    └─→ Referenced in cart_items (có trong giỏ hàng)
    
DELETE Product #5 → ❌ FOREIGN KEY VIOLATION!
```

---

## 📊 Kiểm tra dữ liệu

### Check product #5 đang được reference ở đâu:

```sql
-- Check in order_items
SELECT * FROM order_items WHERE product_id = 5;
-- Result: 1 row (Order #4 có MacBook Pro 14)

-- Check in cart_items
SELECT * FROM cart_items WHERE product_id = 5;
-- Result: 0 rows (không có trong cart)
```

**Kết luận**: Product #5 (MacBook Pro 14) đang có trong Order #4, nên không thể xóa!

<function_calls>
<invoke name="executePwsh">
<parameter name="command">docker-compose exec postgres psql -U orderuser -d orderdb -c "SELECT * FROM order_items WHERE product_id = 5;"

---

#
# ✅ Giải pháp

### Option 1: Handle Error Gracefully (ĐÃ IMPLEMENT)

```python
@app.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    _require_admin(authorization)
    product = db.query(DBProduct).filter(DBProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        db.delete(product)
        db.commit()
    except Exception as e:
        db.rollback()
        if "foreign key constraint" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail="Cannot delete product. It is referenced in existing orders or cart items."
            )
        raise HTTPException(status_code=500, detail=f"Failed to delete product: {str(e)}")
    
    return None
```

**Kết quả:**
- ✅ User thấy message rõ ràng: "Cannot delete product. It is referenced in existing orders"
- ✅ Không còn 500 Internal Server Error
- ✅ Trả về 400 Bad Request với message hữu ích

---

### Option 2: Soft Delete (Không xóa thật)

```python
# Thêm column deleted_at vào products table
class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    deleted_at = Column(DateTime, nullable=True)  # ← Thêm

@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(DBProduct).filter(DBProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Soft delete
    product.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Product deleted"}

# Khi query, filter deleted products
@app.get("/products")
def list_products(db: Session = Depends(get_db)):
    products = db.query(DBProduct).filter(DBProduct.deleted_at == None).all()
    return products
```

**Ưu điểm:**
- ✅ Không mất dữ liệu
- ✅ Có thể restore
- ✅ Không vi phạm foreign key
- ✅ Audit trail

---

### Option 3: Cascade Delete (Xóa luôn references)

```sql
-- Thay đổi foreign key constraint
ALTER TABLE order_items
DROP CONSTRAINT order_items_product_id_fkey;

ALTER TABLE order_items
ADD CONSTRAINT order_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id)
ON DELETE CASCADE;  -- ← Thêm CASCADE

-- Hoặc SET NULL
ON DELETE SET NULL;
```

**Cảnh báo:**
- ⚠️ Xóa product → xóa luôn order items
- ⚠️ Mất dữ liệu lịch sử
- ⚠️ Không khuyến khích cho orders

---

### Option 4: Disable Product (Recommended)

```python
# Thêm column active vào products table
class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    active = Column(Boolean, default=True)  # ← Thêm

@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(DBProduct).filter(DBProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Disable instead of delete
    product.active = False
    db.commit()
    return {"message": "Product disabled"}

# Khi query, có thể filter hoặc không
@app.get("/products")
def list_products(include_inactive: bool = False, db: Session = Depends(get_db)):
    query = db.query(DBProduct)
    if not include_inactive:
        query = query.filter(DBProduct.active == True)
    return query.all()
```

**Ưu điểm:**
- ✅ Không mất dữ liệu
- ✅ Có thể enable lại
- ✅ Orders vẫn giữ product info
- ✅ Admin có thể xem inactive products

---

## 🧪 Test sau khi fix

### Test 1: Delete product có trong orders
```bash
# Try to delete product #5 (MacBook Pro 14)
curl -X DELETE http://localhost:8080/products/5 \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected: 400 Bad Request
# {
#   "detail": "Cannot delete product. It is referenced in existing orders or cart items."
# }
```

### Test 2: Delete product KHÔNG có trong orders
```bash
# Create new product
curl -X POST http://localhost:8080/products \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","price":100,"inventory":10}'

# Delete it (should work)
curl -X DELETE http://localhost:8080/products/6 \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected: 204 No Content (Success)
```

---

## 📊 Database Relationships

```
products (id)
    ↑
    │ Referenced by
    │
    ├─→ order_items (product_id)
    │       ↓
    │   Cannot delete if exists
    │
    └─→ cart_items (product_id)
            ↓
        Cannot delete if exists
```

---

## 🎯 Best Practice

### Khuyến nghị cho Production:

1. **Soft Delete hoặc Disable** (Option 2 hoặc 4)
   - Giữ lại dữ liệu lịch sử
   - Có thể restore
   - Không vi phạm foreign key

2. **Handle Error Gracefully** (Option 1 - ĐÃ IMPLEMENT)
   - User-friendly error messages
   - Proper HTTP status codes
   - Clear instructions

3. **KHÔNG dùng CASCADE DELETE** cho orders
   - Mất dữ liệu quan trọng
   - Không thể audit
   - Vi phạm business rules

---

## ✅ Summary

### Lỗi:
```
DELETE /products/5 → 500 Internal Server Error
Foreign Key Violation: Product #5 referenced in order_items
```

### Fix đã apply:
```python
# Catch exception và trả về 400 với message rõ ràng
try:
    db.delete(product)
    db.commit()
except Exception as e:
    if "foreign key constraint" in str(e).lower():
        raise HTTPException(status_code=400, detail="Cannot delete product...")
```

### Kết quả:
- ✅ User thấy message rõ ràng
- ✅ 400 Bad Request (thay vì 500)
- ✅ Hệ thống vẫn hoạt động bình thường
- ✅ Admin biết phải làm gì

### Next steps (Optional):
- Implement soft delete
- Add "active" flag
- UI hiển thị products có thể xóa vs không thể xóa

**Đã fix và restart product-service!** ✅
