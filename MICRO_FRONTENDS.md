# Micro-Frontends Architecture

## Overview
Hệ thống sử dụng kiến trúc micro-frontends, mỗi service có UI riêng biệt để đảm bảo tính độc lập và không ảnh hưởng lẫn nhau.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Main Frontend (Port 3000)                 │
│              Orchestrator / Landing Page / Auth              │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼────────┐   ┌──────▼──────────┐
│   Product UI   │   │    Cart UI      │   │    Order UI     │
│   Port 3002    │   │   Port 3004     │   │   Port 3005     │
└───────┬────────┘   └────────┬────────┘   └──────┬──────────┘
        │                     │                     │
┌───────▼────────┐   ┌────────▼────────┐   ┌──────▼──────────┐
│ Product Service│   │  Cart Service   │   │  Order Service  │
│   Port 8002    │   │   Port 8004     │   │   Port 8005     │
└────────────────┘   └─────────────────┘   └─────────────────┘
```

## Services & Frontends

### 1. Product Service + Frontend
**Backend**: `http://localhost:8002`
**Frontend**: `http://localhost:3002`

**Features**:
- View all products
- Create new product (Admin)
- Edit product (Admin)
- Delete product (Admin)
- Manage inventory

**Tech Stack**:
- React 18 + Vite
- Tailwind CSS
- Axios

**Files**:
```
services/product-service/
├── main.py                    # Backend API
├── database.py                # SQLAlchemy models
└── frontend/
    ├── src/
    │   ├── App.jsx           # Product management UI
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    └── Dockerfile
```

### 2. Cart Service + Frontend
**Backend**: `http://localhost:8004`
**Frontend**: `http://localhost:3004`

**Features**:
- View cart items
- Add items to cart
- Update quantities
- Remove items
- Clear cart
- Calculate total

**Tech Stack**:
- React 18 + Vite
- Tailwind CSS
- Axios

**Files**:
```
services/cart-service/
├── main.py                    # Backend API
├── database.py                # SQLAlchemy models
└── frontend/
    ├── src/
    │   ├── App.jsx           # Cart management UI
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    └── Dockerfile
```

### 3. Order Service + Frontend
**Backend**: `http://localhost:8005`
**Frontend**: `http://localhost:3005`

**Features**:
- View all orders
- View order details
- Update order status (Admin)
- Filter by status
- Order history

**Tech Stack**:
- React 18 + Vite
- Tailwind CSS
- Axios

**Files**:
```
services/order-service/
├── main.py                    # Backend API
├── database.py                # SQLAlchemy models
└── frontend/
    ├── src/
    │   ├── App.jsx           # Order management UI
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    └── Dockerfile
```

### 4. Main Frontend (Orchestrator)
**Frontend**: `http://localhost:3000`

**Features**:
- User authentication
- Navigation between micro-frontends
- Integrated shopping experience
- Cart + Products + Orders in one place

**Tech Stack**:
- React 18 + Vite
- Tailwind CSS
- Axios

**Files**:
```
frontend/
├── src/
│   ├── App.jsx               # Main orchestrator
│   ├── components/
│   │   ├── Login.jsx
│   │   ├── ProductList.jsx
│   │   ├── Cart.jsx
│   │   └── OrderHistory.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
└── Dockerfile
```

## Benefits of Micro-Frontends

### 1. **Independence**
- Mỗi team có thể phát triển UI riêng
- Deploy độc lập
- Không ảnh hưởng lẫn nhau

### 2. **Technology Freedom**
- Có thể dùng framework khác nhau (React, Vue, Angular)
- Upgrade từng phần
- Experiment với công nghệ mới

### 3. **Scalability**
- Scale frontend theo nhu cầu
- Load balancing dễ dàng
- Performance optimization riêng biệt

### 4. **Team Autonomy**
- Product team → Product UI
- Cart team → Cart UI
- Order team → Order UI

### 5. **Fault Isolation**
- Lỗi ở Product UI không ảnh hưởng Cart UI
- Graceful degradation
- Better user experience

## Development

### Run All Frontends
```bash
docker-compose up --build
```

### Run Individual Frontend
```bash
# Product Frontend
cd services/product-service/frontend
npm install
npm run dev
# Access: http://localhost:3002

# Cart Frontend
cd services/cart-service/frontend
npm install
npm run dev
# Access: http://localhost:3004

# Order Frontend
cd services/order-service/frontend
npm install
npm run dev
# Access: http://localhost:3005

# Main Frontend
cd frontend
npm install
npm run dev
# Access: http://localhost:3000
```

## Communication Between Micro-Frontends

### 1. **Direct API Calls**
Mỗi frontend gọi trực tiếp backend service của nó:
```javascript
// Product Frontend
axios.get('http://localhost:8002/products')

// Cart Frontend
axios.get('http://localhost:8004/customers/12345/cart')

// Order Frontend
axios.get('http://localhost:8005/orders')
```

### 2. **Cross-Service Communication**
Cart Frontend cần product info:
```javascript
// Cart Frontend calls both services
const cart = await axios.get('http://localhost:8004/customers/12345/cart')
const product = await axios.get('http://localhost:8002/products/1')
```

### 3. **Shared State (Optional)**
Có thể dùng:
- LocalStorage
- SessionStorage
- Cookies
- Event Bus
- Module Federation (Webpack 5)

## Deployment Strategies

### 1. **Separate Domains**
```
products.example.com  → Product Frontend
cart.example.com      → Cart Frontend
orders.example.com    → Order Frontend
app.example.com       → Main Frontend
```

### 2. **Path-based Routing**
```
example.com/products  → Product Frontend
example.com/cart      → Cart Frontend
example.com/orders    → Order Frontend
example.com/          → Main Frontend
```

### 3. **Iframe Integration**
Main frontend embeds micro-frontends via iframe:
```html
<iframe src="http://localhost:3002" />
<iframe src="http://localhost:3004" />
```

### 4. **Module Federation (Recommended)**
Webpack 5 Module Federation cho phép share components:
```javascript
// webpack.config.js
new ModuleFederationPlugin({
  name: 'productApp',
  filename: 'remoteEntry.js',
  exposes: {
    './ProductList': './src/components/ProductList'
  }
})
```

## Environment Variables

### Product Frontend
```env
VITE_API_BASE=http://localhost:8002
```

### Cart Frontend
```env
VITE_CART_API=http://localhost:8004
VITE_PRODUCT_API=http://localhost:8002
```

### Order Frontend
```env
VITE_API_BASE=http://localhost:8005
```

### Main Frontend
```env
VITE_API_BASE=http://localhost:8080
```

## Testing

### Unit Tests
Mỗi frontend có test riêng:
```bash
cd services/product-service/frontend
npm test
```

### Integration Tests
Test communication giữa frontends:
```bash
npm run test:integration
```

### E2E Tests
Test toàn bộ flow:
```bash
npm run test:e2e
```

## Monitoring

### Performance
- Lighthouse scores cho mỗi frontend
- Bundle size analysis
- Load time tracking

### Error Tracking
- Sentry cho mỗi frontend
- Error boundaries
- Fallback UI

### Analytics
- Google Analytics
- User behavior tracking
- Conversion tracking

## Best Practices

### 1. **Consistent Design System**
- Shared Tailwind config
- Common components library
- Design tokens

### 2. **API Contracts**
- OpenAPI specs
- TypeScript types
- API versioning

### 3. **Authentication**
- Shared JWT token
- SSO integration
- Token refresh

### 4. **Error Handling**
- Graceful degradation
- Fallback UI
- Error boundaries

### 5. **Performance**
- Code splitting
- Lazy loading
- CDN for static assets

## Future Enhancements

- [ ] Module Federation setup
- [ ] Shared component library
- [ ] Centralized state management
- [ ] Server-Side Rendering (SSR)
- [ ] Progressive Web App (PWA)
- [ ] A/B testing framework
- [ ] Feature flags
- [ ] Analytics dashboard

## Resources

- [Micro Frontends](https://micro-frontends.org/)
- [Module Federation](https://webpack.js.org/concepts/module-federation/)
- [Single-SPA](https://single-spa.js.org/)
- [Bit](https://bit.dev/)

## Support

For questions about micro-frontends architecture, contact the team.
