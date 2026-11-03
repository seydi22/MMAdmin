import axios from 'axios';
import API_BASE_URL from '../config/apiConfig';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Intercepteur pour ajouter le token a chaque requete
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gerer les erreurs 401 globalement
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('habilitations');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
