import axios from 'axios';

export const api = axios.create({
  // Tenta usar a URL da nuvem. Se não existir, usa o localhost.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
});

// Adiciona o Token JWT automaticamente nas requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepta respostas para lidar com tokens expirados ou inválidos
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuarioId');
      localStorage.removeItem('usuarioNome');
      
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);