-- Auth Database Initialization

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer',
    customer_id VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo users
INSERT INTO users (username, password, role, customer_id) VALUES
    ('admin', 'admin123', 'admin', 'admin'),
    ('user', 'user123', 'customer', '12345'),
    ('user2', 'user123', 'customer', '67890')
ON CONFLICT (username) DO NOTHING;

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users(customer_id);
