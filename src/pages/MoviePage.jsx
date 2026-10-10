import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { getMovie } from '../api/client.js';
import Poster from '../components/Poster.jsx';
import ScreeningList from '../components/ScreeningList.jsx';
import { formatDay, formatDuration, groupByDay } from '../utils/programme.js';

// Fiche d'un film et ses prochaines séances (US 1.3)
function MoviePage() {
  const { id } = useParams(); // identifiant du film dans l'adresse
  const { t, i18n } = useTranslation();
  const [movie, setMovie] = useState(null); // null = chargement
  const [error, setError] = useState(false);

  useEffect(() => {
    getMovie(id).then((data) => {
      if (data === null) {
        setError(true);
      } else {
        setMovie(data);
      }
    });
  }, [id]);

  let content;
  if (error) {
    content = <p role="status">{t('movie.error')}</p>;
  } else if (movie === null) {
    content = <p role="status">{t('movie.loading')}</p>;
  } else {
    const days = groupByDay(movie.screenings);
    content = (
      <article className="movie">
        <Poster movie={movie} className="movie__poster" />
        <div className="movie__info">
          <h1>{movie.title}</h1>
          <p className="card__details">
            {movie.version} · {formatDuration(movie.duration_minutes)} ·{' '}
            {t(`rating.${movie.rating}`)}
            {movie.is_young_audience && ` · ${t('programme.youngAudience')}`}
          </p>
          <h2>{t('movie.synopsis')}</h2>
          <p>{movie.synopsis}</p>
          <h2>{t('movie.screenings')}</h2>
          {days.length === 0 && <p>{t('programme.empty')}</p>}
          {days.map((day) => (
            <section key={day.date}>
              <h3>{formatDay(day.date, i18n.language)}</h3>
              <ScreeningList screenings={day.screenings} />
            </section>
          ))}
        </div>
      </article>
    );
  }

  return (
    <>
      <Link className="back" to="/">
        {t('movie.back')}
      </Link>
      {content}
    </>
  );
}

export default MoviePage;
