// Appels à l'API Django (adresse définie dans le fichier .env)
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Vérifie que l'API répond.
 * @returns {Promise<boolean>} true si l'API est disponible
 */
export async function getApiHealth() {
  try {
    const response = await fetch(`${API_URL}/api/health/`);
    return response.ok;
  } catch (error) {
    // Erreur réseau : serveur arrêté, connexion coupée...
    console.error('API injoignable :', error.message);
    return false;
  }
}
