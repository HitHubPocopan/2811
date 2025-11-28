-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'pos')),
  pos_number INTEGER,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url VARCHAR(500),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pos_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pos_number INTEGER NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_sales_pos_id ON sales(pos_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- Insert test data
-- Password hashes generated with SHA256
-- admin123 -> a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3
-- pocopan1711 -> 1fbc3a6036d5ca07a49c8573c9de5e9d8be36f2392c4ed7011ffaec1786051c8
-- pocopan2722 -> 877295fd5aaef9128b0a3190b6ce6b2001f3dd5a4a53ce458fb25ec93a96b43c
-- pocopan3733 -> 0cc15c46fef4eb66035590115388185e0a0346c149ee26a89bf0f947c5f52373

INSERT INTO users (email, password_hash, role, name) VALUES
('admin@test.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'admin', 'Admin');

INSERT INTO users (email, password_hash, role, pos_number, name) VALUES
('anabel@test.com', '1fbc3a6036d5ca07a49c8573c9de5e9d8be36f2392c4ed7011ffaec1786051c8', 'pos', 1, 'Costa del Este'),
('sofia@test.com', '877295fd5aaef9128b0a3190b6ce6b2001f3dd5a4a53ce458fb25ec93a96b43c', 'pos', 2, 'Mar de las Pampas'),
('jano@test.com', '0cc15c46fef4eb66035590115388185e0a0346c149ee26a89bf0f947c5f52373', 'pos', 3, 'Costa Esmeralda');

INSERT INTO products (name, description, price, stock, image_url, category, subcategory) VALUES
('Laptop', 'Computadora portátil de alta gama', 1299.99, 10, 'https://via.placeholder.com/300?text=Laptop', 'Computadoras', 'Laptops'),
('Mouse', 'Ratón inalámbrico', 25.99, 50, 'https://via.placeholder.com/300?text=Mouse', 'Periféricos', 'Mouse'),
('Teclado', 'Teclado mecánico RGB', 99.99, 20, 'https://via.placeholder.com/300?text=Teclado', 'Periféricos', 'Teclados'),
('Monitor', 'Monitor 4K de 32 pulgadas', 399.99, 5, 'https://via.placeholder.com/300?text=Monitor', 'Pantallas', 'Monitores'),
('Headphones', 'Auriculares Bluetooth con cancelación de ruido', 149.99, 15, 'https://via.placeholder.com/300?text=Headphones', 'Audio', 'Auriculares'),
('Webcam', 'Cámara web 1080p', 59.99, 25, 'https://via.placeholder.com/300?text=Webcam', 'Video', 'Webcams'),
('USB Hub', 'Hub USB 7 puertos', 34.99, 30, 'https://via.placeholder.com/300?text=USBHub', 'Conectividad', 'Hubs'),
('SSD', 'Unidad SSD 1TB', 79.99, 12, 'https://via.placeholder.com/300?text=SSD', 'Almacenamiento', 'Unidades SSD'),
('RAM', 'Memoria RAM DDR4 16GB', 89.99, 18, 'https://via.placeholder.com/300?text=RAM', 'Componentes', 'Memoria'),
('Fuente de poder', 'Fuente de alimentación 750W', 119.99, 8, 'https://via.placeholder.com/300?text=PSU', 'Componentes', 'Fuentes de poder');
