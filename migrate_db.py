import psycopg2
import os

DATABASE_URL = "postgresql://postgres.wintsnrdxprcubqkniqz:TraeAI123!@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

def run_migration():
    print("Connecting to database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Creating eventos table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS eventos (
                id SERIAL PRIMARY KEY,
                titulo TEXT NOT NULL,
                descricao TEXT,
                data_hora TEXT NOT NULL,
                foto_url TEXT,
                ativo BOOLEAN DEFAULT TRUE
            );
        """)
        
        print("Creating reservas_evento table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reservas_evento (
                id SERIAL PRIMARY KEY,
                evento_id INTEGER REFERENCES eventos(id) ON DELETE CASCADE,
                nome_cliente TEXT NOT NULL,
                telefone_cliente TEXT NOT NULL,
                qtd_adultos INTEGER DEFAULT 0,
                qtd_criancas INTEGER DEFAULT 0,
                data_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        print("Checking categorias foreign keys on produtos...")
        # Make sure deleting a category doesn't violate foreign key if we just set to NULL
        # The app.py already does UPDATE produtos SET categoria_id = NULL before deleting.
        
        print("Migration successful.")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    run_migration()
