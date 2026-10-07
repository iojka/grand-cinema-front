// Appels à l'API Django (adresse définie dans le fichier .env)
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Récupère le programme des 7 prochains jours (US 1.1)
 * @returns {Promise<Array|null>} les séances, ou null si l'API ne répond pas
 */
export async function getProgramme() {
  try {
    const response = await fetch(`${API_URL}/api/programme/`);
    if (!response.ok) {
      throw new Error(`erreur ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    // Erreur réseau ou serveur : la page affichera un message
    console.error('Programme indisponible :', error.message);
    return null;
  }
}
