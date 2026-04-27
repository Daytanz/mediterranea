import React, { useEffect, useState } from 'react';
import { getCategories, updateCategory, createCategory, deleteCategory } from '../../lib/api';
import { Link } from 'react-router-dom';
import { Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import ImageWithFallback from '../../components/ImageWithFallback';

interface Category {
  id: number;
  nome: string;
  descricao: string;
  foto_url: string;
  icone: string;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    foto: null as File | null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);

  const fetchCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormData({
      nome: cat.nome,
      descricao: cat.descricao || '',
      foto: null
    });
    setPreviewUrl(cat.foto_url);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ nome: '', descricao: '', foto: null });
    setPreviewUrl(null);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({ nome: '', descricao: '', foto: null });
    setPreviewUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, foto: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria? Produtos associados ficarão sem categoria.')) {
      try {
        await deleteCategory(id);
        fetchCategories();
        alert('Categoria excluída!');
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir.');
      }
    }
  };

  const handleSave = async (id: number | null) => {
    try {
      const data = new FormData();
      data.append('nome', formData.nome);
      data.append('descricao', formData.descricao);
      if (formData.foto) {
        data.append('foto', formData.foto);
      }

      if (isCreating) {
        await createCategory(data);
        setIsCreating(false);
        alert('Categoria criada com sucesso!');
      } else if (id !== null) {
        await updateCategory(id, data);
        setEditingId(null);
        alert('Categoria atualizada com sucesso!');
      }
      
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Erro ao salvar categoria. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 font-sans">
      <div className="bg-white shadow-sm p-4 flex items-center gap-4">
        <Link to="/admin/dashboard" className="text-zinc-500 hover:text-red-600 transition-colors">&larr;</Link>
        <h1 className="font-bold text-xl text-zinc-800">Gerenciar Categorias</h1>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-serif font-bold text-zinc-800">Categorias</h2>
          {!isCreating && (
            <button 
              onClick={handleCreateNew}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} /> Nova Categoria
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b">
              <tr>
                <th className="p-4 font-medium text-sm text-zinc-500">Imagem</th>
                <th className="p-4 font-medium text-sm text-zinc-500">Nome / Descrição</th>
                <th className="p-4 font-medium text-sm text-zinc-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isCreating && (
                <tr className="bg-blue-50/50">
                  <td className="p-4 w-32 align-top">
                    <div className="space-y-2">
                      <div className="w-24 h-16 rounded-lg bg-zinc-100 overflow-hidden relative border border-zinc-200">
                         <ImageWithFallback 
                           src={previewUrl} 
                           alt="Preview" 
                           className="w-full h-full object-cover" 
                         />
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="text-xs w-full text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        className="w-full border rounded p-2 font-bold text-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Nome da Categoria"
                      />
                      <textarea
                        value={formData.descricao}
                        onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                        className="w-full border rounded p-2 text-sm text-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Descrição..."
                        rows={2}
                      />
                    </div>
                  </td>
                  <td className="p-4 text-right align-top">
                    <div className="flex flex-col gap-2 items-end">
                      <button 
                        onClick={() => handleSave(null)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-green-700 transition-colors"
                      >
                        <Save size={16} /> Salvar
                      </button>
                      <button 
                        onClick={handleCancel}
                        className="text-zinc-400 hover:text-zinc-600 px-3 py-1 text-sm flex items-center gap-1"
                      >
                        <X size={16} /> Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="p-4 w-32 align-top">
                    {editingId === cat.id ? (
                      <div className="space-y-2">
                        <div className="w-24 h-16 rounded-lg bg-zinc-100 overflow-hidden relative border border-zinc-200">
                           <ImageWithFallback 
                             src={previewUrl} 
                             alt="Preview" 
                             className="w-full h-full object-cover" 
                           />
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleFileChange}
                          className="text-xs w-full text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-16 rounded-lg bg-zinc-100 overflow-hidden relative border border-zinc-200">
                        <ImageWithFallback 
                          src={cat.foto_url} 
                          alt={cat.nome} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                  </td>
                  
                  <td className="p-4 align-top">
                    {editingId === cat.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={formData.nome}
                          onChange={(e) => setFormData({...formData, nome: e.target.value})}
                          className="w-full border rounded p-2 font-bold text-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Nome da Categoria"
                        />
                        <textarea
                          value={formData.descricao}
                          onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                          className="w-full border rounded p-2 text-sm text-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Descrição..."
                          rows={2}
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-lg text-zinc-800 flex items-center gap-2">
                          <span>{cat.icone}</span>
                          {cat.nome}
                        </div>
                        <div className="text-zinc-500 text-sm mt-1">{cat.descricao}</div>
                      </div>
                    )}
                  </td>
                  
                  <td className="p-4 text-right align-top">
                    {editingId === cat.id ? (
                      <div className="flex flex-col gap-2 items-end">
                        <button 
                          onClick={() => handleSave(cat.id)}
                          className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-green-700 transition-colors"
                        >
                          <Save size={16} /> Salvar
                        </button>
                        <button 
                          onClick={handleCancel}
                          className="text-zinc-400 hover:text-zinc-600 px-3 py-1 text-sm flex items-center gap-1"
                        >
                          <X size={16} /> Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(cat)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Categories;