import os
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, jsonify, request, g, send_from_directory
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
import datetime

# Allowed extensions for file uploads
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')

# Force strict DATABASE_URL usage from environment variables
DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    # On Render, this MUST be set. If missing, we want it to crash explicitly so we know.
    # For local dev, you should have a .env file or set it manually.
    print("WARNING: DATABASE_URL not set. App will likely fail if DB access is needed.")
else:
    # Print masked DB host for debugging (safe to log)
    try:
        print("DB HOST IN USO:", DATABASE_URL.split("@")[1])
    except:
        print("DB HOST IN USO: (Cannot parse host)")

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def init_db_schema():
    """Ensure database tables exist with correct schema."""
    if not DATABASE_URL:
        return
        
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Admin table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admin (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                senha_hash TEXT NOT NULL
            );
        """)
        
        # Categories table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS categorias (
                id SERIAL PRIMARY KEY,
                nome TEXT NOT NULL,
                descricao TEXT,
                foto_url TEXT
            );
        """)
        
        # Products table - Explicitly using BOOLEAN for ativo
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS produtos (
                id SERIAL PRIMARY KEY,
                nome TEXT NOT NULL,
                descricao TEXT,
                preco_inteiro FLOAT NOT NULL,
                preco_meia FLOAT,
                foto_url TEXT,
                ativo BOOLEAN DEFAULT TRUE,
                categoria_id INTEGER,
                quantidade_estoque INTEGER,
                unidade TEXT
            );
        """)
        
        # Orders table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pedidos (
                id SERIAL PRIMARY KEY,
                data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total FLOAT NOT NULL,
                status TEXT DEFAULT 'Recebido',
                whatsapp_cliente TEXT,
                mensagem_whatsapp TEXT
            );
        """)
        
        # Order items table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS itens_pedido (
                id SERIAL PRIMARY KEY,
                pedido_id INTEGER REFERENCES pedidos(id),
                produto_id INTEGER,
                tipo TEXT,
                quantidade INTEGER,
                preco_unitario FLOAT
            );
        """)
        
        # Half pizzas table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS meias_pizzas (
                id SERIAL PRIMARY KEY,
                item_pedido_id INTEGER REFERENCES itens_pedido(id),
                sabor_meia TEXT
            );
        """)
        
        # Configs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS configuracoes (
                chave TEXT PRIMARY KEY,
                valor TEXT
            );
        """)
        
        db.commit()
        print("Database schema initialized successfully.")
    except Exception as e:
        print(f"Schema initialization error: {e}")
        if 'db' in locals():
            db.rollback()

# Run schema init on startup
with app.app_context():
    init_db_schema()

# Fix CORS: Allow specific Netlify domain and localhost for dev
# supports_credentials=True is crucial if we send cookies/auth headers
# Allow headers Content-Type and Authorization explicitly
CORS(app, resources={r"/api/*": {
    "origins": [
        "https://mediterranea-frontend.onrender.com",
        "https://pizzeriamediterranea.netlify.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True
}})

DATABASE_FILE = 'database.db' # Local SQLite fallback logic removed from get_db for clarity below

def get_db():
    if DATABASE_URL:
        # PostgreSQL Connection - DIRECT PASS-THROUGH
        if 'db' not in g:
            # DEBUG: Print RAW connection string to check for hidden chars/spaces
            try:
                print("DATABASE_URL RAW:", repr(DATABASE_URL))
            except:
                pass
            
            # Use strip() to ensure no trailing newlines break the connection
            g.db = psycopg2.connect(DATABASE_URL.strip(), cursor_factory=RealDictCursor)
        return g.db
    else:
        # SQLite Connection
        db = getattr(g, '_database', None)
        if db is None:
            db = g._database = sqlite3.connect(DATABASE_FILE)
            db.row_factory = sqlite3.Row
        return db

@app.teardown_appcontext
def close_connection(exception):
    if DATABASE_URL:
        db = g.pop('db', None)
        if db is not None:
            db.close()
    else:
        db = getattr(g, '_database', None)
        if db is not None:
            db.close()

def query_db(query, args=(), one=False):
    db = get_db()
    
    if DATABASE_URL:
        # PostgreSQL Adapter
        # Replace ? with %s for Postgres compatibility
        pg_query = query.replace('?', '%s')
        cursor = db.cursor()
        cursor.execute(pg_query, args)
        if query.strip().upper().startswith('SELECT'):
            rv = cursor.fetchall()
            cursor.close()
            return (rv[0] if rv else None) if one else rv
        else:
            db.commit()
            last_id = cursor.lastrowid if hasattr(cursor, 'lastrowid') else None
            cursor.close()
            return last_id
    else:
        # SQLite Adapter
        cur = db.execute(query, args)
        if query.strip().upper().startswith('SELECT'):
            rv = cur.fetchall()
            cur.close()
            return (rv[0] if rv else None) if one else rv
        else:
            db.commit()
            return cur.lastrowid

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Public API ---

@app.route('/')
def home():
    return jsonify({
        "status": "online",
        "message": "Backend Pizzeria Mediterranea is running!",
        "endpoints": {
            "products": "/api/produtos",
            "categories": "/api/categorias"
        }
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    db_status = "ok"
    try:
        query_db('SELECT 1')
    except Exception as e:
        db_status = f"error: {str(e)}"
        
    fs_status = "ok"
    try:
        test_file = os.path.join(app.config['UPLOAD_FOLDER'], 'test_write.txt')
        with open(test_file, 'w') as f:
            f.write('ok')
        os.remove(test_file)
    except Exception as e:
        fs_status = f"error: {str(e)}"
        
    return jsonify({
        "status": "online",
        "database": db_status,
        "filesystem": fs_status,
        "upload_folder": app.config['UPLOAD_FOLDER']
    })

# --- EMERGENCY RESET ROUTE ---
@app.route('/api/reset-admin-emergency', methods=['GET'])
def reset_admin_emergency():
    try:
        # Use get_db() to ensure we use the EXACT SAME connection logic as the rest of the app
        db = get_db()
        
        # Hash for 'admin123' using scrypt explicitly to match werkzeug defaults
        # N=32768, r=8, p=1 are standard defaults in werkzeug's generate_password_hash
        password_hash = generate_password_hash('admin123', method='scrypt')
        
        status_msg = []
        
        if DATABASE_URL:
            status_msg.append("Using PostgreSQL connection via get_db()")
            cursor = db.cursor()
            
            # 1. DELETE existing admin to ensure clean slate
            cursor.execute("DELETE FROM public.admin WHERE email = 'admin@mediterranea.com'")
            status_msg.append("Deleted old user.")
            
            # 2. INSERT new admin
            cursor.execute(
                "INSERT INTO public.admin (email, senha_hash) VALUES (%s, %s)",
                ('admin@mediterranea.com', password_hash)
            )
            status_msg.append("Inserted new user with password 'admin123'.")
            
            db.commit()
            cursor.close()
        else:
            # Fallback for SQLite (local dev)
            db.execute("DELETE FROM admin WHERE email = 'admin@mediterranea.com'")
            db.execute(
                "INSERT INTO admin (email, senha_hash) VALUES (?, ?)",
                ('admin@mediterranea.com', password_hash)
            )
            db.commit()
            status_msg.append("Using SQLite. Reset done.")
            
        return jsonify({
            "message": "Admin reset successful", 
            "details": status_msg,
            "login_info": "Email: admin@mediterranea.com | Pass: admin123"
        })
    except Exception as e:
        return jsonify({"error": str(e), "type": "Reset Failed"}), 500

@app.route('/api/categorias', methods=['GET'])
def get_categorias():
    cats = query_db('SELECT * FROM categorias ORDER BY id')
    return jsonify([dict(c) for c in cats])

@app.route('/api/admin/categorias/<int:id>', methods=['PUT'])
def update_categoria(id):
    data = request.form
    file = request.files.get('foto')
    
    foto_sql = ""
    params = [data.get('nome'), data.get('descricao')]
    
    if file and allowed_file(file.filename):
        # Base64 handling for categories
        file_bytes = file.read()
        b64_string = base64.b64encode(file_bytes).decode('utf-8')
        mime_type = file.content_type or 'image/jpeg'
        foto_url = f"data:{mime_type};base64,{b64_string}"
        
        foto_sql = ", foto_url = ?"
        params.append(foto_url)
        
    params.append(id)
    
    query = f"""
        UPDATE categorias SET 
        nome = ?, descricao = ?
        {foto_sql}
        WHERE id = ?
    """
    query_db(query, params)
    return jsonify({'message': 'Categoria atualizada'})

@app.route('/api/produtos', methods=['GET'])
def get_produtos():
    try:
        # Usa una query base senza WHERE per vedere se almeno legge la tabella
        produtos = query_db('SELECT * FROM produtos')
        
        result = []
        for p in produtos:
            try:
                p_dict = dict(p)
                
                # Check active status manually in python to be safer
                ativo = p_dict.get('ativo')
                # Accept: True, 1, '1', 'true', 't'
                is_active = str(ativo).lower() in ['true', '1', 't', 'on'] if ativo is not None else False
                
                if not is_active:
                    continue
                
                # Safe casting
                if 'preco_inteiro' in p_dict:
                    try: p_dict['preco_inteiro'] = float(p_dict['preco_inteiro'])
                    except: p_dict['preco_inteiro'] = 0.0
                    
                if 'preco_meia' in p_dict:
                    try: p_dict['preco_meia'] = float(p_dict['preco_meia']) if p_dict['preco_meia'] is not None else 0.0
                    except: p_dict['preco_meia'] = 0.0
                    
                result.append(p_dict)
            except Exception as row_err:
                print(f"Skipping corrupted row: {row_err}")
                continue
            
        return jsonify(result)
    except Exception as e:
        print("ERRORE GET /produtos:", repr(e))
        return jsonify([]), 200

@app.route('/api/pedidos', methods=['POST'])
def create_pedido():
    data = request.json
    db = get_db()
    cursor = db.cursor()
    
    try:
        # Create Order
        if DATABASE_URL:
            cursor.execute(
                "INSERT INTO pedidos (total, whatsapp_cliente, mensagem_whatsapp) VALUES (%s, %s, %s) RETURNING id",
                (data['total'], data['whatsapp'], data.get('mensagem_whatsapp', ''))
            )
            pedido_id = cursor.fetchone()['id']
        else:
            cursor.execute(
                "INSERT INTO pedidos (total, whatsapp_cliente, mensagem_whatsapp) VALUES (?, ?, ?)",
                (data['total'], data['whatsapp'], data.get('mensagem_whatsapp', ''))
            )
            pedido_id = cursor.lastrowid
        
        # Create Items
        for item in data['items']:
            if DATABASE_URL:
                cursor.execute(
                    "INSERT INTO itens_pedido (pedido_id, produto_id, tipo, quantidade, preco_unitario) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                    (pedido_id, item['produto_id'], item['tipo'], item['quantidade'], item.get('preco_unitario', 0))
                )
                item_id = cursor.fetchone()['id']
            else:
                cursor.execute(
                    "INSERT INTO itens_pedido (pedido_id, produto_id, tipo, quantidade, preco_unitario) VALUES (?, ?, ?, ?, ?)",
                    (pedido_id, item['produto_id'], item['tipo'], item['quantidade'], item.get('preco_unitario', 0))
                )
                item_id = cursor.lastrowid
            
            # Create Half Pizzas
            if item['tipo'] == 'meia' and 'meias' in item:
                for meia in item['meias']:
                    if DATABASE_URL:
                        cursor.execute(
                            "INSERT INTO meias_pizzas (item_pedido_id, sabor_meia) VALUES (%s, %s)",
                            (item_id, meia)
                        )
                    else:
                        cursor.execute(
                            "INSERT INTO meias_pizzas (item_pedido_id, sabor_meia) VALUES (?, ?)",
                            (item_id, meia)
                        )
            
            # Update Stock
            # (Logic simplified for mixed DB support: direct execute)
            if DATABASE_URL:
                 cursor.execute("SELECT categoria_id, quantidade_estoque FROM produtos WHERE id = %s", (item['produto_id'],))
                 prod = cursor.fetchone()
            else:
                 c2 = db.execute("SELECT categoria_id, quantidade_estoque FROM produtos WHERE id = ?", (item['produto_id'],))
                 prod = c2.fetchone()
            
            if prod and prod['categoria_id'] != 1 and prod['quantidade_estoque'] is not None:
                new_qty = max(0, prod['quantidade_estoque'] - item['quantidade'])
                if DATABASE_URL:
                    cursor.execute("UPDATE produtos SET quantidade_estoque = %s WHERE id = %s", (new_qty, item['produto_id']))
                else:
                    db.execute("UPDATE produtos SET quantidade_estoque = ? WHERE id = ?", (new_qty, item['produto_id']))

        db.commit()
        return jsonify({'message': 'Pedido criado com sucesso', 'id': pedido_id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

# --- Admin API ---

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    print("LOGIN PAYLOAD:", data) # Check what frontend sends
    email = data.get('email')
    # Frontend sends 'senha', not 'password' or 'senha' key might be mapped to password variable
    # Based on React code: adminLogin({ email, senha: password })
    # So the JSON key is 'senha'
    password = data.get('senha') 
    
    print(f"Login attempt for: {email}") # Log for Render
    
    try:
        # 1. Fetch user using explicit schema 'public.admin'
        user = query_db('SELECT * FROM public.admin WHERE email = ?', (email,), one=True)
        
        # 2. Log explicit result
        print("ADMIN ROW:", dict(user) if user else "None")
        
        if not user:
            print("User not found in DB")
            return jsonify({'error': 'User not found'}), 401
            
        print(f"User found. Hash in DB starts with: {user['senha_hash'][:10]}...")
        
        # Verify password using werkzeug's check_password_hash
        if check_password_hash(user['senha_hash'], password):
            print("Password match!")
            return jsonify({'message': 'Login successful', 'token': 'dummy-token-for-demo', 'user': {'email': user['email']}})
        else:
            print("Password mismatch")
            return jsonify({'error': 'Invalid password'}), 401
            
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/dashboard', methods=['GET'])
def admin_dashboard():
    # Basic stats
    if DATABASE_URL:
        total_orders = query_db('SELECT COUNT(*) as count FROM pedidos', one=True)['count']
        today_orders = query_db("SELECT COUNT(*) as count FROM pedidos WHERE data_hora::date = CURRENT_DATE", one=True)['count']
    else:
        total_orders = query_db('SELECT COUNT(*) as count FROM pedidos', one=True)['count']
        today_orders = query_db("SELECT COUNT(*) as count FROM pedidos WHERE date(data_hora) = date('now')", one=True)['count']
        
    return jsonify({
        'total_orders': total_orders,
        'today_orders': today_orders
    })

import base64

# ... existing code ...

@app.route('/api/admin/produtos', methods=['GET', 'POST'])
def admin_produtos():
    if request.method == 'GET':
        produtos = query_db('SELECT * FROM produtos')
        return jsonify([dict(p) for p in produtos])
    
    elif request.method == 'POST':
        try:
            # DEBUG LOGS
            print("FORM DATA:", dict(request.form))
            print("FILES:", request.files)

            data = request.form
            
            # Base64 file handling for persistence on Render Free
            file = request.files.get('imagem') or request.files.get('foto')
            imagem = None
            
            if file and allowed_file(file.filename):
                # Read file bytes
                file_bytes = file.read()
                # Encode to base64
                b64_string = base64.b64encode(file_bytes).decode('utf-8')
                # Create data URI
                # Determine mime type
                mime_type = file.content_type or 'image/jpeg'
                imagem = f"data:{mime_type};base64,{b64_string}"
            
            # Extract and CAST fields safely
            nome = data.get('nome')
            # ... rest of the code is same, but 'imagem' is now a base64 string
            # ... which fits into TEXT column nicely.
            descricao = data.get('descricao')
            
            try:
                preco_inteiro = float(data.get('preco_inteiro', 0))
            except:
                preco_inteiro = 0.0
                
            try:
                preco_meia = float(data.get('preco_meia', 0))
            except:
                preco_meia = 0.0
                
            try:
                categoria_id = int(data.get('categoria_id', 0))
            except:
                categoria_id = None
                
            unidade = data.get('unidade')
            
            # Debug log requested
            print("INSERT PRODUTO:", nome, preco_inteiro, preco_meia, categoria_id, imagem, unidade)

            # Direct execution to ensure types are preserved (especially boolean)
            db = get_db()
            cursor = db.cursor()
            
            # Using foto_url instead of imagem for DB column to match schema, 
            # but passing 'imagem' variable as requested.
            # Using True for ativo as requested.
            cursor.execute("""
                INSERT INTO produtos 
                (nome, descricao, preco_inteiro, preco_meia, foto_url, categoria_id, ativo, unidade) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                nome, 
                descricao, 
                preco_inteiro, 
                preco_meia, 
                imagem, 
                categoria_id, 
                True, 
                unidade
            ))
            
            db.commit()
            return jsonify({'message': 'Produto criado'}), 201
            
        except Exception as e:
            print("ERRORE /produtos:", repr(e))
            if 'db' in locals():
                db.rollback()
            return jsonify({'error': str(e)}), 500

@app.route('/api/admin/produtos/<int:id>', methods=['PUT', 'DELETE'])
def admin_produto_detail(id):
    if request.method == 'DELETE':
        query_db('DELETE FROM produtos WHERE id = ?', (id,))
        return jsonify({'message': 'Produto deletado'})
    
    elif request.method == 'PUT':
        data = request.form
        
        # Handle file upload if present
        file = request.files.get('foto') or request.files.get('imagem')
        foto_sql = ""
        
        # Casting
        nome = data.get('nome')
        descricao = data.get('descricao')
        try: preco_inteiro = float(data.get('preco_inteiro', 0))
        except: preco_inteiro = 0.0
        try: preco_meia = float(data.get('preco_meia', 0))
        except: preco_meia = 0.0
        
        ativo_val = data.get('ativo', '1')
        ativo = True if str(ativo_val).lower() in ['1', 'true', 'on'] else False
        
        try: categoria_id = int(data.get('categoria_id', 0))
        except: categoria_id = None
        
        quantidade_estoque = data.get('quantidade_estoque')
        unidade = data.get('unidade')

        params = [nome, descricao, preco_inteiro, 
                  preco_meia, ativo, 
                  categoria_id, quantidade_estoque, unidade]
        
        if file and allowed_file(file.filename):
            # Base64 handling
            file_bytes = file.read()
            b64_string = base64.b64encode(file_bytes).decode('utf-8')
            mime_type = file.content_type or 'image/jpeg'
            foto_url = f"data:{mime_type};base64,{b64_string}"
            
            foto_sql = ", foto_url = ?"
            params.append(foto_url)
            
        params.append(id)
        
        query = f"""
            UPDATE produtos SET 
            nome = ?, descricao = ?, preco_inteiro = ?, preco_meia = ?, 
            ativo = ?, categoria_id = ?, quantidade_estoque = ?, unidade = ?
            {foto_sql}
            WHERE id = ?
        """
        # Using query_db here as it handles UPDATEs reasonably well usually, 
        # but for consistency with POST we might want to be explicit if this fails too.
        # For now, keeping query_db but ensuring params are casted.
        # Wait, query_db uses %s for Postgres, so we must ensure params order matches query placeholders
        # Query: nome, desc, precoI, precoM, ativo, catId, qtd, unid, [foto], id
        # Params: same order. Correct.
        
        query_db(query, params)
        return jsonify({'message': 'Produto atualizado'})

@app.route('/api/admin/pedidos', methods=['GET'])
def admin_pedidos():
    pedidos = query_db('SELECT * FROM pedidos ORDER BY data_hora DESC')
    result = []
    for p in pedidos:
        ped_dict = dict(p)
        items = query_db('SELECT * FROM itens_pedido WHERE pedido_id = ?', (p['id'],))
        ped_dict['items'] = []
        for i in items:
            item_dict = dict(i)
            # Add product name
            prod = query_db('SELECT nome FROM produtos WHERE id = ?', (i['produto_id'],), one=True)
            item_dict['produto_nome'] = prod['nome'] if prod else 'Unknown'
            
            if i['tipo'] == 'meia':
                meias = query_db('SELECT sabor_meia FROM meias_pizzas WHERE item_pedido_id = ?', (i['id'],))
                item_dict['meias'] = [m['sabor_meia'] for m in meias]
            ped_dict['items'].append(item_dict)
        result.append(ped_dict)
    return jsonify(result)

@app.route('/api/admin/pedidos/<int:id>', methods=['PUT'])
def admin_update_pedido(id):
    data = request.json
    query_db('UPDATE pedidos SET status = ? WHERE id = ?', (data['status'], id))
    return jsonify({'message': 'Status atualizado'})

@app.route('/api/admin/configuracoes', methods=['GET', 'PUT'])
def admin_config():
    if request.method == 'GET':
        configs = query_db('SELECT * FROM configuracoes')
        return jsonify([dict(c) for c in configs])
    elif request.method == 'PUT':
        data = request.json
        for key, value in data.items():
            query_db('UPDATE configuracoes SET valor = ? WHERE chave = ?', (value, key))
        return jsonify({'message': 'Configurações atualizadas'})

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    response = send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
# Force Deploy Trigger Fri Feb  6 11:52:50 -03 2026
# Force Deploy Trigger Fri Feb  6 11:53:04 -03 2026
