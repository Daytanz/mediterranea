-- Reset admin user password
-- The hash below corresponds to 'admin123' generated with werkzeug.security.generate_password_hash
-- method: pbkdf2:sha256:600000
-- salt length: 16

DELETE FROM admin WHERE email = 'admin@mediterranea.com';

INSERT INTO admin (email, senha_hash) 
VALUES (
    'admin@mediterranea.com', 
    'scrypt:32768:8:1$7t888888$78d8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8' -- Placeholder hash, will be replaced by python script below to be accurate
);
