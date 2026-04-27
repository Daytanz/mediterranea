import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getEventos, reservarEvento } from '../lib/api';
import { Calendar, Users, X, CheckCircle2 } from 'lucide-react';
import ImageWithFallback from '../components/ImageWithFallback';

interface Evento {
  id: number;
  titulo: string;
  descricao: string;
  data_hora: string;
  foto_url: string;
}

const EventsPublic: React.FC = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Reservation Modal State
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [formData, setFormData] = useState({
    nome_cliente: '',
    telefone_cliente: '',
    qtd_adultos: 1,
    qtd_criancas: 0
  });

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const data = await getEventos();
        setEventos(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEventos();
  }, []);

  const handleOpenModal = (evento: Evento) => {
    setSelectedEvent(evento);
    setSuccessMsg('');
    setFormData({
      nome_cliente: '',
      telefone_cliente: '',
      qtd_adultos: 1,
      qtd_criancas: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    if (!formData.telefone_cliente.trim()) {
        alert("O telefone é obrigatório para confirmar a reserva.");
        return;
    }

    try {
      await reservarEvento(selectedEvent.id, formData);
      setSuccessMsg('Sua reserva foi confirmada com sucesso! Te esperamos lá.');
      setTimeout(() => {
        setSelectedEvent(null);
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao confirmar reserva. Tente novamente.');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-wine mb-4">Eventos Especiais</h1>
          <p className="text-zinc-600">Participe dos nossos eventos e viva momentos inesquecíveis.</p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-zinc-500">Carregando eventos...</div>
        ) : eventos.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl shadow-sm border border-zinc-100">
            <Calendar className="mx-auto text-zinc-300 mb-3" size={48} />
            <p className="text-zinc-500">Nenhum evento programado para os próximos dias.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {eventos.map(evento => (
              <div key={evento.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-100 flex flex-col md:flex-row transition-transform hover:shadow-md">
                <div className="h-48 md:h-auto md:w-1/3 bg-zinc-200 relative shrink-0">
                  <ImageWithFallback 
                    src={evento.foto_url} 
                    alt={evento.titulo}
                    className="w-full h-full object-cover"
                    fallbackSrc="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h2 className="text-2xl font-serif font-bold text-zinc-800 mb-2">{evento.titulo}</h2>
                  <div className="flex items-center gap-2 text-terracotta font-medium mb-4 bg-orange-50 w-fit px-3 py-1 rounded-full text-sm">
                    <Calendar size={16} />
                    {evento.data_hora}
                  </div>
                  <p className="text-zinc-600 mb-6 flex-1">{evento.descricao}</p>
                  
                  <button 
                    onClick={() => handleOpenModal(evento)}
                    className="w-full md:w-auto bg-olive text-white px-6 py-3 rounded-xl font-bold hover:bg-olive/90 transition-colors mt-auto text-center"
                  >
                    Quero Participar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Reserva */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-sand">
              <h3 className="font-serif font-bold text-lg text-zinc-800">Lista de Presença</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-zinc-500 hover:text-zinc-800 bg-white p-1 rounded-full shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {successMsg ? (
                <div className="text-center py-8">
                  <CheckCircle2 size={64} className="mx-auto text-green-500 mb-4" />
                  <h4 className="text-xl font-bold text-zinc-800 mb-2">Reserva Confirmada!</h4>
                  <p className="text-zinc-600">{successMsg}</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <h4 className="font-bold text-zinc-800">{selectedEvent.titulo}</h4>
                    <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1"><Calendar size={14}/> {selectedEvent.data_hora}</p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Seu Nome *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.nome_cliente}
                        onChange={e => setFormData({...formData, nome_cliente: e.target.value})}
                        className="w-full border-2 border-zinc-200 rounded-xl p-3 focus:border-olive focus:ring-0 outline-none transition-colors"
                        placeholder="Ex: João Silva"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Telefone (WhatsApp) *</label>
                      <input 
                        type="tel" 
                        required
                        value={formData.telefone_cliente}
                        onChange={e => setFormData({...formData, telefone_cliente: e.target.value})}
                        className="w-full border-2 border-zinc-200 rounded-xl p-3 focus:border-olive focus:ring-0 outline-none transition-colors"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Adultos</label>
                        <div className="relative">
                          <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input 
                            type="number" 
                            min="1"
                            required
                            value={formData.qtd_adultos}
                            onChange={e => setFormData({...formData, qtd_adultos: parseInt(e.target.value) || 0})}
                            className="w-full border-2 border-zinc-200 rounded-xl p-3 pl-9 focus:border-olive outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Crianças (&lt; 12 anos)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={formData.qtd_criancas}
                          onChange={e => setFormData({...formData, qtd_criancas: parseInt(e.target.value) || 0})}
                          className="w-full border-2 border-zinc-200 rounded-xl p-3 focus:border-olive outline-none"
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="submit"
                      className="w-full bg-olive text-white font-bold py-4 rounded-xl mt-4 hover:bg-olive/90 transition-colors shadow-sm"
                    >
                      Confirmar Reserva
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EventsPublic;