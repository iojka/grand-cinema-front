import { useTranslation } from 'react-i18next';
import { formatDay, getDay, getTime } from '../utils/programme.js';

/**
 * Choix de la séance par le personnel : guichet (US 7.2) et contrôle
 * des billets (US 7.3)
 * @param {object} props screenings (séances des 7 jours), value (id de
 *   la séance choisie), onChange (changement de séance)
 */
function ScreeningSelect({ screenings, value, onChange }) {
  const { t, i18n } = useTranslation();

  return (
    <div className="screening-select">
      <label htmlFor="screening">{t('staff.screening')}</label>
      <select id="screening" value={value} onChange={onChange}>
        <option value="">{t('staff.choose')}</option>
        {screenings.map((screening) => (
          <option key={screening.id} value={screening.id}>
            {`${formatDay(getDay(screening.starts_at), i18n.language)} ${getTime(screening.starts_at)} · ${screening.movie.title} · ${screening.room}`}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ScreeningSelect;
