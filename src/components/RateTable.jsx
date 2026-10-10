import { useTranslation } from 'react-i18next';
import { rateLevel } from '../utils/dashboard.js';

/**
 * Taux de remplissage avec son code couleur (US 8.1, critère 2)
 * @param {object} props rate (taux en %)
 */
export function Rate({ rate }) {
  return <span className={`rate rate--${rateLevel(rate)}`}>{rate} %</span>;
}

/**
 * Tableau des taux de remplissage regroupés par salle, jour ou semaine
 * (US 8.1, critère 1)
 * @param {object} props caption (titre du tableau), header (titre de la
 *   1re colonne), rows (groupes de l'API), formatLabel (affichage du
 *   nom du groupe)
 */
function RateTable({ caption, header, rows, formatLabel }) {
  const { t } = useTranslation();

  return (
    <div className="table-wrapper">
      <table className="dashboard__table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th>{header}</th>
            <th>{t('dashboard.sold')}</th>
            <th>{t('dashboard.rate')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{formatLabel(row.label)}</td>
              <td>{`${row.sold} / ${row.capacity}`}</td>
              <td>
                <Rate rate={row.fill_rate} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RateTable;
