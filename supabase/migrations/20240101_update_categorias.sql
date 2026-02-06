-- Add foto_url and description to categorias
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS foto_url VARCHAR(255);
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Update existing categories with default images (so they aren't empty)
UPDATE categorias SET 
  foto_url = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80',
  descricao = 'Massa de longa fermentação'
WHERE nome = 'Pizzas';

UPDATE categorias SET 
  foto_url = 'https://images.unsplash.com/photo-1626079561842-887413554e4b?auto=format&fit=crop&w=500&q=80',
  descricao = 'Seleção de embutidos artesanais'
WHERE nome = 'Salames';

UPDATE categorias SET 
  foto_url = 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=500&q=80',
  descricao = 'Sabores autênticos em conserva'
WHERE nome = 'Conservas';

UPDATE categorias SET 
  foto_url = 'https://images.unsplash.com/photo-1551024601-564d6d6744f1?auto=format&fit=crop&w=500&q=80',
  descricao = 'Doces tradicionais'
WHERE nome = 'Sobremesas';
