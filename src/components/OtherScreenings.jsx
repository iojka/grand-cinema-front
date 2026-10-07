import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getMovie } from '../api/client.js';
import { formatDay, groupByDay } from '../utils/programme.js';
import ScreeningList from './ScreeningList.jsx';

// Autres séances du même film, proposées si la séance est complète (US 2.1)
function OtherScreenings({ movieId, currentId }) {
  const { t, i18n } = useTranslation();
  const [screenings, setScreenings] = useState(null); // null = chargement

  useEffect(() => {
    getMovie(movieId).then((movie) => {
      if (movie !== null) {
        // On garde les séances encore réservables, sauf celle-ci
        setScreenings(
          movie.screenings.filter(
            (screening) => screening.id !== currentId && !screening.is_full,
          ),
        );
      }
    });
  }, [movieId, currentId]);

  if (screenings === null) {
    return null;
  }
  return (
    <section>
      <h2>{t('seats.others')}</h2>
      {screenings.length === 0 && <p>{t('seats.noOthers')}</p>}
      {groupByDay(screenings).map((day) => (
        <div key={day.date}>
          <h3>{formatDay(day.date, i18n.language)}</h3>
          <ScreeningList screenings={day.screenings} />
        </div>
      ))}
    </section>
  );
}

export default OtherScreenings;
