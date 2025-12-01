-- Order Database Initialization

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(100) NOT NULL,
    note TEXT,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'COD',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(255),  -- Duplicate data from product service
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Note: No foreign key to product_db.products!
-- We store product_name to avoid cross-database queries
-- This is data duplication but necessary for microservices

-- Insert demo orders
INSERT INTO orders (customer_id, note, payment_method, status, total_amount) VALUES
    ('12345', 'Giao hàng buổi sáng', 'COD', 'pending', 3899.00),
    ('12345', 'Gọi trước khi giao', 'online', 'confirmed', 1500.00),
    ('67890', 'Để ở bảo vệ', 'COD', 'shipping', 2296.00)
ON CONFLICT DO NOTHING;

-- Insert order items
INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES
    (1, 1, 'Laptop Dell XPS 13', 2, 1500.00),
    (1, 2, 'iPhone 15 Pro', 1, 899.00),
    (2, 1, 'Laptop Dell XPS 13', 1, 1500.00),
    (3, 3, 'iPad Air', 3, 499.00),
    (3, 4, 'Samsung Galaxy S24', 1, 799.00)
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
