import axios from 'axios';
import API_BASE_URL from '../config/apiConfig';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs 401 globalement
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token invalide ou expiré
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      // Rediriger vers la page de connexion
      // Utilise window.location pour la redirection en dehors d'un composant React
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
