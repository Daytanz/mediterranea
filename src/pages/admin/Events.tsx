import React, { useEffect, useState } from 'react';
import { getAdminEventos, createAdminEvento, updateAdminEvento, deleteAdminEvento, getAdminEventoReservas } from '../../lib/api';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Save, X, Calendar, Users, Eye } from 'lucide-react';
import ImageWithFallback from '../../components/ImageWithFallback';

interface Evento {
  id: number;
  titulo: string;
  descricao: string;
  data_hora: string;
  foto_url: string;
  ativo: boolean;
}

interface Reserva {
  id: number;
  nome_cliente: string;
  telefone_cliente: string;
  qtd_adultos: number;
  qtd_criancas: number;
  data_reserva: string;
}

const Events: React.FC = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data_hora: '',
    ativo: true,
    foto: null as File | null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Reservas Modal
  const [viewingReservas, setViewingReservas] = useState<number | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [reservasLoading, setReservasLoading] = useState(false);

  const fetchEventos = async () => {
    try {
      const data = await getAdminEventos();
      setEventos(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  const openNewModal = () => {
    setEditingEvent(null);
    setFormData({
      titulo: '',
      descricao: '',
      data_hora: '',
      ativo: true,
      foto: null
    });
    setPreviewUrl(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ev: Evento) => {
    setEditingEvent(ev);
    setFormData({
      titulo: ev.titulo,
      descricao: ev.descricao || '',
      data_hora: ev.data_hora,
      ativo: ev.ativo,
      foto: null
    });
    setPreviewUrl(ev.foto_url);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, foto: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append('titulo', formData.titulo);
    data.append('descricao', formData.descricao);
    data.append('data_hora', formData.data_hora);
    data.append('ativo', formData.ativo.toString());
    if (formData.foto) data.append('foto', formData.foto);

    try {
      if (editingEvent) {
        await updateAdminEvento(editingEvent.id, data);
        alert('Evento atualizado!');
      } else {
        await createAdminEvento(data);
        alert('Evento criado!');
      }
      setIsModalOpen(false);
      fetchEventos();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar evento.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Excluir evento e todas as reservas?')) {
      try {
        await deleteAdminEvento(id);
        fetchEventos();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openReservas = async (id: number) => {
    setViewingReservas(id);
    setReservasLoading(true);
    try {
      const res = await getAdminEventoReservas(id);
      setReservas(res);
    } catch (err) {
      console.error(err);
    } finally {
      setReservasLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 font-sans pb-12">
      <div className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard" className="text-zinc-500 hover:text-red-600 transition-colors">&larr;</Link>
          <h1 className="font-bold text-xl text-zinc-800">Gerenciar Eventos</h1>
        </div>
        <button 
          onClick={openNewModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Novo Evento
        </button>
      </div>

      <div className="p-4 max-w-5xl mx-auto mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventos.map(ev => (
            <div key={ev.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col ${!ev.ativo ? 'opacity-75' : 'border-zinc-200'}`}>
              <div className="h-40 bg-zinc-200 relative">
                 <ImageWithFallback 
                   src={ev.foto_url} 
                   alt={ev.titulo} 
                   className="w-full h-full object-cover" 
                 />
                 {!ev.ativo && (
                   <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                     Inativo
                   </div>
                 )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-zinc-800 mb-1">{ev.titulo}</h3>
                <div className="flex items-center gap-2 text-zinc-500 text-sm mb-3">
                  <Calendar size={14} />
                  {ev.data_hora}
                </div>
                <p className="text-zinc-600 text-sm line-clamp-2 mb-4 flex-1">{ev.descricao}</p>
                
                <div className="flex gap-2 mt-auto pt-4 border-t border-zinc-100">
                  <button 
                    onClick={() => openReservas(ev.id)}
                    className="flex-1 bg-zinc-100 text-zinc-700 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 flex items-center justify-center gap-2"
                  >
                    <Users size={16} /> Reservas
                  </button>
                  <button 
                    onClick={() => openEditModal(ev)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(ev.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center">
              <h2 className="font-bold text-lg text-zinc-800">
                {editingEvent ? 'Editar Evento' : 'Novo Evento'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              <form id="event-form" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Título do Evento</label>
                  <input 
                    type="text" 
                    required
                    value={formData.titulo}
                    onChange={e => setFormData({...formData, titulo: e.target.value})}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Data e Hora (Texto livre ou formato DD/MM HH:MM)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Sexta, 20h00"
                    value={formData.data_hora}
                    onChange={e => setFormData({...formData, data_hora: e.target.value})}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Descrição</label>
                  <textarea 
                    rows={3}
                    value={formData.descricao}
                    onChange={e => setFormData({...formData, descricao: e.target.value})}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Imagem de Capa</label>
                  {previewUrl && (
                    <div className="w-full h-32 rounded-lg bg-zinc-100 overflow-hidden mb-2">
                      <ImageWithFallback src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full border rounded-lg p-2 text-sm"
                  />
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input 
                    type="checkbox" 
                    id="ativo"
                    checked={formData.ativo}
                    onChange={e => setFormData({...formData, ativo: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="ativo" className="text-sm font-medium text-zinc-700">Evento Ativo (Visível para o público)</label>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-zinc-600 font-medium hover:bg-zinc-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                form="event-form"
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save size={18} /> Salvar Evento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservas Modal */}
      {viewingReservas !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h2 className="font-bold text-lg text-zinc-800 flex items-center gap-2">
                <Users size={20} className="text-blue-600" /> 
                Lista de Presença
              </h2>
              <button onClick={() => setViewingReservas(null)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto">
              {reservasLoading ? (
                <div className="p-8 text-center text-zinc-500">Carregando...</div>
              ) : reservas.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">Nenhuma reserva encontrada para este evento.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-100 border-b text-zinc-600">
                    <tr>
                      <th className="p-3">Nome</th>
                      <th className="p-3">Telefone</th>
                      <th className="p-3 text-center">Adultos</th>
                      <th className="p-3 text-center">Crianças (&lt;12)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {reservas.map(r => (
                      <tr key={r.id} className="hover:bg-zinc-50">
                        <td className="p-3 font-medium text-zinc-800">{r.nome_cliente}</td>
                        <td className="p-3 text-blue-600">
                          <a href={`https://wa.me/${r.telefone_cliente.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                            {r.telefone_cliente}
                          </a>
                        </td>
                        <td className="p-3 text-center font-bold">{r.qtd_adultos}</td>
                        <td className="p-3 text-center text-zinc-500">{r.qtd_criancas}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-50 border-t font-bold">
                    <tr>
                      <td colSpan={2} className="p-3 text-right text-blue-800">Total:</td>
                      <td className="p-3 text-center text-blue-800">{reservas.reduce((a, b) => a + b.qtd_adultos, 0)}</td>
                      <td className="p-3 text-center text-blue-800">{reservas.reduce((a, b) => a + b.qtd_criancas, 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;