/**
 * Définit l'URL de base pour tous les appels API de l'application.
 *
 * Il tente de lire la variable d'environnement `REACT_APP_API_URL`,
 * qui est configurée dans les environnements de déploiement (comme Vercel).
 *
 * Si la variable n'est pas trouvée, il utilise une URL par défaut
 * pour le développement en local.
 *
 * @type {string}
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://3.253.74.107:3000';

export default API_BASE_URL;
