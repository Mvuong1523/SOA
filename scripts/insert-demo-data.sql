-- Insert demo cart items
INSERT INTO cart_items (customer_id, product_id, quantity) VALUES
    ('12345', 1, 2),  -- Alice: 2 Laptops
    ('12345', 2, 1),  -- Alice: 1 iPhone
    ('67890', 3, 3),  -- Bob: 3 iPads
    ('67890', 4, 1)   -- Bob: 1 Samsung
ON CONFLICT DO NOTHING;

-- Insert demo orders
INSERT INTO orders (customer_id, note, payment_method, status, total_amount) VALUES
    ('12345', 'Giao hàng buổi sáng', 'COD', 'pending', 3899.00),
    ('12345', 'Gọi trước khi giao', 'online', 'confirmed', 1500.00),
    ('67890', 'Để ở bảo vệ', 'COD', 'shipping', 2296.00)
ON CONFLICT DO NOTHING;

-- Insert order items for order #1 (Alice - 3899.00)
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
    (1, 1, 2, 1500.00),  -- 2 Laptops
    (1, 2, 1, 899.00);   -- 1 iPhone

-- Insert order items for order #2 (Alice - 1500.00)
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
    (2, 1, 1, 1500.00);  -- 1 Laptop

-- Insert order items for order #3 (Bob - 2296.00)
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
    (3, 3, 3, 499.00),   -- 3 iPads
    (3, 4, 1, 799.00);   -- 1 Samsung

-- Update product inventory (giả sử đã bán)
UPDATE products SET inventory = inventory - 3 WHERE id = 1;  -- Sold 3 Laptops
UPDATE products SET inventory = inventory - 1 WHERE id = 2;  -- Sold 1 iPhone
UPDATE products SET inventory = inventory - 3 WHERE id = 3;  -- Sold 3 iPads
UPDATE products SET inventory = inventory - 1 WHERE id = 4;  -- Sold 1 Samsung
