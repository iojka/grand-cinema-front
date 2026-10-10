import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

// Rubriques des mentions légales, dans l'ordre
const SECTIONS = ['publisher', 'director', 'hosting', 'cookies', 'project'];

// Mentions légales (NF6), construites comme la politique de
// confidentialité
function LegalPage() {
  const { t } = useTranslation();

  return (
    <section className="legal">
      <h1>{t('legal.title')}</h1>
      {SECTIONS.map((section) => (
        <div key={section}>
          <h2>{t(`legal.${section}.title`)}</h2>
          <p>{t(`legal.${section}.text`)}</p>
        </div>
      ))}
      <Link to="/">{t('movie.back')}</Link>
    </section>
  );
}

export default LegalPage;
