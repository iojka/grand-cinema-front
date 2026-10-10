import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

// Rubriques de la politique de confidentialité, dans l'ordre
const SECTIONS = [
  'data',
  'purposes',
  'legal',
  'retention',
  'recipients',
  'rights',
];

// Politique de confidentialité (US 2.4, RGPD)
function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <section className="privacy">
      <h1>{t('privacy.title')}</h1>
      <p>{t('privacy.intro')}</p>
      {SECTIONS.map((section) => (
        <div key={section}>
          <h2>{t(`privacy.${section}.title`)}</h2>
          <p>{t(`privacy.${section}.text`)}</p>
        </div>
      ))}
      <Link to="/">{t('movie.back')}</Link>
    </section>
  );
}

export default PrivacyPage;
