import API_BASE_URL from '../config/apiConfig';

/**
 * Récupère la liste des utilisateurs depuis l'API.
 * @returns {Promise<Array>} Une promesse qui résout avec la liste des utilisateurs.
 */
export const fetchUsers = async () => {
  try {
    // On utilise la constante pour construire l'URL complète
    const response = await fetch(`${API_BASE_URL}/users`);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const users = await response.json();
    return users;

  } catch (error) {
    console.error("Impossible de récupérer les utilisateurs :", error);
    // Propager l'erreur pour que le code appelant puisse la gérer
    throw error;
  }
};
