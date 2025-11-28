UPDATE users 
SET password_hash = '726ae4bd9614b128b4f62abc84d76c3e99641b7360c029771bcff1af8e6a6cdb'
WHERE email = 'admin@test.com';

SELECT email, role FROM users WHERE email = 'admin@test.com';
