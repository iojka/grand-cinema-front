import { useTranslation } from 'react-i18next';

/**
 * Carte d'un indicateur du projet : valeur, cible et statut (US 8.2)
 * @param {object} props title (nom de l'indicateur), value (valeur à
 *   afficher, null si elle n'est pas calculée), target (cible à
 *   afficher), reached (objectif atteint ou non, null sans valeur),
 *   children (précisions sous la cible)
 */
function KpiCard({ title, value, target, reached, children }) {
  const { t } = useTranslation();

  // Statut écrit en toutes lettres : lisible sans les couleurs
  let status = null;
  if (reached !== null) {
    const level = reached ? 'ok' : 'ko';
    status = (
      <p className={`kpi__status kpi__status--${level}`}>
        {t(`kpi.status.${level}`)}
      </p>
    );
  }

  return (
    <article className="kpi">
      <h2>{title}</h2>
      {value !== null && <p className="kpi__value">{value}</p>}
      <p>{target}</p>
      {children}
      {status}
    </article>
  );
}

export default KpiCard;
