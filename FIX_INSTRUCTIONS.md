# Fix Instructions

## Lỗi đã sửa:

### 1. PostCSS Config Error
**Lỗi**: `SyntaxError: Unexpected token 'export'`

**Nguyên nhân**: Node.js trong Docker container không hỗ trợ ES modules syntax trong postcss.config.js

**Giải pháp**: Đổi từ ES modules sang CommonJS

**Đã sửa các file:**
- `frontend/postcss.config.js`
- `services/product-service/frontend/postcss.config.js`
- `services/cart-service/frontend/postcss.config.js`
- `services/order-service/frontend/postcss.config.js`

```javascript
// Trước (ES modules - LỖI)
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}

// Sau (CommonJS - OK)
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

### 2. Database Healthcheck Error
**Lỗi**: `FATAL: database "orderuser" does not exist`

**Nguyên nhân**: Healthcheck đang check database name sai (orderuser thay vì orderdb)

**Giải pháp**: Thêm `-d orderdb` vào healthcheck command

```yaml
# Trước
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U orderuser"]

# Sau
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U orderuser -d orderdb"]
```

## Để chạy lại:

```bash
# Stop tất cả containers
docker-compose down

# Xóa volumes cũ (nếu cần)
docker-compose down -v

# Rebuild và start lại
docker-compose up --build
```

## Kiểm tra:

### 1. Check PostgreSQL
```bash
docker-compose logs postgres | grep "ready"
# Nên thấy: "database system is ready to accept connections"
```

### 2. Check Frontends
```bash
docker-compose logs product-frontend | grep "ready"
docker-compose logs cart-frontend | grep "ready"
docker-compose logs order-frontend | grep "ready"
docker-compose logs frontend | grep "ready"
# Nên thấy: "VITE v5.x.x ready in XXX ms"
```

### 3. Check Backends
```bash
docker-compose logs auth-service | grep "Uvicorn"
docker-compose logs product-service | grep "Uvicorn"
# Nên thấy: "Uvicorn running on http://0.0.0.0:XXXX"
```

## Access URLs sau khi fix:

- Main Frontend: http://localhost:3000
- Product UI: http://localhost:3002
- Cart UI: http://localhost:3004
- Order UI: http://localhost:3005
- API Gateway: http://localhost:8080

## Nếu vẫn lỗi:

### Lỗi PostCSS vẫn còn
```bash
# Xóa node_modules và rebuild
docker-compose down
docker-compose build --no-cache product-frontend cart-frontend order-frontend frontend
docker-compose up
```

### Lỗi Database connection
```bash
# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Hoặc recreate
docker-compose down -v
docker-compose up postgres
```

### Port conflicts
```bash
# Check ports đang dùng
netstat -ano | findstr :3000
netstat -ano | findstr :3002
netstat -ano | findstr :3004
netstat -ano | findstr :3005

# Kill process nếu cần
taskkill /PID <PID> /F
```

## Verified:
- ✅ PostCSS config đã đổi sang CommonJS
- ✅ Database healthcheck đã fix
- ✅ All services có đúng DATABASE_URL
- ✅ All frontends có đúng VITE_API_BASE

Chạy lại `docker-compose up --build` để apply fixes!
