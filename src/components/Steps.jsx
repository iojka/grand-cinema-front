import { useTranslation } from 'react-i18next';

// Les 4 étapes de la réservation sans compte (US 2.4)
const STEPS = ['screening', 'seats', 'customer', 'payment'];

// Fil des étapes : l'étape en cours est mise en avant
function Steps({ current }) {
  const { t } = useTranslation();

  return (
    <ol className="steps" aria-label={t('steps.title')}>
      {STEPS.map((step, index) => (
        <li
          key={step}
          aria-current={index + 1 === current ? 'step' : undefined}
        >
          <span className="steps__number">{index + 1}</span>
          <span>{t(`steps.${step}`)}</span>
        </li>
      ))}
    </ol>
  );
}

export default Steps;
