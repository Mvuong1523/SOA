# Nginx Gateway Routes

## API Routes Configuration

### Auth Service (Port 8001)
```nginx
location /auth/ {
    proxy_pass http://auth-service:8001/auth/;
}
```
**Endpoints:**
- `POST /auth/login` → Auth Service
- `GET /auth/validate` → Auth Service

---

### Product Service (Port 8002)
```nginx
location /products {
    proxy_pass http://product-service:8002/products;
}
```
**Endpoints:**
- `GET /products` → List products
- `GET /products/{id}` → Get product
- `POST /products` → Create product (Admin)
- `PUT /products/{id}` → Update product (Admin)
- `DELETE /products/{id}` → Delete product (Admin)
- `GET /products/{id}/stock` → Check stock
- `PUT /products/{id}/stock` → Update stock

---

### Cart Service (Port 8004)
```nginx
location ~ ^/customers/[^/]+/cart {
    proxy_pass http://cart-service:8004;
}
```
**Endpoints:**
- `GET /customers/{customer_id}/cart` → Get cart
- `POST /customers/{customer_id}/cart` → Add to cart
- `PUT /customers/{customer_id}/cart/{product_id}` → Update quantity
- `DELETE /customers/{customer_id}/cart/{product_id}` → Remove item
- `DELETE /customers/{customer_id}/cart` → Clear cart

**Note:** Phải đặt TRƯỚC `/customers/` route để tránh conflict!

---

### Customer Service (Port 8003)
```nginx
location /customers/ {
    proxy_pass http://customer-service:8003/customers/;
}
```
**Endpoints:**
- `GET /customers/{id}` → Get customer info

---

### Order Service (Port 8005)
```nginx
location /orders {
    proxy_pass http://order-service:8005/orders;
}
```
**Endpoints:**
- `GET /orders` → List orders
- `GET /orders/{id}` → Get order
- `POST /orders` → Create order
- `PUT /orders/{id}/status` → Update status (Admin)

---

### Notification Service (Port 8006)
```nginx
location /notifications/ {
    proxy_pass http://notification-service:8006/notifications/;
}
```
**Endpoints:**
- `POST /notifications/email` → Send email

---

### Make-Order Service (Port 8007)
```nginx
location /ordering {
    proxy_pass http://make-order-service:8007;
}
```
**Endpoints:**
- `POST /ordering` → Place order (orchestration)

---

## Route Priority

Nginx matches routes in order. Important order:

1. **Specific routes first** (cart with regex)
2. **General routes later** (customers)

```nginx
# ✅ CORRECT ORDER
location ~ ^/customers/[^/]+/cart { ... }  # Match first
location /customers/ { ... }                # Match second

# ❌ WRONG ORDER
location /customers/ { ... }                # Would match everything!
location ~ ^/customers/[^/]+/cart { ... }  # Never reached
```

---

## Testing Routes

### Test Cart Routes
```bash
# Get cart
curl http://localhost:8080/customers/12345/cart

# Add to cart
curl -X POST http://localhost:8080/customers/12345/cart \
  -H "Content-Type: application/json" \
  -d '{"product_id":1,"quantity":2}'

# Update cart
curl -X PUT http://localhost:8080/customers/12345/cart/1 \
  -H "Content-Type: application/json" \
  -d '{"product_id":1,"quantity":3}'

# Delete from cart
curl -X DELETE http://localhost:8080/customers/12345/cart/1

# Clear cart
curl -X DELETE http://localhost:8080/customers/12345/cart
```

### Test Other Routes
```bash
# Products
curl http://localhost:8080/products

# Customer
curl http://localhost:8080/customers/12345

# Orders
curl http://localhost:8080/orders

# Auth
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"user123"}'
```

---

## Troubleshooting

### 404 Not Found
```bash
# Check nginx logs
docker-compose logs gateway

# Check if route matches
# Look for the location block that should match
```

### 502 Bad Gateway
```bash
# Backend service not running
docker-compose ps

# Check backend logs
docker-compose logs cart-service
```

### CORS Errors
```bash
# Already fixed with CORS middleware in all services
# If still occurs, check browser console for details
```

---

## Reload Nginx Config

After changing `gateway/nginx.conf`:

```bash
# Restart gateway
docker-compose restart gateway

# Or rebuild
docker-compose up --build -d gateway
```

---

## Complete nginx.conf

See `gateway/nginx.conf` for full configuration with:
- All service routes
- CORS headers
- Proxy settings
- Health check endpoint
