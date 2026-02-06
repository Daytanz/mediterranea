-- Tabela categorias
CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome VARCHAR(50) NOT NULL,
  icone VARCHAR(10) NOT NULL
);

-- Tabela produtos
CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  preco_inteiro DECIMAL(10,2),
  preco_meia DECIMAL(10,2),
  foto_url VARCHAR(255),
  ativo BOOLEAN DEFAULT 1,
  categoria_id INTEGER,
  quantidade_estoque INTEGER DEFAULT NULL,
  unidade VARCHAR(20) DEFAULT 'unid',
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Tabela pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'Recebido',
  whatsapp_cliente VARCHAR(20) NOT NULL,
  mensagem_whatsapp TEXT
);

-- Tabela itens pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_pedido_id INTEGER,
  sabor_meia VARCHAR(100),
  FOREIGN KEY (item_pedido_id) REFERENCES itens_pedido(id)
);

-- Tabela admin
CREATE TABLE IF NOT EXISTS admin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT 1
);

-- Tabela configurações
CREATE TABLE IF NOT EXISTS configuracoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chave VARCHAR(50) UNIQUE NOT NULL,
  valor TEXT,
  tipo VARCHAR(20) DEFAULT 'string'
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido ON itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data_hora);

-- Dados iniciais (Insert only if not exists to avoid duplicates on re-run)
INSERT OR IGNORE INTO categorias (id, nome, icone) VALUES 
(1, 'Pizzas', '🍕'),
(2, 'Salames', '🧀'),
(3, 'Conservas', '🍯'),
(4, 'Sobremesas', '🍰');

-- Initial Admin (Password: senha123 - scrypt hash needed, using placeholder for now or pre-generated)
-- Note: In a real app, generate hash properly. For now I'll use a placeholder or plain text if dev mode, 
-- but PRD says "scrypt...". I will use a simple hash for demo or generate one in python script.
-- I'll skip inserting admin here and do it in python script where I can generate hash.

INSERT OR IGNORE INTO configuracoes (chave, valor, tipo) VALUES 
('whatsapp_numero', '5511999999999', 'string'),
('preco_meia_regra', 'mais_cara', 'string');
