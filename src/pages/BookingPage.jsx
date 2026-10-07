import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { cancelBooking, changeTicketPrice, getBooking } from '../api/client.js';
import { formatDay, formatPrice, getDay, getTime } from '../utils/programme.js';

// Panier : un tarif par place et le total, pendant le blocage de
// 10 minutes (US 2.3)
function BookingPage() {
  const { id } = useParams(); // identifiant de la réservation
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null); // null = chargement
  const [error, setError] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    getBooking(id).then((data) => {
      if (data === null) {
        setError(true);
      } else {
        setBooking(data);
      }
    });
  }, [id]);

  // Fin du blocage : le message s'affiche à l'heure d'expiration, sans
  // recharger la page
  useEffect(() => {
    if (booking === null) {
      return;
    }
    const delay = new Date(booking.expires_at) - Date.now();
    const timer = setTimeout(() => setExpired(true), delay);
    // Nettoyage : on arrête le minuteur en quittant la page
    return () => clearTimeout(timer);
  }, [booking]);

  // Choix d'un tarif : l'API renvoie le panier recalculé
  async function handlePrice(ticketId, priceId) {
    const data = await changeTicketPrice(booking.id, ticketId, priceId);
    if (data === null) {
      setExpired(true);
    } else {
      setBooking(data);
    }
  }

  // Changer de places : le panier est annulé (places libérées) et le
  // spectateur revient au plan de salle (critère 2)
  async function handleChangeSeats() {
    await cancelBooking(booking.id);
    navigate(`/seances/${booking.screening.id}`);
  }

  if (error || expired) {
    return (
      <section>
        <p role="status" className="message">
          {t('booking.expired')}
        </p>
        {booking ? (
          <Link to={`/seances/${booking.screening.id}`}>
            {t('booking.back')}
          </Link>
        ) : (
          <Link to="/">{t('movie.back')}</Link>
        )}
      </section>
    );
  }
  if (booking === null) {
    return <p role="status">{t('booking.loading')}</p>;
  }

  // Un tarif réduit demande un justificatif à l'entrée (critère 4)
  let needsProof = false;
  for (const ticket of booking.tickets) {
    const price = booking.prices.find((item) => item.id === ticket.price);
    if (price && price.requires_proof) {
      needsProof = true;
    }
  }

  const screening = booking.screening;
  return (
    <section className="basket">
      <h1>{t('booking.title')}</h1>
      <p className="card__details">
        {screening.movie.title} ·{' '}
        {formatDay(getDay(screening.starts_at), i18n.language)} ·{' '}
        {getTime(screening.starts_at)} · {screening.room}
      </p>
      <p>{t('booking.held', { time: getTime(booking.expires_at) })}</p>
      <p>{t('booking.reference', { reference: booking.reference })}</p>

      <ul className="tickets">
        {booking.tickets.map((ticket) => (
          <li key={ticket.id}>
            <label htmlFor={`price-${ticket.id}`}>
              {t('booking.seat', { seat: ticket.seat })}
            </label>
            <select
              id={`price-${ticket.id}`}
              value={ticket.price}
              onChange={(event) =>
                handlePrice(ticket.id, Number(event.target.value))
              }
            >
              {booking.prices.map((price) => (
                <option key={price.id} value={price.id}>
                  {price.label} : {formatPrice(price.amount, i18n.language)}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>

      <p className="basket__total">
        {t('booking.total', {
          total: formatPrice(booking.total_amount, i18n.language),
        })}
      </p>
      {needsProof && <p className="message">{t('booking.proof')}</p>}
      <p>{t('booking.next')}</p>
      <button
        type="button"
        className="button button--secondary"
        onClick={handleChangeSeats}
      >
        {t('booking.changeSeats')}
      </button>
    </section>
  );
}

export default BookingPage;
