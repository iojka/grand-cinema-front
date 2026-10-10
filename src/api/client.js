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

/**
 * Récupère le plan de salle d'une séance (US 2.1)
 * @param {string} id identifiant de la séance
 * @returns {Promise<object|null>} la séance et ses places, ou null
 */
export function getSeatMap(id) {
  return getData(`/api/booking/screenings/${id}/seats/`);
}

/**
 * Bloque des places côte à côte pendant 10 minutes (US 2.2)
 * @param {number} screeningId identifiant de la séance
 * @param {Array<number>} seatIds identifiants des places choisies
 * @returns {Promise<object|null>} { status, data }, ou null si l'API ne
 *   répond pas
 */
export async function holdSeats(screeningId, seatIds) {
  try {
    const response = await fetch(`${API_URL}/api/booking/holds/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screening: screeningId, seats: seatIds }),
    });
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('Blocage impossible :', error.message);
    return null;
  }
}

/**
 * Récupère le panier d'une réservation en attente (US 2.3)
 * @param {string} id identifiant de la réservation
 * @returns {Promise<object|null>} le panier, ou null s'il a expiré
 */
export function getBooking(id) {
  return getData(`/api/booking/bookings/${id}/`);
}

/**
 * Choisit le tarif d'une place du panier (US 2.3)
 * @param {string} bookingId identifiant de la réservation
 * @param {string} ticketId identifiant de la place (billet)
 * @param {number} priceId identifiant du tarif choisi
 * @returns {Promise<object|null>} le panier recalculé, ou null en cas
 *   d'erreur (panier expiré)
 */
export async function changeTicketPrice(bookingId, ticketId, priceId) {
  try {
    const path = `/api/booking/bookings/${bookingId}/tickets/${ticketId}/`;
    const response = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: priceId }),
    });
    if (!response.ok) {
      throw new Error(`erreur ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Tarif non modifié :', error.message);
    return null;
  }
}

/**
 * Annule le panier pour changer de places : elles sont libérées (US 2.3)
 * @param {string} id identifiant de la réservation
 * @returns {Promise<boolean>} true si le panier est annulé
 */
export async function cancelBooking(id) {
  try {
    const response = await fetch(`${API_URL}/api/booking/bookings/${id}/`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Panier non annulé :', error.message);
    return false;
  }
}

/**
 * Enregistre les coordonnées du spectateur sans compte (US 2.4)
 * @param {string} bookingId identifiant de la réservation
 * @param {object} form { name, email, confirmation, postcode, country }
 * @param {string} language langue du site, pour l'e-mail (US 3.3)
 * @returns {Promise<object|null>} le panier, ou null en cas d'erreur
 */
export async function saveCustomer(bookingId, form, language) {
  try {
    const path = `/api/booking/bookings/${bookingId}/customer/`;
    const response = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: form.name,
        customer_email: form.email,
        email_confirmation: form.confirmation,
        customer_postcode: form.postcode,
        customer_country: form.country,
        customer_language: language,
      }),
    });
    if (!response.ok) {
      throw new Error(`erreur ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Coordonnées non enregistrées :', error.message);
    return null;
  }
}

/**
 * Récupère le récapitulatif de la réservation payée (US 3.3)
 * @param {string} id identifiant de la réservation
 * @returns {Promise<object|null>} le récapitulatif, ou null s'il n'y a
 *   pas de réservation en cours ou confirmée
 */
export function getConfirmation(id) {
  return getData(`/api/booking/bookings/${id}/confirmation/`);
}

/**
 * Adresse de l'image du QR code d'un billet, servie par l'API (US 4.1)
 * @param {string} ticketId identifiant du billet
 * @returns {string} l'adresse de l'image PNG
 */
export function ticketQrUrl(ticketId) {
  return `${API_URL}/api/tickets/${ticketId}/qr/`;
}

/**
 * Adresse des billets à imprimer (PDF A4) d'une réservation (US 4.2)
 * @param {string} bookingId identifiant de la réservation
 * @returns {string} l'adresse du PDF à télécharger
 */
export function ticketsPdfUrl(bookingId) {
  return `${API_URL}/api/tickets/bookings/${bookingId}/pdf/`;
}

/**
 * Demande l'adresse de la page de paiement sécurisée Stripe (US 3.1)
 * @param {string} bookingId identifiant de la réservation
 * @returns {Promise<string|null>} l'adresse de la page, ou null en cas
 *   d'erreur
 */
export async function startCheckout(bookingId) {
  try {
    const path = `/api/payment/bookings/${bookingId}/checkout/`;
    const response = await fetch(`${API_URL}${path}`, { method: 'POST' });
    if (!response.ok) {
      throw new Error(`erreur ${response.status}`);
    }
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Paiement indisponible :', error.message);
    return null;
  }
}

/**
 * Connecte un membre du personnel par e-mail et mot de passe (US 9.1)
 * @param {string} email adresse e-mail, identifiant de connexion
 * @param {string} password mot de passe
 * @returns {Promise<string|null>} le jeton JWT d'accès, ou null si la
 *   connexion est refusée
 */
export async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      throw new Error(`erreur ${response.status}`);
    }
    const data = await response.json();
    return data.access;
  } catch (error) {
    console.error('Connexion refusée :', error.message);
    return null;
  }
}

/**
 * Enregistre une vente au guichet, payée sur place (US 7.2)
 * @param {string} token jeton JWT de l'agent connecté
 * @param {number} screeningId identifiant de la séance
 * @param {Array<object>} tickets places et tarifs : [{ seat, price }]
 * @param {string} paymentMethod "CASH" (espèces) ou "CARD_TERMINAL"
 * @returns {Promise<object|null>} { status, data }, ou null si l'API ne
 *   répond pas
 */
export async function sellAtBoxOffice(
  token,
  screeningId,
  tickets,
  paymentMethod,
) {
  try {
    const response = await fetch(`${API_URL}/api/booking/box-office/sales/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Route réservée au personnel : le jeton prouve la connexion
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        screening: screeningId,
        tickets,
        payment_method: paymentMethod,
      }),
    });
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('Vente non enregistrée :', error.message);
    return null;
  }
}

/**
 * Contrôle un billet scanné à l'entrée (US 7.3)
 * @param {string} token jeton JWT de l'agent connecté
 * @param {number} screeningId séance contrôlée
 * @param {string} code texte lu dans le QR code
 * @returns {Promise<object|null>} { status, data }, ou null si le réseau
 *   ne répond pas
 */
export async function scanTicket(token, screeningId, code) {
  try {
    const response = await fetch(`${API_URL}/api/tickets/scan/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ screening: Number(screeningId), code }),
    });
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('Scan impossible :', error.message);
    return null;
  }
}

/**
 * Récupère la liste des réservations d'une séance (US 7.3, mode dégradé)
 * @param {string} token jeton JWT de l'agent connecté
 * @param {number} screeningId séance contrôlée
 * @returns {Promise<Array|null>} les réservations, ou null en cas d'erreur
 */
export async function getEntries(token, screeningId) {
  try {
    const path = `/api/tickets/screenings/${screeningId}/entries/`;
    const response = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`erreur ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Liste de la séance indisponible :', error.message);
    return null;
  }
}

/**
 * Valide l'entrée d'une réservation par son numéro (US 7.3, critère 4)
 * @param {string} token jeton JWT de l'agent connecté
 * @param {string} bookingId identifiant de la réservation
 * @returns {Promise<object|null>} { status, data }, ou null si le réseau
 *   ne répond pas
 */
export async function checkIn(token, bookingId) {
  try {
    const path = `/api/tickets/bookings/${bookingId}/checkin/`;
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('Entrée non envoyée :', error.message);
    return null;
  }
}

/**
 * Récupère le suivi des réservations des séances d'un jour (US 7.1)
 * @param {string} token jeton JWT du membre du personnel connecté
 * @param {string} day jour suivi, par exemple "2026-10-09"
 * @returns {Promise<object|null>} { status, data }, ou null si l'API ne
 *   répond pas
 */
export async function getTracking(token, day) {
  try {
    const response = await fetch(
      `${API_URL}/api/booking/tracking/?date=${day}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('Suivi indisponible :', error.message);
    return null;
  }
}

/**
 * Récupère le tableau de bord du remplissage d'une période (US 8.1)
 * @param {string} token jeton JWT d'Isabelle ou de la direction
 * @param {string} start premier jour, par exemple "2026-10-01"
 * @param {string} end dernier jour, par exemple "2026-10-31"
 * @returns {Promise<object|null>} { status, data }, ou null si l'API ne
 *   répond pas
 */
export async function getOccupancy(token, start, end) {
  try {
    const response = await fetch(
      `${API_URL}/api/dashboard/occupancy/?start=${start}&end=${end}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('Tableau de bord indisponible :', error.message);
    return null;
  }
}

/**
 * Récupère les indicateurs du projet (US 8.2)
 * @param {string} token jeton JWT de la direction ou d'Isabelle
 * @returns {Promise<object|null>} { status, data }, ou null si l'API ne
 *   répond pas
 */
export async function getKpi(token) {
  try {
    const response = await fetch(`${API_URL}/api/dashboard/kpi/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('Indicateurs indisponibles :', error.message);
    return null;
  }
}

/**
 * Télécharge les indicateurs du projet en CSV (US 8.2, critère 3)
 * @param {string} token jeton JWT de la direction ou d'Isabelle
 * @returns {Promise<Blob|null>} le fichier, ou null en cas d'erreur
 */
export async function downloadKpiCsv(token) {
  try {
    const response = await fetch(`${API_URL}/api/dashboard/kpi/csv/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`erreur ${response.status}`);
    }
    // blob() : contenu brut du fichier, prêt à être téléchargé
    return await response.blob();
  } catch (error) {
    console.error('Export CSV impossible :', error.message);
    return null;
  }
}
