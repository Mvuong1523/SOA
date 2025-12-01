# Database Per Service - Implementation

## ✅ Đã implement Database riêng cho mỗi service!

### 🎯 Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Auth Service   │────▶│   auth_db       │
│   Port 8001     │     │ Port 5433       │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│Customer Service │────▶│  customer_db    │
│   Port 8003     │     │ Port 5434       │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│ Product Service │────▶│  product_db     │
│   Port 8002     │     │ Port 5435       │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  Cart Service   │────▶│   cart_db       │
│   Port 8004     │     │ Port 5436       │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  Order Service  │────▶│   order_db      │
│   Port 8005     │     │ Port 5437       │
└─────────────────┘     └─────────────────┘
```

---

## 📊 Database Details

| Service | Database | User | Port | Tables |
|---------|----------|------|------|--------|
| Auth | auth_db | authuser | 5433 | users |
| Customer | customer_db | customeruser | 5434 | customers |
| Product | product_db | productuser | 5435 | products |
| Cart | cart_db | cartuser | 5436 | cart_items |
| Order | order_db | orderuser | 5437 | orders, order_items |

---

## 🔑 Key Changes

### 1. No Foreign Keys Across Databases

**Before (Shared DB):**
```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER,
    product_id INTEGER,
    FOREIGN KEY (product_id) REFERENCES products(id)  -- ❌ Can't do this!
);
```

**After (Separate DBs):**
```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER,
    product_id INTEGER,
    product_name VARCHAR(255),  -- ✅ Duplicate data instead
    -- No foreign key to product_db.products!
);
```

### 2. Data Duplication

**Order Service stores product info:**
```python
# When creating order, store product_name
order_item = {
    "product_id": 1,
    "product_name": "Laptop Dell XPS 13",  # Duplicated from product_db
    "quantity": 2,
    "price": 1500.00
}
```

**Why?**
- Can't query product_db from order_db
- Need product info for order history
- Trade-off: Duplication vs Independence

### 3. Eventual Consistency

**Scenario: Product name changed**
```
1. Admin updates product name in product_db
   "Laptop Dell XPS 13" → "Dell XPS 13 Plus"

2. Old orders still show old name
   Order #1: "Laptop Dell XPS 13" (historical data)

3. New orders show new name
   Order #5: "Dell XPS 13 Plus"
```

**This is OK!** Orders should show product name at time of purchase.

---

## 🚀 Benefits

### 1. True Independence
```
✅ Each service owns its data
✅ Can deploy database independently
✅ Can scale database independently
✅ Can use different database types (PostgreSQL, MongoDB, etc.)
```

### 2. Fault Isolation
```
✅ product_db down → order_db still works
✅ cart_db down → product_db still works
✅ No cascade failures
```

### 3. Schema Evolution
```
✅ Change product_db schema → doesn't affect order_db
✅ Add columns to customers → doesn't affect cart_db
✅ Independent migrations
```

### 4. Technology Freedom
```
✅ Auth: PostgreSQL
✅ Product: PostgreSQL
✅ Cart: Redis (could change!)
✅ Order: PostgreSQL
✅ Customer: MongoDB (could change!)
```

---

## ⚠️ Trade-offs

### 1. Data Duplication
```
❌ Product name stored in both product_db and order_db
❌ Customer email stored in both customer_db and order_db (if needed)
❌ More storage space
```

**Solution:** Accept it! This is the microservices way.

### 2. No Foreign Key Constraints
```
❌ Can't enforce referential integrity at database level
❌ product_id in cart_items might reference non-existent product
❌ Must validate in application code
```

**Solution:** Validate in service layer.

### 3. Distributed Transactions
```
❌ Can't use database transactions across services
❌ Need Saga pattern or 2-phase commit
❌ More complex error handling
```

**Solution:** Implement compensating transactions.

### 4. Joins Across Services
```
❌ Can't JOIN order_items with products
❌ Must make multiple API calls
❌ Slower queries
```

**Solution:** Duplicate data or use API composition.

---

## 🧪 Testing

### Connect to each database:

```bash
# Auth DB
docker-compose exec postgres-auth psql -U authuser -d auth_db
\dt  # List tables: users

# Customer DB
docker-compose exec postgres-customer psql -U customeruser -d customer_db
\dt  # List tables: customers

# Product DB
docker-compose exec postgres-product psql -U productuser -d product_db
\dt  # List tables: products

# Cart DB
docker-compose exec postgres-cart psql -U cartuser -d cart_db
\dt  # List tables: cart_items

# Order DB
docker-compose exec postgres-order psql -U orderuser -d order_db
\dt  # List tables: orders, order_items
```

### Verify separation:

```bash
# Try to query products from order_db (should fail)
docker-compose exec postgres-order psql -U orderuser -d order_db -c "SELECT * FROM products;"
# ERROR: relation "products" does not exist ✅

# Products only exist in product_db
docker-compose exec postgres-product psql -U productuser -d product_db -c "SELECT * FROM products;"
# SUCCESS ✅
```

---

## 📝 Migration Guide

### From Shared DB to Separate DBs:

```bash
# 1. Stop all services
docker-compose down -v

# 2. Update docker-compose.yml (already done)

# 3. Start with new databases
docker-compose up --build

# 4. Data will be initialized from init scripts
```

### Data Migration (if needed):

```sql
-- Export from shared DB
pg_dump -U orderuser -d orderdb -t users > users.sql
pg_dump -U orderuser -d orderdb -t customers > customers.sql
pg_dump -U orderuser -d orderdb -t products > products.sql

-- Import to separate DBs
psql -U authuser -d auth_db < users.sql
psql -U customeruser -d customer_db < customers.sql
psql -U productuser -d product_db < products.sql
```

---

## 🎯 Best Practices

### 1. API-First Design
```python
# Don't query other service's database directly
# ❌ BAD
product = db.query(Product).filter_by(id=product_id).first()

# ✅ GOOD
product = requests.get(f"http://product-service:8002/products/{product_id}").json()
```

### 2. Store What You Need
```python
# Store denormalized data
order_item = {
    "product_id": 1,
    "product_name": "Laptop",  # Duplicate
    "product_price": 1500.00,  # Duplicate at time of order
    "quantity": 2
}
```

### 3. Eventual Consistency
```python
# Accept that data might be slightly out of sync
# Use events to sync when needed
@subscribe("product.updated")
def on_product_updated(event):
    # Update cached product info if needed
    pass
```

### 4. Validate in Application
```python
# Since no foreign keys, validate in code
def add_to_cart(customer_id, product_id):
    # Check if product exists via API
    product = get_product(product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    
    # Check if customer exists via API
    customer = get_customer(customer_id)
    if not customer:
        raise HTTPException(404, "Customer not found")
    
    # Now add to cart
    cart_item = CartItem(customer_id=customer_id, product_id=product_id)
    db.add(cart_item)
```

---

## ✅ Checklist

- [x] Separate PostgreSQL instances for each service
- [x] Separate databases (auth_db, customer_db, product_db, cart_db, order_db)
- [x] Separate users and passwords
- [x] Separate ports (5433-5437)
- [x] Separate volumes
- [x] Separate init scripts
- [x] No foreign keys across databases
- [x] Data duplication where needed (product_name in orders)
- [x] Services connect to their own database only

---

## 🎉 Result

**Before:**
```
❌ 1 shared database (orderdb)
❌ Foreign keys between services
❌ Can't deploy independently
❌ Schema changes affect all services
```

**After:**
```
✅ 5 separate databases
✅ No foreign keys across databases
✅ Can deploy independently
✅ Schema changes isolated
✅ True microservices architecture!
```

---

## 📊 Updated Microservices Score

| Tiêu chí | Before | After |
|----------|--------|-------|
| 1. Mỗi service độc lập | ✅ 10/10 | ✅ 10/10 |
| 2. Có database riêng | ⚠️ 3/10 | ✅ **10/10** |
| 3. Làm đúng 1 domain | ✅ 10/10 | ✅ 10/10 |
| 4. Deploy riêng lẻ | ✅ 10/10 | ✅ 10/10 |
| 5. Giao tiếp qua API/MQ | ⚠️ 6/10 | ⚠️ 6/10 |
| 6. Scale độc lập | ✅ 10/10 | ✅ 10/10 |
| 7. Chạy tiến trình riêng | ✅ 10/10 | ✅ 10/10 |
| **TỔNG** | **59/70** | **66/70** |

**Improvement:** +7 points! 🎉

---

## 🚀 Next Steps

To reach 70/70, add Message Queue:
- [ ] RabbitMQ/Kafka for async communication
- [ ] Event-driven architecture
- [ ] Pub/Sub pattern

**Current Status:** 66/70 = **94%** ✅
