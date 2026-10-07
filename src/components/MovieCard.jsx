import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getTime } from '../utils/programme.js';

// Carte d'un film avec ses séances du jour (US 1.1)
function MovieCard({ movie, screenings }) {
  const { t } = useTranslation();
  const hours = Math.floor(movie.duration_minutes / 60);
  const minutes = String(movie.duration_minutes % 60).padStart(2, '0');

  return (
    <article className="card">
      {movie.poster ? (
        <img className="card__poster" src={movie.poster} alt="" />
      ) : (
        // Pas d'affiche : bloc de couleur à la place (visuel par défaut)
        <div className="card__poster" aria-hidden="true"></div>
      )}
      <div>
        <h2>{movie.title}</h2>
        <p className="card__details">
          {movie.version} · {hours} h {minutes} · {t(`rating.${movie.rating}`)}
          {movie.is_young_audience && ` · ${t('programme.youngAudience')}`}
        </p>
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
      </div>
    </article>
  );
}

export default MovieCard;
