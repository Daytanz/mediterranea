import React, { useEffect, useState } from 'react';
import { getCategories, updateCategory } from '../../lib/api';
import { Link } from 'react-router-dom';
import { Edit2, Save, X, Image as ImageIcon } from 'lucide-react';

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

  const handleSave = async (id: number) => {
    const data = new FormData();
    data.append('nome', formData.nome);
    data.append('descricao', formData.descricao);
    if (formData.foto) {
      data.append('foto', formData.foto);
    }

    await updateCategory(id, data);
    setEditingId(null);
    fetchCategories();
  };

  return (
    <div className="min-h-screen bg-zinc-100 font-sans">
      <div className="bg-white shadow-sm p-4 flex items-center gap-4">
        <Link to="/admin/dashboard" className="text-zinc-500 hover:text-red-600 transition-colors">&larr;</Link>
        <h1 className="font-bold text-xl text-zinc-800">Gerenciar Categorias</h1>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-6">
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
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="p-4 w-32 align-top">
                    {editingId === cat.id ? (
                      <div className="space-y-2">
                        <div className="w-24 h-16 rounded-lg bg-zinc-100 overflow-hidden relative border border-zinc-200">
                          {previewUrl ? (
                            <img 
                              src={previewUrl && (previewUrl.startsWith('http') || previewUrl.startsWith('data:')) ? previewUrl : (previewUrl ? `https://mediterranea.onrender.com${previewUrl}` : '')} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-zinc-300">
                              <ImageIcon size={20} />
                            </div>
                          )}
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
                        {cat.foto_url ? (
                          <img 
                            src={cat.foto_url && (cat.foto_url.startsWith('http') || cat.foto_url.startsWith('data:')) ? cat.foto_url : (cat.foto_url ? `https://mediterranea.onrender.com${cat.foto_url}` : '')} 
                            alt={cat.nome}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full text-zinc-300"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-zinc-300">
                            <ImageIcon size={20} />
                          </div>
                        )}
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
                      <button 
                        onClick={() => handleEdit(cat)}
                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={20} />
                      </button>
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