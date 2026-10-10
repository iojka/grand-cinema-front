import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { getConfirmation, ticketQrUrl, ticketsPdfUrl } from '../api/client.js';
import Steps from '../components/Steps.jsx';
import {
  formatLongDay,
  formatPrice,
  getDay,
  getTime,
} from '../utils/programme.js';

// Tant que Stripe n'a pas confirmé le paiement, la page relit le
// récapitulatif toutes les 4 secondes (comme le plan de salle)
const REFRESH_DELAY = 4000;

// Récapitulatif de la réservation payée, au retour de Stripe (US 3.3),
// puis un billet QR code par place (US 4.1)
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
  // Date et heure en toutes lettres, par exemple « jeudi 8 octobre à 20:30 »
  const date = t('confirmation.at', {
    day: formatLongDay(getDay(screening.starts_at), i18n.language),
    time: getTime(screening.starts_at),
  });
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
        <dd>{date}</dd>
        <dt>{t('confirmation.room')}</dt>
        <dd>{screening.room}</dd>
        <dt>{t('confirmation.seats')}</dt>
        <dd>{seats}</dd>
        <dt>{t('confirmation.total')}</dt>
        <dd>{formatPrice(booking.total_amount, i18n.language)}</dd>
      </dl>
      <p className="message">{t('confirmation.email')}</p>

      {/* US 4.1 : un billet par place, avec son QR code (critères 1 et 3) */}
      <h2>{t('confirmation.tickets')}</h2>
      <p>{t('confirmation.show')}</p>
      {/* US 4.2 : billets à imprimer, téléchargeables autant de fois que
          nécessaire (le lien de l'e-mail ramène sur cette page) */}
      <a className="button ticket-download" href={ticketsPdfUrl(booking.id)}>
        {t('confirmation.pdf')}
      </a>
      <ul className="ticket-list">
        {booking.tickets.map((ticket) => (
          <li key={ticket.id} className="ticket">
            <img
              src={ticketQrUrl(ticket.id)}
              alt={t('confirmation.qr', { seat: ticket.seat })}
              width="180"
              height="180"
            />
            <p className="ticket__movie">{screening.movie.title}</p>
            <p>{date}</p>
            <p>{screening.room}</p>
            <p>{t('booking.seat', { seat: ticket.seat })}</p>
          </li>
        ))}
      </ul>
      <Link to="/">{t('movie.back')}</Link>
    </section>
  );
}

export default ConfirmationPage;
