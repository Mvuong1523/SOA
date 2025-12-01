-- Database initialization script

-- Users table (for auth-service)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer',
    customer_id VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    inventory INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(100) NOT NULL,
    note TEXT,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'COD',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Cart table
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(100) NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE(customer_id, product_id)
);

-- Insert demo users
INSERT INTO users (username, password, role, customer_id) VALUES
    ('admin', 'admin123', 'admin', 'admin'),
    ('user', 'user123', 'customer', '12345')
ON CONFLICT (username) DO NOTHING;

-- Insert demo customers
INSERT INTO customers (id, name, email, phone, address) VALUES
    ('admin', 'Admin User', 'admin@example.com', '0000000000', 'Admin Office'),
    ('12345', 'Alice Nguyen', 'alice@example.com', '0123456789', '123 Le Loi, Q1, TPHCM'),
    ('67890', 'Bob Tran', 'bob@example.com', '0987654321', '456 Nguyen Hue, Q1, TPHCM')
ON CONFLICT (id) DO NOTHING;

-- Insert demo products
INSERT INTO products (name, price, inventory, description) VALUES
    ('Laptop Dell XPS 13', 1500.00, 10, 'Laptop cao cấp, màn hình 13 inch, CPU Intel i7'),
    ('iPhone 15 Pro', 899.00, 25, 'Smartphone Apple mới nhất, 256GB'),
    ('iPad Air', 499.00, 15, 'Máy tính bảng Apple, màn hình 10.9 inch'),
    ('Samsung Galaxy S24', 799.00, 20, 'Smartphone Samsung flagship'),
    ('MacBook Pro 14', 1999.00, 8, 'Laptop Apple M3 Pro, 14 inch')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_customer_id ON cart_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
