
import psycopg2
from werkzeug.security import generate_password_hash
import os

# Use the hardcoded URL we know works
DB_URL = "postgresql://postgres.wintsnrdxprcubqkniqz:TraeAI123!@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

try:
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    # Generate correct hash for 'admin123'
    password_hash = generate_password_hash('admin123')
    
    print("Resetting admin password...")
    
    # Delete existing admin to avoid conflicts
    cur.execute("DELETE FROM admin WHERE email = 'admin@mediterranea.com'")
    
    # Insert fresh admin
    cur.execute(
        "INSERT INTO admin (email, senha_hash) VALUES (%s, %s)",
        ('admin@mediterranea.com', password_hash)
    )
    
    conn.commit()
    print("SUCCESS! Password reset to 'admin123'")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
