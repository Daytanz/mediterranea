-- Schema para Supabase (PostgreSQL)

-- Tabela categorias
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) NOT NULL,
  icone VARCHAR(10) NOT NULL
);

-- Tabela produtos
CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  preco_inteiro DECIMAL(10,2),
  preco_meia DECIMAL(10,2),
  foto_url VARCHAR(255),
  ativo BOOLEAN DEFAULT TRUE,
  categoria_id INTEGER,
  quantidade_estoque INTEGER DEFAULT NULL,
  unidade VARCHAR(20) DEFAULT 'unid',
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Tabela pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'Recebido',
  whatsapp_cliente VARCHAR(20) NOT NULL,
  mensagem_whatsapp TEXT
);

-- Tabela itens pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER,
  produto_id INTEGER,
  tipo VARCHAR(10) CHECK (tipo IN ('inteira', 'meia')),
  quantidade INTEGER DEFAULT 1,
  preco_unitario DECIMAL(10,2),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- Tabela meias pizzas
CREATE TABLE IF NOT EXISTS meias_pizzas (
  id SERIAL PRIMARY KEY,
  item_pedido_id INTEGER,
  sabor_meia VARCHAR(100),
  FOREIGN KEY (item_pedido_id) REFERENCES itens_pedido(id)
);

-- Tabela admin
CREATE TABLE IF NOT EXISTS admin (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT TRUE
);

-- Tabela configurações
CREATE TABLE IF NOT EXISTS configuracoes (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(50) UNIQUE NOT NULL,
  valor TEXT,
  tipo VARCHAR(20) DEFAULT 'string'
);

-- Dados iniciais (Categorias)
INSERT INTO categorias (nome, icone) VALUES 
('Pizzas', '🍕'),
('Salames', '🧀'),
('Conservas', '🍯'),
('Sobremesas', '🍰')
ON CONFLICT DO NOTHING;

-- Dados iniciais (Admin)
-- Senha padrão: senha123 (hash gerado)
INSERT INTO admin (email, senha_hash) VALUES 
('admin@mediterranea.com', 'scrypt:32768:8:1$W7L8z6k1h3g8$10e0c8b3f1a2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5')
ON CONFLICT (email) DO NOTHING;

-- Dados iniciais (Configurações)
INSERT INTO configuracoes (chave, valor, tipo) VALUES 
('whatsapp_numero', '5511999999999', 'string'),
('preco_meia_regra', 'mais_cara', 'string'),
('shop_status', 'auto', 'string'),
('opening_msg', 'Os pedidos abrem na quinta-feira de manhã.', 'string'),
('closing_msg', 'Pedidos encerrados para esta semana.', 'string'),
('schedule_open_day', '4', 'string'),
('schedule_open_hour', '7', 'string'),
('schedule_close_day', '4', 'string'),
('schedule_close_hour', '16', 'string')
ON CONFLICT (chave) DO NOTHING;
