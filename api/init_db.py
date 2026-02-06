import sqlite3
import os
from werkzeug.security import generate_password_hash

DATABASE = 'database.db'

def init_db():
    if os.path.exists(DATABASE):
        os.remove(DATABASE)

    conn = sqlite3.connect(DATABASE)
    with open('schema.sql', 'r') as f:
        conn.executescript(f.read())
    
    cur = conn.cursor()
    
    # Add Admin
    # Password: senha123
    password_hash = generate_password_hash('senha123')
    cur.execute("INSERT OR IGNORE INTO admin (email, senha_hash) VALUES (?, ?)", 
                ('admin@mediterranea.com', password_hash))
    
    # Add some sample products
    products = [
        # Pizzas
        ('Margherita', 'Molho de tomate, mussarela, manjericão', 45.00, 25.00, '/uploads/margherita.jpg', 1, 1, None, 'unid'),
        ('Calabresa', 'Molho de tomate, mussarela, calabresa, cebola', 48.00, 26.00, '/uploads/calabresa.jpg', 1, 1, None, 'unid'),
        ('Portuguesa', 'Molho, mussarela, presunto, ovo, cebola, azeitona', 50.00, 27.00, '/uploads/portuguesa.jpg', 1, 1, None, 'unid'),
        # Salames
        ('Salame Artesanal', 'Salame curado artesanalmente', 35.00, None, '/uploads/salame.jpg', 1, 2, 10, 'unid'),
        # Conservas
        ('Berinjela em Conserva', 'Berinjela no azeite com especiarias', 20.00, None, '/uploads/berinjela.jpg', 1, 3, 15, 'pote'),
        # Sobremesas
        ('Cannoli Siciliano', 'Massa crocante recheada com ricota doce', 12.00, None, '/uploads/cannoli.jpg', 1, 4, 20, 'unid')
    ]
    
    cur.executemany("""
        INSERT INTO produtos (nome, descricao, preco_inteiro, preco_meia, foto_url, ativo, categoria_id, quantidade_estoque, unidade)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, products)

    conn.commit()
    conn.close()
    print("Database initialized successfully.")

if __name__ == '__main__':
    init_db()
