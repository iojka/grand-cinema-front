import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getProgramme,
  getSeatMap,
  sellAtBoxOffice,
  ticketsPdfUrl,
} from '../api/client.js';
import LoginForm from '../components/LoginForm.jsx';
import ScreeningSelect from '../components/ScreeningSelect.jsx';
import SeatGrid from '../components/SeatGrid.jsx';
import StaffNav from '../components/StaffNav.jsx';
import { formatPrice } from '../utils/programme.js';

// Le plan est relu toutes les 4 secondes, comme sur le site (US 2.1)
const REFRESH_DELAY = 4000;

// Modes de paiement au guichet (critère 4)
const PAYMENT_METHODS = ['CASH', 'CARD_TERMINAL'];

// Vente au guichet par un agent d'accueil connecté (US 7.2) : même plan
// de salle et mêmes tarifs que le site
function BoxOfficePage() {
  const { t, i18n } = useTranslation();
  // Jeton JWT de l'agent, gardé jusqu'à la fermeture du navigateur
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [screenings, setScreenings] = useState([]);
  const [screeningId, setScreeningId] = useState('');
  const [seatMap, setSeatMap] = useState(null);
  const [reload, setReload] = useState(0); // change = relire tout de suite
  const [tickets, setTickets] = useState([]); // places choisies { seat, price }
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [message, setMessage] = useState('');
  const [sale, setSale] = useState(null); // dernière vente enregistrée

  // Séances des 7 prochains jours : l'agent vend aussi à l'avance
  useEffect(() => {
    if (token === null) {
      return;
    }
    getProgramme().then((data) => {
      if (data !== null) {
        setScreenings(data);
      }
    });
  }, [token]);

  // Plan de la séance choisie, relu régulièrement
  useEffect(() => {
    if (screeningId === '') {
      return;
    }
    function load() {
      getSeatMap(screeningId).then((data) => {
        if (data !== null) {
          setSeatMap(data);
        }
      });
    }

    load();
    const timer = setInterval(load, REFRESH_DELAY);
    // Nettoyage : on arrête le rafraîchissement en changeant de séance
    return () => clearInterval(timer);
  }, [screeningId, reload]);

  function handleLogin(newToken) {
    sessionStorage.setItem('token', newToken);
    setToken(newToken);
  }

  function handleLogout() {
    sessionStorage.removeItem('token');
    setToken(null);
    setScreeningId('');
    setSeatMap(null);
    setTickets([]);
  }

  // Changement de séance : on repart d'une vente vide
  function handleScreening(event) {
    setScreeningId(event.target.value);
    setSeatMap(null);
    setTickets([]);
    setMessage('');
    setSale(null);
  }

  // Clic sur une place libre : ajoutée au premier tarif (plein tarif)
  // ou retirée
  function toggleSeat(seatId) {
    setMessage('');
    setSale(null); // nouvelle vente : la précédente n'est plus affichée
    if (tickets.some((ticket) => ticket.seat === seatId)) {
      setTickets(tickets.filter((ticket) => ticket.seat !== seatId));
    } else {
      const price = seatMap.prices[0].id;
      setTickets([...tickets, { seat: seatId, price }]);
    }
  }

  // Choix du tarif d'une place
  function changePrice(seatId, priceId) {
    setTickets(
      tickets.map((ticket) =>
        ticket.seat === seatId ? { ...ticket, price: priceId } : ticket,
      ),
    );
  }

  // Encaissement : la vente est enregistrée par l'API
  async function handleSell() {
    setMessage('');
    setSale(null);
    const result = await sellAtBoxOffice(
      token,
      seatMap.id,
      tickets,
      paymentMethod,
    );
    if (result === null) {
      setMessage(t('boxOffice.error'));
      return;
    }
    if (result.status === 401) {
      // Jeton expiré : l'agent doit se reconnecter
      handleLogout();
      return;
    }
    if (result.status === 201) {
      setSale(result.data);
      setTickets([]);
    } else if (result.status === 409) {
      // Place vendue en ligne entre-temps (critère 2)
      setMessage(t('seats.taken'));
      setTickets([]);
    } else if (result.status === 403) {
      setMessage(t('boxOffice.forbidden'));
    } else {
      setMessage(t('boxOffice.error'));
    }
    // Le plan est relu tout de suite
    setReload(reload + 1);
  }

  if (token === null) {
    return (
      <section className="box-office">
        <h1>{t('boxOffice.title')}</h1>
        <LoginForm onLogin={handleLogin} />
      </section>
    );
  }

  // Total de la vente : prix des tarifs choisis, supplément de la salle
  // compris (calculé par l'API, comme sur le site)
  let total = 0;
  for (const ticket of tickets) {
    const price = seatMap.prices.find((item) => item.id === ticket.price);
    total += Number(price.amount);
  }

  return (
    <section className="box-office">
      <h1>{t('boxOffice.title')}</h1>
      <StaffNav onLogout={handleLogout} />
      <ScreeningSelect
        screenings={screenings}
        value={screeningId}
        onChange={handleScreening}
      />

      {seatMap && (
        <>
          <SeatGrid
            seats={seatMap.seats}
            selected={tickets.map((ticket) => ticket.seat)}
            onToggle={toggleSeat}
          />

          <ul className="tickets">
            {tickets.map((ticket) => {
              const seat = seatMap.seats.find(
                (item) => item.id === ticket.seat,
              );
              return (
                <li key={ticket.seat}>
                  <label htmlFor={`price-${ticket.seat}`}>
                    {t('booking.seat', { seat: `${seat.row}${seat.number}` })}
                  </label>
                  <select
                    id={`price-${ticket.seat}`}
                    value={ticket.price}
                    onChange={(event) =>
                      changePrice(ticket.seat, Number(event.target.value))
                    }
                  >
                    {seatMap.prices.map((price) => (
                      <option key={price.id} value={price.id}>
                        {price.label} :{' '}
                        {formatPrice(price.amount, i18n.language)}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>

          <fieldset className="payment">
            <legend>{t('boxOffice.payment')}</legend>
            {PAYMENT_METHODS.map((method) => (
              <label key={method}>
                <input
                  type="radio"
                  name="payment"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                />
                {t(`boxOffice.methods.${method}`)}
              </label>
            ))}
          </fieldset>

          {message && (
            <p role="alert" className="message">
              {message}
            </p>
          )}

          {/* Après l'encaissement, la vente remplace le bouton Encaisser */}
          {sale ? (
            <div role="status" className="sale">
              <p>{t('boxOffice.sold', { reference: sale.reference })}</p>
              {/* Billets à imprimer avec leur QR code (US 4.2) */}
              <a
                className="button"
                href={ticketsPdfUrl(sale.id)}
                target="_blank"
                rel="noreferrer"
              >
                {t('boxOffice.print')}
              </a>
            </div>
          ) : (
            <button
              type="button"
              className="button"
              disabled={tickets.length === 0}
              onClick={handleSell}
            >
              {t('boxOffice.sell', {
                total: formatPrice(total, i18n.language),
              })}
            </button>
          )}
        </>
      )}
    </section>
  );
}

export default BoxOfficePage;
