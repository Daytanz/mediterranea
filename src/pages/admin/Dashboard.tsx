import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminDashboard } from '../../lib/api';
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Grid } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ total_orders: 0, today_orders: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminDashboard();
        setStats(data);
      } catch (err) {
        // If 401, redirect to login
        navigate('/admin');
      }
    };
    fetchStats();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-zinc-100 font-sans">
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="font-bold text-xl">Painel Admin</h1>
        <button onClick={handleLogout} className="text-zinc-500 hover:text-red-600">
          <LogOut size={20} />
        </button>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <span className="text-zinc-500 text-sm">Pedidos Hoje</span>
            <div className="text-3xl font-bold text-red-600">{stats.today_orders}</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <span className="text-zinc-500 text-sm">Total Pedidos</span>
            <div className="text-3xl font-bold text-zinc-800">{stats.total_orders}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link to="/admin/produtos" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2">
            <Package size={32} className="text-red-600" />
            <span className="font-medium">Produtos</span>
          </Link>
          <Link to="/admin/pedidos" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2">
            <ShoppingBag size={32} className="text-red-600" />
            <span className="font-medium">Pedidos</span>
          </Link>
          <Link to="/admin/categorias" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2">
            <Grid size={32} className="text-blue-600" />
            <span className="font-medium">Categorias</span>
          </Link>
          <Link to="/admin/configuracoes" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2">
            <Settings size={32} className="text-zinc-600" />
            <span className="font-medium">Configurações</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
