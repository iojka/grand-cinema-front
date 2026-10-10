import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getTime } from '../utils/programme.js';

// Liste des séances : chaque horaire ouvre le plan de salle (US 1.1 et 1.3)
function ScreeningList({ screenings }) {
  const { t } = useTranslation();

  return (
    <ul className="screenings">
      {screenings.map((screening) => {
        const info = (
          <>
            <strong>{getTime(screening.starts_at)}</strong>
            <span>{screening.room}</span>
          </>
        );
        // Séance complète : affichée, mais pas de lien (non réservable)
        if (screening.is_full) {
          return (
            <li key={screening.id}>
              <span className="pill pill--full">
                {info}
                <span>{t('programme.full')}</span>
              </span>
            </li>
          );
        }
        return (
          <li key={screening.id}>
            <Link className="pill" to={`/seances/${screening.id}`}>
              {info}
              <span>
                {t('programme.remaining', {
                  count: screening.remaining_seats,
                })}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default ScreeningList;
