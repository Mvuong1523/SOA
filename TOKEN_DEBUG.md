# Token 401 Unauthorized - Debug Guide

## 🔴 Lỗi
```
POST /products → 401 Unauthorized
```

## 🔍 Nguyên nhân có thể

### 1. Token không được truyền
```javascript
// Check trong browser console
console.log('Token:', token)
// Nếu undefined → token không được truyền
```

### 2. Token hết hạn
```javascript
// JWT token có expiration time (default: 60 phút)
// Nếu login lâu rồi → token hết hạn
```

### 3. Token format sai
```javascript
// Phải có "Bearer " prefix
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Role không phải admin
```javascript
// Product CRUD requires admin role
// Customer role → 403 Forbidden
```

## 🧪 Debug Steps

### Step 1: Check token trong localStorage
```javascript
// Mở browser console (F12)
localStorage.getItem('token')

// Nếu null → chưa login hoặc đã logout
// Nếu có value → token tồn tại
```

### Step 2: Decode JWT token
```javascript
// Copy token từ localStorage
// Paste vào https://jwt.io

// Check:
// - exp: expiration time (Unix timestamp)
// - role: phải là "admin"
// - sub: customer_id
```

### Step 3: Check token trong React state
```javascript
// Thêm vào ProductList component
useEffect(() => {
  console.log('ProductList token:', token)
  console.log('Is admin:', isAdmin)
}, [token, isAdmin])
```

### Step 4: Check request headers
```javascript
// Mở Network tab trong DevTools
// Click vào POST /products request
// Check Headers tab
// Tìm "Authorization: Bearer ..."
```

## ✅ Solutions

### Solution 1: Re-login
```
1. Logout
2. Login lại với admin account
3. Token mới sẽ được tạo
4. Try create product again
```

### Solution 2: Check admin role
```javascript
// Trong App.jsx
console.log('User:', user)
console.log('Role:', user?.role)

// Phải thấy: { role: 'admin', customer_id: 'admin' }
```

### Solution 3: Increase token expiration
```bash
# .env file
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24 hours instead of 60 minutes
```

### Solution 4: Auto-refresh token (Advanced)
```javascript
// Implement token refresh logic
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expired, refresh it
      const newToken = await refreshToken()
      // Retry request with new token
    }
    return Promise.reject(error)
  }
)
```

## 🎯 Quick Fix

### Nếu đang test:
```
1. Mở http://localhost:3000
2. Logout (nếu đang login)
3. Login với: admin / admin123
4. Ngay lập tức try create product
5. Should work! ✅
```

### Nếu vẫn lỗi:
```javascript
// Check trong browser console
const token = localStorage.getItem('token')
console.log('Token exists:', !!token)
console.log('Token length:', token?.length)

// Decode token
const payload = JSON.parse(atob(token.split('.')[1]))
console.log('Token payload:', payload)
console.log('Role:', payload.role)
console.log('Expires:', new Date(payload.exp * 1000))
```

## 📊 Token Flow

### Normal Flow:
```
1. User login → POST /auth/login
2. Server returns token
3. Frontend saves to localStorage
4. Frontend sets token in React state
5. ProductList receives token via props
6. ProductList sends token in Authorization header
7. Backend validates token
8. Success! ✅
```

### Where it can break:
```
1. Login fails → No token ❌
2. localStorage cleared → Token lost ❌
3. Token not set in state → Props undefined ❌
4. Token expired → 401 Unauthorized ❌
5. Wrong role → 403 Forbidden ❌
6. Token format wrong → 401 Unauthorized ❌
```

## 🔧 Code Improvements (Already Applied)

### Added token validation:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  
  // Check if token exists
  if (!token) {
    setMessage('❌ Please login as admin first')
    return
  }
  
  // ... rest of code
}
```

### Better error messages:
```javascript
catch (error) {
  const errorMsg = error.response?.data?.detail || error.message || 'Operation failed'
  setMessage(`❌ ${errorMsg}`)
  setTimeout(() => setMessage(''), 5000)  // Show longer
}
```

## ✅ Test Checklist

- [ ] Login với admin account
- [ ] Check localStorage có token
- [ ] Check console không có errors
- [ ] Check Network tab có Authorization header
- [ ] Token chưa hết hạn (< 60 phút)
- [ ] Role = "admin"
- [ ] Try create product
- [ ] Should work!

## 🎉 Expected Result

After fix:
```
1. Login admin → Token saved
2. Click "+ Add Product" → Form appears
3. Fill form → Submit
4. Request sent with Authorization header
5. Backend validates token
6. Product created! ✅
7. Message: "✅ Product created!"
```

If still 401:
```
Message: "❌ Invalid token" or "❌ Please login as admin first"
→ Re-login and try again
```
