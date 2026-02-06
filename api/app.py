import os
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, jsonify, request, g, send_from_directory
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
import datetime

app = Flask(__name__)
# Fix CORS: Allow specific Netlify domain and localhost for dev
# supports_credentials=True is crucial if we send cookies/auth headers
# Allow headers Content-Type and Authorization explicitly
CORS(app, resources={r"/api/*": {
    "origins": [
        "https://pizzeriamediterranea.netlify.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True
}})

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
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        foto_url = f'/uploads/{filename}'
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
    produtos = query_db('SELECT * FROM produtos WHERE ativo = TRUE OR ativo = 1')
    result = []
    for p in produtos:
        result.append(dict(p))
    return jsonify(result)

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

@app.route('/api/admin/produtos', methods=['GET', 'POST'])
def admin_produtos():
    if request.method == 'GET':
        produtos = query_db('SELECT * FROM produtos')
        return jsonify([dict(p) for p in produtos])
    
    elif request.method == 'POST':
        data = request.form
        file = request.files.get('foto')
        foto_url = ''
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            foto_url = f'/uploads/{filename}'
        
        query_db("""
            INSERT INTO produtos (nome, descricao, preco_inteiro, preco_meia, foto_url, ativo, categoria_id, quantidade_estoque, unidade)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['nome'], data['descricao'], data['preco_inteiro'], 
            data.get('preco_meia'), foto_url, data.get('ativo', 1), 
            data['categoria_id'], data.get('quantidade_estoque'), data.get('unidade')
        ))
        return jsonify({'message': 'Produto criado'}), 201

@app.route('/api/admin/produtos/<int:id>', methods=['PUT', 'DELETE'])
def admin_produto_detail(id):
    if request.method == 'DELETE':
        query_db('DELETE FROM produtos WHERE id = ?', (id,))
        return jsonify({'message': 'Produto deletado'})
    
    elif request.method == 'PUT':
        data = request.form
        
        # Handle file upload if present
        file = request.files.get('foto')
        foto_sql = ""
        params = [data['nome'], data['descricao'], data['preco_inteiro'], 
                  data.get('preco_meia'), data.get('ativo', 1), 
                  data['categoria_id'], data.get('quantidade_estoque'), data.get('unidade')]
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            foto_url = f'/uploads/{filename}'
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
