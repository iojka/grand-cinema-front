import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getProgramme } from '../api/client.js';
import MovieCard from '../components/MovieCard.jsx';
import { formatDay, groupByDay, groupByMovie } from '../utils/programme.js';

// Page d'accueil : programme des 7 prochains jours (US 1.1)
function HomePage() {
  const { t, i18n } = useTranslation();
  const [screenings, setScreenings] = useState(null); // null = chargement
  const [error, setError] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    getProgramme().then((data) => {
      if (data === null) {
        setError(true);
      } else {
        setScreenings(data);
      }
    });
  }, []);

  let content;
  if (error) {
    content = <p role="status">{t('programme.error')}</p>;
  } else if (screenings === null) {
    content = <p role="status">{t('programme.loading')}</p>;
  } else if (screenings.length === 0) {
    content = <p role="status">{t('programme.empty')}</p>;
  } else {
    const days = groupByDay(screenings);
    const movies = groupByMovie(days[selectedDay].screenings);
    content = (
      <>
        <nav className="days" aria-label={t('programme.days')}>
          {days.map((day, index) => (
            <button
              key={day.date}
              type="button"
              className="pill"
              aria-pressed={index === selectedDay}
              onClick={() => setSelectedDay(index)}
            >
              {formatDay(day.date, i18n.language)}
            </button>
          ))}
        </nav>
        <div className="movies">
          {movies.map((item) => (
            <MovieCard
              key={item.movie.id}
              movie={item.movie}
              screenings={item.screenings}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <section>
      <h1>{t('programme.title')}</h1>
      {content}
    </section>
  );
}

export default HomePage;
