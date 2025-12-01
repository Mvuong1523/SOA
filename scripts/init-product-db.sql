-- Product Database Initialization

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

-- Insert demo products
INSERT INTO products (name, price, inventory, description) VALUES
    ('Laptop Dell XPS 13', 1500.00, 10, 'Laptop cao cấp, màn hình 13 inch, CPU Intel i7'),
    ('iPhone 15 Pro', 899.00, 25, 'Smartphone Apple mới nhất, 256GB'),
    ('iPad Air', 499.00, 15, 'Máy tính bảng Apple, màn hình 10.9 inch'),
    ('Samsung Galaxy S24', 799.00, 20, 'Smartphone Samsung flagship'),
    ('MacBook Pro 14', 1999.00, 8, 'Laptop Apple M3 Pro, 14 inch')
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
