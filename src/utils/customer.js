// Vérification des coordonnées du spectateur sans compte (US 2.4)

/**
 * Vérifie la forme d'une adresse e-mail : texte@domaine.extension
 * @param {string} email adresse saisie
 * @returns {boolean} true si l'adresse a une forme valide
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Vérifie le formulaire des coordonnées avant l'envoi à l'API
 * @param {object} form { name, email, confirmation, postcode, country }
 * @returns {string} le champ en erreur ("name", "email", "confirmation"
 *   ou "place"), ou "" si tout est correct
 */
export function checkCustomer(form) {
  if (form.name.trim() === '') {
    return 'name';
  }
  if (!isValidEmail(form.email)) {
    return 'email';
  }
  if (form.email !== form.confirmation) {
    return 'confirmation';
  }
  // Code postal ou pays : origine des spectateurs (US 8.2)
  if (form.postcode.trim() === '' && form.country.trim() === '') {
    return 'place';
  }
  return '';
}
