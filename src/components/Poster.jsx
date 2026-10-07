import { useTranslation } from 'react-i18next';

// Affiche du film, ou visuel par défaut si elle manque (US 1.3)
function Poster({ movie, className }) {
  const { t } = useTranslation();

  if (movie.poster) {
    return (
      <img
        className={className}
        src={movie.poster}
        alt={t('movie.poster', { title: movie.title })}
      />
    );
  }
  return (
    <img
      className={className}
      src="/default-poster.svg"
      alt={t('movie.noPoster')}
    />
  );
}

export default Poster;
