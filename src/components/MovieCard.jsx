import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { formatDuration } from '../utils/programme.js';
import Poster from './Poster.jsx';
import ScreeningList from './ScreeningList.jsx';

// Carte d'un film avec ses séances du jour (US 1.1)
function MovieCard({ movie, screenings }) {
  const { t } = useTranslation();

  return (
    <article className="card">
      <Poster movie={movie} className="card__poster" />
      <div>
        <h2>
          {/* Le titre ouvre la fiche du film (US 1.3) */}
          <Link to={`/films/${movie.id}`}>{movie.title}</Link>
        </h2>
        <p className="card__details">
          {movie.version} · {formatDuration(movie.duration_minutes)} ·{' '}
          {t(`rating.${movie.rating}`)}
          {movie.is_young_audience && ` · ${t('programme.youngAudience')}`}
        </p>
        <ScreeningList screenings={screenings} />
      </div>
    </article>
  );
}

export default MovieCard;
