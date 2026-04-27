import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import Cart from './pages/Cart';
import EventsPublic from './pages/EventsPublic';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Orders from './pages/admin/Orders';
import Settings from './pages/admin/Settings';
import Categories from './pages/admin/Categories';
import Events from './pages/admin/Events';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Client Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/categoria/:nome" element={<ProductList />} />
      <Route path="/carrinho" element={<Cart />} />
      <Route path="/eventos" element={<EventsPublic />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<Login />} />
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/produtos" element={<Products />} />
      <Route path="/admin/pedidos" element={<Orders />} />
      <Route path="/admin/categorias" element={<Categories />} />
      <Route path="/admin/eventos" element={<Events />} />
      <Route path="/admin/configuracoes" element={<Settings />} />
    </Routes>
  );
};

export default App;
