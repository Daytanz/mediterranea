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

-- Índices
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido ON itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data_hora);

-- Dados iniciais (Inserir apenas se não existirem)
INSERT INTO categorias (nome, icone) 
SELECT 'Pizzas', '🍕' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Pizzas')
UNION ALL
SELECT 'Salames', '🧀' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Salames')
UNION ALL
SELECT 'Conservas', '🍯' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Conservas')
UNION ALL
SELECT 'Sobremesas', '🍰' WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Sobremesas');

INSERT INTO admin (email, senha_hash) 
SELECT 'admin@mediterranea.com', 'scrypt:32768:8:1$pGfP3lE8iO4aR7kM$0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z' 
WHERE NOT EXISTS (SELECT 1 FROM admin WHERE email = 'admin@mediterranea.com');

INSERT INTO configuracoes (chave, valor, tipo) 
SELECT 'whatsapp_numero', '5511999999999', 'string' WHERE NOT EXISTS (SELECT 1 FROM configuracoes WHERE chave = 'whatsapp_numero')
UNION ALL
SELECT 'preco_meia_regra', 'mais_cara', 'string' WHERE NOT EXISTS (SELECT 1 FROM configuracoes WHERE chave = 'preco_meia_regra');
