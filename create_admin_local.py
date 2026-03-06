
import psycopg2
from werkzeug.security import generate_password_hash

# Using the NEW CORRECT password and DIRECT connection string
DB_URL = "postgresql://postgres:cWGw4magOtx3zMrU@db.wintsnrdxprcubqkniqz.supabase.co:5432/postgres"

try:
    print("Connecting to Supabase...")
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    # Generate hash for 'admin123'
    password_hash = generate_password_hash('admin123')
    
    print("Creating emergency admin...")
    
    # Create a SECOND admin user just to be safe
    # Using 'admin2@mediterranea.com' so we don't conflict if the other one exists
    cur.execute("DELETE FROM admin WHERE email = 'admin2@mediterranea.com'")
    
    cur.execute(
        "INSERT INTO admin (email, senha_hash) VALUES (%s, %s)",
        ('admin2@mediterranea.com', password_hash)
    )
    
    conn.commit()
    print("\nSUCCESS! Second admin created.")
    print("Email: admin2@mediterranea.com")
    print("Password: admin123")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"\nERROR: {e}")
