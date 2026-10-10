// Fonctions utilitaires du tableau de bord du remplissage (US 8.1)

/**
 * Classe un taux de remplissage pour le code couleur (critère 2)
 * @param {number} rate taux de remplissage en %
 * @returns {string} "low" (moins de 20 %), "medium" (de 20 à 80 %) ou
 *   "high" (plus de 80 %)
 */
export function rateLevel(rate) {
  if (rate < 20) {
    return 'low';
  }
  if (rate > 80) {
    return 'high';
  }
  return 'medium';
}

/**
 * Calcule une part en pourcentage, arrondie à l'unité (critère 3)
 * @param {number} part ventes web ou guichet
 * @param {number} total toutes les ventes de la période
 * @returns {number} la part en %, 0 s'il n'y a aucune vente
 */
export function percent(part, total) {
  if (total === 0) {
    return 0;
  }
  return Math.round((part * 100) / total);
}
