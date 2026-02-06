import React, { useEffect, useState } from 'react';
import { getAdminOrders, updateOrderStatus } from '../../lib/api';
import { Link } from 'react-router-dom';

interface OrderItem {
  id: number;
  produto_nome: string;
  tipo: string;
  quantidade: number;
  meias?: string[];
}

interface Order {
  id: number;
  data_hora: string;
  total: number;
  status: string;
  whatsapp_cliente: string;
  items: OrderItem[];
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    const data = await getAdminOrders();
    setOrders(data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    await updateOrderStatus(id, status);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Recebido': return 'bg-blue-100 text-blue-800';
      case 'Em preparo': return 'bg-yellow-100 text-yellow-800';
      case 'Finalizado': return 'bg-green-100 text-green-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 font-sans">
      <div className="bg-white shadow-sm p-4 flex items-center gap-4">
        <Link to="/admin/dashboard" className="text-zinc-500">&larr;</Link>
        <h1 className="font-bold text-xl">Gerenciar Pedidos</h1>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-4 border-b pb-4">
              <div>
                <span className="font-bold text-lg">Pedido #{order.id}</span>
                <div className="text-sm text-zinc-500">{new Date(order.data_hora).toLocaleString()}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <select 
                  className="text-sm border rounded p-1"
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                >
                  <option value="Recebido">Recebido</option>
                  <option value="Em preparo">Em preparo</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>
                    <span className="font-bold">{item.quantidade}x</span> {item.produto_nome}
                    {item.tipo === 'meia' && item.meias && (
                      <span className="text-zinc-500 block ml-6 text-xs">
                        + {item.meias.join(' + ')}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t mt-4">
              <div className="text-sm text-zinc-500">
                Cliente: {order.whatsapp_cliente}
              </div>
              <div className="font-bold text-xl text-red-600">
                R$ {(Number(order.total || 0)).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
