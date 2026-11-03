/**
 * URL du backend, sans `/api` à la fin.
 * Vide : le portail appelle la même adresse que la page (nginx relaie vers le backend).
 * Absente : poste de développement, http://localhost:5000.
 */
const configured = process.env.REACT_APP_API_URL;
const API_BASE_URL = configured == null
  ? 'http://localhost:5000'
  : String(configured).replace(/\/$/, '');

export default API_BASE_URL;
