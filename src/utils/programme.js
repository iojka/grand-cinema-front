// Fonctions utilitaires du programme (US 1.1)
// Les dates de l'API sont au format ISO, en heure de Paris :
// "2026-10-08T20:00:00+02:00" -> jour "2026-10-08", heure "20:00"

/**
 * Renvoie le jour d'une séance
 * @param {string} startsAt date et heure de la séance (format ISO)
 * @returns {string} le jour, par exemple "2026-10-08"
 */
export function getDay(startsAt) {
  return startsAt.slice(0, 10);
}

/**
 * Renvoie l'heure d'une séance
 * @param {string} startsAt date et heure de la séance (format ISO)
 * @returns {string} l'heure, par exemple "20:00"
 */
export function getTime(startsAt) {
  return startsAt.slice(11, 16);
}

/**
 * Affiche un jour dans la langue choisie, par exemple "jeu. 8 oct."
 * @param {string} date jour au format "2026-10-08"
 * @param {string} language langue de l'interface ("fr" ou "en")
 * @returns {string} le jour à afficher
 */
export function formatDay(date, language) {
  // Midi : évite qu'un décalage horaire change le jour affiché
  return new Date(`${date}T12:00:00`).toLocaleDateString(language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Regroupe les séances par jour, en gardant l'ordre de l'API
 * @param {Array} screenings séances triées par date et heure
 * @returns {Array} liste de { date, screenings }
 */
export function groupByDay(screenings) {
  const days = [];
  for (const screening of screenings) {
    const date = getDay(screening.starts_at);
    let day = days.find((item) => item.date === date);
    if (!day) {
      day = { date, screenings: [] };
      days.push(day);
    }
    day.screenings.push(screening);
  }
  return days;
}

/**
 * Regroupe les séances par film, en gardant l'ordre de l'API
 * @param {Array} screenings séances d'un même jour
 * @returns {Array} liste de { movie, screenings }
 */
export function groupByMovie(screenings) {
  const movies = [];
  for (const screening of screenings) {
    let item = movies.find((movie) => movie.movie.id === screening.movie.id);
    if (!item) {
      item = { movie: screening.movie, screenings: [] };
      movies.push(item);
    }
    item.screenings.push(screening);
  }
  return movies;
}

/**
 * Affiche la durée d'un film, par exemple "1 h 35" (US 1.3)
 * @param {number} minutes durée du film en minutes
 * @returns {string} la durée en heures et minutes
 */
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = String(minutes % 60).padStart(2, '0');
  return `${hours} h ${rest}`;
}

/**
 * Regroupe les places par rangée, en gardant l'ordre de l'API (US 2.1)
 * @param {Array} seats places de la salle triées par rangée et numéro
 * @returns {Array} liste de { row, seats }
 */
export function groupByRow(seats) {
  const rows = [];
  for (const seat of seats) {
    let item = rows.find((line) => line.row === seat.row);
    if (!item) {
      item = { row: seat.row, seats: [] };
      rows.push(item);
    }
    item.seats.push(seat);
  }
  return rows;
}
