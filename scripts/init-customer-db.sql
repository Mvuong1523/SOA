-- Customer Database Initialization

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo customers
INSERT INTO customers (id, name, email, phone, address) VALUES
    ('admin', 'Admin User', 'admin@example.com', '0000000000', 'Admin Office'),
    ('12345', 'Alice Nguyen', 'alice@example.com', '0123456789', '123 Le Loi, Q1, TPHCM'),
    ('67890', 'Bob Tran', 'bob@example.com', '0987654321', '456 Nguyen Hue, Q1, TPHCM')
ON CONFLICT (id) DO NOTHING;

-- Create index
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
