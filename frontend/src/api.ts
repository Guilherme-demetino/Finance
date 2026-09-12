import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3333/api',
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
      
      // Altere para a rota correta do seu login (ex: '/login' se '/' for outra página)
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);