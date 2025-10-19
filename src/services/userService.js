import API_BASE_URL from '../config/apiConfig';

/**
 * Récupère la liste des utilisateurs depuis l'API.
 * @returns {Promise<Array>} Une promesse qui résout avec la liste des utilisateurs.
 */
export const fetchUsers = async () => {
  try {
    const token = localStorage.getItem('token'); // Récupérer le token
    if (!token) {
      throw new Error('Token non trouvé');
    }

    const response = await fetch(`${API_BASE_URL}/api/users`, { // Correction de l'URL
      headers: {
        'x-auth-token': token, // Ajouter l'en-tête d'authentification
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const users = await response.json();
    return users;

  } catch (error) {
    console.error("Impossible de récupérer les utilisateurs :", error);
    throw error;
  }
};
