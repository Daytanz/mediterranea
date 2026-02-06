import React, { useEffect, useState } from 'react';
import { getAdminConfigs, updateAdminConfigs } from '../../lib/api';
import { Link } from 'react-router-dom';
import { Clock, MessageSquare, Save, Power } from 'lucide-react';

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    whatsapp_numero: '',
    preco_meia_regra: 'mais_cara',
    shop_status: 'auto', // auto, open, closed
    opening_msg: 'Os pedidos abrem na quinta-feira de manhã.',
    closing_msg: 'Pedidos encerrados para esta semana.',
    
    // Default Schedule (Thursday 07:00 - Thursday 16:00)
    schedule_open_day: '4', // 0=Sun, 4=Thu
    schedule_open_hour: '7',
    schedule_close_day: '4',
    schedule_close_hour: '16'
  });

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const data = await getAdminConfigs();
        const newFormData: any = { ...formData };
        
        data.forEach((c: any) => {
          if (c.chave in newFormData || Object.keys(formData).includes(c.chave)) {
            newFormData[c.chave] = c.valor;
          }
        });
        
        setFormData(newFormData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAdminConfigs(formData);
    alert('Configurações salvas com sucesso!');
  };

  const days = [
    { value: '0', label: 'Domingo' },
    { value: '1', label: 'Segunda' },
    { value: '2', label: 'Terça' },
    { value: '3', label: 'Quarta' },
    { value: '4', label: 'Quinta' },
    { value: '5', label: 'Sexta' },
    { value: '6', label: 'Sábado' },
  ];

  return (
    <div className="min-h-screen bg-zinc-100 font-sans pb-12">
      <div className="bg-white shadow-sm p-4 flex items-center gap-4 sticky top-0 z-10">
        <Link to="/admin/dashboard" className="text-zinc-500 hover:text-red-600 transition-colors">&larr;</Link>
        <h1 className="font-bold text-xl text-zinc-800">Configurações do Sistema</h1>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-6 mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* General Settings */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-100">
            <h2 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-600" />
              Geral
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-600">Número WhatsApp (com DDI e DDD)</label>
                <input
                  type="text"
                  className="w-full border border-zinc-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Ex: 5511999999999"
                  value={formData.whatsapp_numero}
                  onChange={(e) => setFormData({...formData, whatsapp_numero: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-600">Regra de Preço (Meia Pizza)</label>
                <select
                  className="w-full border border-zinc-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.preco_meia_regra}
                  onChange={(e) => setFormData({...formData, preco_meia_regra: e.target.value})}
                >
                  <option value="mais_cara">Cobrar pela metade mais cara (Padrão)</option>
                  <option value="media">Cobrar pela média dos preços</option>
                </select>
              </div>
            </div>
          </div>

          {/* Opening Hours & Status */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-100">
            <h2 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
              <Power size={20} className="text-green-600" />
              Status da Loja
            </h2>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setFormData({...formData, shop_status: 'auto'})}
                className={`p-3 rounded-lg border text-sm font-bold transition-all ${
                  formData.shop_status === 'auto' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                Automático
                <span className="block text-xs font-normal mt-1 opacity-75">Segue horários</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, shop_status: 'open'})}
                className={`p-3 rounded-lg border text-sm font-bold transition-all ${
                  formData.shop_status === 'open' 
                    ? 'bg-green-50 border-green-500 text-green-700' 
                    : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                Sempre Aberto
                <span className="block text-xs font-normal mt-1 opacity-75">Forçar abertura</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, shop_status: 'closed'})}
                className={`p-3 rounded-lg border text-sm font-bold transition-all ${
                  formData.shop_status === 'closed' 
                    ? 'bg-red-50 border-red-500 text-red-700' 
                    : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                Sempre Fechado
                <span className="block text-xs font-normal mt-1 opacity-75">Forçar fechamento</span>
              </button>
            </div>

            {formData.shop_status === 'auto' && (
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 mb-4 animate-fade-in">
                <h3 className="font-bold text-sm text-zinc-700 mb-3 flex items-center gap-2">
                  <Clock size={16} />
                  Horário de Funcionamento Automático
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-green-700 uppercase tracking-wide">Abertura</label>
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 border rounded p-2 text-sm"
                        value={formData.schedule_open_day}
                        onChange={(e) => setFormData({...formData, schedule_open_day: e.target.value})}
                      >
                        {days.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                      <input 
                        type="number" min="0" max="23" 
                        className="w-20 border rounded p-2 text-sm" 
                        placeholder="Hora"
                        value={formData.schedule_open_hour}
                        onChange={(e) => setFormData({...formData, schedule_open_hour: e.target.value})}
                      />
                      <span className="self-center text-zinc-500">:00</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-red-700 uppercase tracking-wide">Fechamento</label>
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 border rounded p-2 text-sm"
                        value={formData.schedule_close_day}
                        onChange={(e) => setFormData({...formData, schedule_close_day: e.target.value})}
                      >
                        {days.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                      <input 
                        type="number" min="0" max="23" 
                        className="w-20 border rounded p-2 text-sm" 
                        placeholder="Hora"
                        value={formData.schedule_close_hour}
                        onChange={(e) => setFormData({...formData, schedule_close_hour: e.target.value})}
                      />
                      <span className="self-center text-zinc-500">:00</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-3 italic">
                  * O sistema abrirá automaticamente no dia/hora de abertura e fechará no dia/hora de fechamento.
                </p>
              </div>
            )}
            
            <div className="space-y-4 pt-4 border-t border-zinc-100">
               <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-600">Mensagem quando fechado (Antes de abrir)</label>
                  <input
                    type="text"
                    className="w-full border border-zinc-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.opening_msg}
                    onChange={(e) => setFormData({...formData, opening_msg: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-600">Mensagem quando fechado (Após fechar)</label>
                  <input
                    type="text"
                    className="w-full border border-zinc-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.closing_msg}
                    onChange={(e) => setFormData({...formData, closing_msg: e.target.value})}
                  />
                </div>
            </div>

          </div>
          
          <div className="sticky bottom-4">
            <button type="submit" className="w-full bg-zinc-800 text-white font-bold py-4 rounded-xl hover:bg-black shadow-lg transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              <Save size={20} />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
