-- Cart Database Initialization

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(100) NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, product_id)
);

-- Note: No foreign keys to other databases!
-- product_id references product_db.products(id) but we can't enforce it
-- customer_id references customer_db.customers(id) but we can't enforce it

-- Insert demo cart items
INSERT INTO cart_items (customer_id, product_id, quantity) VALUES
    ('12345', 1, 2),  -- Alice: 2 Laptops
    ('12345', 2, 1),  -- Alice: 1 iPhone
    ('67890', 3, 3),  -- Bob: 3 iPads
    ('67890', 4, 1)   -- Bob: 1 Samsung
ON CONFLICT (customer_id, product_id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_customer_id ON cart_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
