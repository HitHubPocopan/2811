-- Actualizar datos de usuarios con nuevos nombres, emails y contraseñas
-- Ejecutar este script en Supabase SQL Editor

-- Eliminar usuarios antiguos
DELETE FROM users WHERE email IN ('pos1@test.com', 'pos2@test.com', 'pos3@test.com', 'anabel@test.com', 'sofia@test.com', 'jano@test.com');

-- Insertar nuevos usuarios con contraseñas
INSERT INTO users (email, password_hash, role, pos_number, name) VALUES
('anabel@test.com', '1fbc3a6036d5ca07a49c8573c9de5e9d8be36f2392c4ed7011ffaec1786051c8', 'pos', 1, 'Costa del Este'),
('sofia@test.com', '877295fd5aaef9128b0a3190b6ce6b2001f3dd5a4a53ce458fb25ec93a96b43c', 'pos', 2, 'Mar de las Pampas'),
('jano@test.com', '0cc15c46fef4eb66035590115388185e0a0346c149ee26a89bf0f947c5f52373', 'pos', 3, 'Costa Esmeralda');

-- Verificar que los usuarios fueron insertados correctamente
SELECT email, name, pos_number, role FROM users WHERE role = 'pos' ORDER BY pos_number;
