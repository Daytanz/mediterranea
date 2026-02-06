import React, { useEffect, useState } from 'react';
import { getAdminProducts, createAdminProduct, updateAdminProduct, deleteAdminProduct } from '../../lib/api';
import { Product } from '../../store/useStore';
import { Plus, Trash2, X, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('1'); // Default to Pizzas
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco_inteiro: '',
    preco_meia: '',
    categoria_id: '1',
    foto: null as File | null,
    unidade: 'unid',
    quantidade_estoque: ''
  });

  const fetchProducts = async () => {
    const data = await getAdminProducts();
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      await deleteAdminProduct(id);
      fetchProducts();
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nome: product.nome,
        descricao: product.descricao,
        preco_inteiro: product.preco_inteiro.toString(),
        preco_meia: product.preco_meia ? product.preco_meia.toString() : '',
        categoria_id: product.categoria_id.toString(),
        foto: null,
        unidade: product.unidade || 'unid',
        quantidade_estoque: product.quantidade_estoque !== null && product.quantidade_estoque !== undefined ? product.quantidade_estoque.toString() : ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nome: '',
        descricao: '',
        preco_inteiro: '',
        preco_meia: '',
        categoria_id: activeTab,
        foto: null,
        unidade: 'unid',
        quantidade_estoque: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append('nome', formData.nome);
    data.append('descricao', formData.descricao);
    data.append('preco_inteiro', formData.preco_inteiro);
    if (formData.preco_meia) data.append('preco_meia', formData.preco_meia);
    data.append('categoria_id', formData.categoria_id);
    if (formData.foto) data.append('foto', formData.foto);
    if (formData.quantidade_estoque) data.append('quantidade_estoque', formData.quantidade_estoque);
    data.append('unidade', formData.unidade);

    if (editingProduct) {
      await updateAdminProduct(editingProduct.id, data);
    } else {
      await createAdminProduct(data);
    }
    
    setIsModalOpen(false);
    fetchProducts();
  };

  const filteredProducts = products.filter(p => p.categoria_id === parseInt(activeTab));

  const categories = [
    { id: '1', name: 'Pizzas', icon: '🍕' },
    { id: '2', name: 'Salames', icon: '🧀' },
    { id: '3', name: 'Conservas', icon: '🍯' },
    { id: '4', name: 'Sobremesas', icon: '🍰' },
  ];

  return (
    <div className="min-h-screen bg-zinc-100 font-sans">
      <div className="bg-white shadow-sm p-4 flex items-center gap-4">
        <Link to="/admin/dashboard" className="text-zinc-500 hover:text-red-600 transition-colors">&larr;</Link>
        <h1 className="font-bold text-xl text-zinc-800">Gerenciar Produtos</h1>
      </div>

      <div className="p-4 max-w-5xl mx-auto">
        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`
                px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap
                ${activeTab === cat.id 
                  ? 'bg-red-600 text-white shadow-md transform scale-105' 
                  : 'bg-white text-zinc-500 hover:bg-zinc-50'}
              `}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-zinc-700">
            {categories.find(c => c.id === activeTab)?.name}
            <span className="text-sm font-normal text-zinc-400 ml-2">({filteredProducts.length} itens)</span>
          </h2>
          <button 
            onClick={() => openModal()}
            className="bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-black transition-colors"
          >
            <Plus size={20} /> Novo Item
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-zinc-100">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-zinc-400">
              Nenhum produto nesta categoria.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b">
                <tr>
                  <th className="p-4 font-medium text-sm text-zinc-500">Imagem</th>
                  <th className="p-4 font-medium text-sm text-zinc-500">Produto</th>
                  <th className="p-4 font-medium text-sm text-zinc-500">Preço</th>
                  {activeTab !== '1' && <th className="p-4 font-medium text-sm text-zinc-500">Estoque</th>}
                  <th className="p-4 font-medium text-sm text-zinc-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="p-4 w-20">
                      <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden relative">
                         {p.foto_url ? (
                           <img 
                             src={p.foto_url.startsWith('http') ? p.foto_url : `http://localhost:5001${p.foto_url}`} 
                             alt={p.nome}
                             className="w-full h-full object-cover"
                           />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-zinc-300">Img</div>
                         )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-zinc-800">{p.nome}</div>
                      <div className="text-xs text-zinc-400 max-w-[200px] truncate">{p.descricao}</div>
                    </td>
                    <td className="p-4 font-medium text-zinc-600">R$ {p.preco_inteiro.toFixed(2)}</td>
                    {activeTab !== '1' && (
                      <td className="p-4">
                        {p.quantidade_estoque !== null && p.quantidade_estoque !== undefined ? (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.quantidade_estoque > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {p.quantidade_estoque} {p.unidade}
                          </span>
                        ) : '-'}
                      </td>
                    )}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openModal(p)}
                          className="text-zinc-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)} 
                          className="text-zinc-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input required className="w-full border rounded p-2" 
                  value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <select className="w-full border rounded p-2"
                    value={formData.categoria_id} onChange={e => setFormData({...formData, categoria_id: e.target.value})}>
                    <option value="1">Pizzas</option>
                    <option value="2">Salames</option>
                    <option value="3">Conservas</option>
                    <option value="4">Sobremesas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Foto</label>
                  <input type="file" className="w-full text-sm" 
                    onChange={e => setFormData({...formData, foto: e.target.files?.[0] || null})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea className="w-full border rounded p-2" rows={2}
                  value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Preço Inteiro</label>
                  <input type="number" step="0.01" required className="w-full border rounded p-2"
                    value={formData.preco_inteiro} onChange={e => setFormData({...formData, preco_inteiro: e.target.value})} />
                </div>
                {formData.categoria_id === '1' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Preço Meia</label>
                    <input type="number" step="0.01" className="w-full border rounded p-2"
                      value={formData.preco_meia} onChange={e => setFormData({...formData, preco_meia: e.target.value})} />
                  </div>
                )}
                {formData.categoria_id !== '1' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Estoque</label>
                    <input type="number" className="w-full border rounded p-2"
                      value={formData.quantidade_estoque} onChange={e => setFormData({...formData, quantidade_estoque: e.target.value})} />
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors">
                {editingProduct ? 'Atualizar Produto' : 'Salvar Produto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
