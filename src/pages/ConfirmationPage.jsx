import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Steps from '../components/Steps.jsx';

// Retour de la page de paiement Stripe (US 3.1) : le récapitulatif
// complet et le billet viendront avec l'US 3.3
function ConfirmationPage() {
  const { t } = useTranslation();

  return (
    <section>
      <Steps current={4} />
      <h1>{t('confirmation.title')}</h1>
      <p>{t('confirmation.text')}</p>
      <Link to="/">{t('movie.back')}</Link>
    </section>
  );
}

export default ConfirmationPage;
