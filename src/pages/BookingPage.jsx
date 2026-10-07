import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import {
  cancelBooking,
  changeTicketPrice,
  getBooking,
  saveCustomer,
} from '../api/client.js';
import Steps from '../components/Steps.jsx';
import { checkCustomer } from '../utils/customer.js';
import { formatDay, formatPrice, getDay, getTime } from '../utils/programme.js';

// Panier : un tarif par place et le total, pendant le blocage de
// 10 minutes (US 2.3), puis les coordonnées du spectateur (US 2.4)
function BookingPage() {
  const { id } = useParams(); // identifiant de la réservation
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null); // null = chargement
  const [error, setError] = useState(false);
  const [expired, setExpired] = useState(false);
  // Formulaire des coordonnées (US 2.4)
  const [form, setForm] = useState({
    name: '',
    email: '',
    confirmation: '',
    postcode: '',
    country: '',
  });
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);

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

  // Saisie dans un champ du formulaire (name = nom du champ)
  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  // Validation des coordonnées : vérifiées ici avant l'envoi (critère 3)
  async function handleSubmit(event) {
    event.preventDefault();
    const problem = checkCustomer(form);
    if (problem !== '') {
      setFormError(t(`customer.errors.${problem}`));
      return;
    }
    const data = await saveCustomer(booking.id, form);
    if (data === null) {
      setFormError(t('customer.errors.server'));
    } else {
      setFormError('');
      setSaved(true);
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
      <Steps current={3} />
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

      <form className="form" onSubmit={handleSubmit} noValidate>
        <h2>{t('customer.title')}</h2>
        <label htmlFor="name">{t('customer.name')}</label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
        />
        <label htmlFor="email">{t('customer.email')}</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
        />
        <label htmlFor="confirmation">{t('customer.confirmation')}</label>
        <input
          id="confirmation"
          name="confirmation"
          type="email"
          value={form.confirmation}
          onChange={handleChange}
        />
        <label htmlFor="postcode">{t('customer.postcode')}</label>
        <input
          id="postcode"
          name="postcode"
          autoComplete="postal-code"
          value={form.postcode}
          onChange={handleChange}
        />
        <label htmlFor="country">{t('customer.country')}</label>
        <input
          id="country"
          name="country"
          maxLength="2"
          value={form.country}
          onChange={handleChange}
        />
        {formError && (
          <p role="alert" className="message">
            {formError}
          </p>
        )}
        {/* Information RGPD affichée avant la validation (critère 4) */}
        <p className="rgpd">
          {t('customer.rgpd')}{' '}
          {/* Nouvel onglet : le formulaire en cours n'est pas perdu */}
          <Link to="/confidentialite" target="_blank" rel="noreferrer">
            {t('privacy.title')}
          </Link>
        </p>
        <button type="submit" className="button">
          {t('customer.submit')}
        </button>
      </form>

      {saved && (
        <div role="status" className="message">
          <p>{t('customer.saved')}</p>
          <p>{t('customer.next')}</p>
        </div>
      )}
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
