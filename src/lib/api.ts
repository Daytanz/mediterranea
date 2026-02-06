import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: API_URL,
});

export const getProducts = async () => {
  const response = await api.get('/produtos');
  return response.data;
};

export const createOrder = async (orderData: any) => {
  const response = await api.post('/pedidos', orderData);
  return response.data;
};

export const adminLogin = async (credentials: any) => {
  const response = await api.post('/admin/login', credentials);
  return response.data;
};

export const getAdminDashboard = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const getAdminProducts = async () => {
  const response = await api.get('/admin/produtos');
  return response.data;
};

export const createAdminProduct = async (productData: FormData) => {
  const response = await api.post('/admin/produtos', productData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateAdminProduct = async (id: number, productData: FormData) => {
  const response = await api.put(`/admin/produtos/${id}`, productData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteAdminProduct = async (id: number) => {
  const response = await api.delete(`/admin/produtos/${id}`);
  return response.data;
};

export const getAdminOrders = async () => {
  const response = await api.get('/admin/pedidos');
  return response.data;
};

export const updateOrderStatus = async (id: number, status: string) => {
  const response = await api.put(`/admin/pedidos/${id}`, { status });
  return response.data;
};

export const getAdminConfigs = async () => {
  const response = await api.get('/admin/configuracoes');
  return response.data;
};

export const updateAdminConfigs = async (configs: any) => {
  const response = await api.put('/admin/configuracoes', configs);
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/categorias');
  return response.data;
};

export const updateCategory = async (id: number, data: FormData) => {
  const response = await api.put(`/admin/categorias/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
