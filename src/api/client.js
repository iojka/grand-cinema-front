// Appels à l'API Django (adresse définie dans le fichier .env)
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Lit des données de l'API (requête GET)
 * @param {string} path chemin de la route, par exemple "/api/programme/"
 * @returns {Promise<any|null>} les données, ou null en cas d'erreur
 */
async function getData(path) {
  try {
    const response = await fetch(`${API_URL}${path}`);
    if (!response.ok) {
      throw new Error(`erreur ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    // Erreur réseau ou serveur (404...) : la page affichera un message
    console.error(`API indisponible (${path}) :`, error.message);
    return null;
  }
}

/**
 * Récupère le programme des 7 prochains jours (US 1.1)
 * @returns {Promise<Array|null>} les séances, ou null si l'API ne répond pas
 */
export function getProgramme() {
  return getData('/api/programme/');
}

/**
 * Récupère la fiche d'un film et ses prochaines séances (US 1.3)
 * @param {string} id identifiant du film
 * @returns {Promise<object|null>} le film, ou null s'il est introuvable
 */
export function getMovie(id) {
  return getData(`/api/programme/movies/${id}/`);
}
