import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { getConfirmation } from '../api/client.js';
import Steps from '../components/Steps.jsx';
import { formatDay, formatPrice, getDay, getTime } from '../utils/programme.js';

// Tant que Stripe n'a pas confirmé le paiement, la page relit le
// récapitulatif toutes les 4 secondes (comme le plan de salle)
const REFRESH_DELAY = 4000;

// Récapitulatif de la réservation payée, au retour de Stripe (US 3.3)
function ConfirmationPage() {
  const { id } = useParams(); // identifiant de la réservation
  const { t, i18n } = useTranslation();
  const [booking, setBooking] = useState(null); // null = chargement
  const [error, setError] = useState(false);
  const confirmed = booking !== null && booking.status === 'CONFIRMED';

  useEffect(() => {
    // Paiement confirmé ou réservation introuvable : plus rien à relire
    if (confirmed || error) {
      return;
    }

    function load() {
      getConfirmation(id).then((data) => {
        if (data === null) {
          setError(true);
        } else {
          setBooking(data);
        }
      });
    }

    load();
    const timer = setInterval(load, REFRESH_DELAY);
    // Nettoyage : on arrête la relecture en quittant la page
    return () => clearInterval(timer);
  }, [id, confirmed, error]);

  // Pas de paiement confirmé : aucune confirmation (critère 3)
  if (error) {
    return (
      <section>
        <p role="status" className="message">
          {t('confirmation.error')}
        </p>
        <Link to="/">{t('movie.back')}</Link>
      </section>
    );
  }
  if (!confirmed) {
    return <p role="status">{t('confirmation.pending')}</p>;
  }

  const screening = booking.screening;
  // Places affichées sous la forme « A1, A2 »
  const seats = booking.tickets.map((ticket) => ticket.seat).join(', ');

  // Récapitulatif demandé par le critère 1
  return (
    <section>
      <Steps current={4} />
      <h1>{t('confirmation.title')}</h1>
      <dl className="recap">
        <dt>{t('confirmation.reference')}</dt>
        <dd>{booking.reference}</dd>
        <dt>{t('confirmation.movie')}</dt>
        <dd>{screening.movie.title}</dd>
        <dt>{t('confirmation.date')}</dt>
        <dd>
          {formatDay(getDay(screening.starts_at), i18n.language)} ·{' '}
          {getTime(screening.starts_at)}
        </dd>
        <dt>{t('confirmation.room')}</dt>
        <dd>{screening.room}</dd>
        <dt>{t('confirmation.seats')}</dt>
        <dd>{seats}</dd>
        <dt>{t('confirmation.total')}</dt>
        <dd>{formatPrice(booking.total_amount, i18n.language)}</dd>
      </dl>
      <p className="message">{t('confirmation.email')}</p>
      <Link to="/">{t('movie.back')}</Link>
    </section>
  );
}

export default ConfirmationPage;
