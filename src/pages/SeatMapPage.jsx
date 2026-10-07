import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { getSeatMap, holdSeats } from '../api/client.js';
import OtherScreenings from '../components/OtherScreenings.jsx';
import Steps from '../components/Steps.jsx';
import {
  areSideBySide,
  formatDay,
  getDay,
  getTime,
  groupByRow,
} from '../utils/programme.js';

// US 2.1 : le plan est relu toutes les 4 secondes (moins de 5 s demandées)
const REFRESH_DELAY = 4000;

// États d'une place dans la légende (SELECTED : choisie par moi, US 2.2)
const LEGEND = ['FREE', 'SELECTED', 'HELD', 'SOLD'];

// Plan de salle d'une séance : voir les places (US 2.1) et les choisir
// côte à côte (US 2.2)
function SeatMapPage() {
  const { id } = useParams(); // identifiant de la séance dans l'adresse
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [seatMap, setSeatMap] = useState(null); // null = chargement
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0); // change = relire tout de suite
  const [selected, setSelected] = useState([]); // id des places choisies
  const [message, setMessage] = useState('');

  useEffect(() => {
    function load() {
      getSeatMap(id).then((data) => {
        if (data === null) {
          setError(true);
        } else {
          setError(false);
          setSeatMap(data);
        }
      });
    }

    load();
    const timer = setInterval(load, REFRESH_DELAY);
    // Nettoyage : on arrête le rafraîchissement en quittant la page
    return () => clearInterval(timer);
  }, [id, reload]);

  // Clic sur une place libre : on l'ajoute ou on la retire du choix
  function toggleSeat(seatId) {
    setMessage('');
    if (selected.includes(seatId)) {
      setSelected(selected.filter((item) => item !== seatId));
    } else {
      setSelected([...selected, seatId]);
    }
  }

  // Envoi du choix à l'API : places bloquées 10 minutes à mon nom
  async function handleHold() {
    const result = await holdSeats(seatMap.id, selected);
    setSelected([]);
    if (result === null) {
      setMessage(t('seats.holdError'));
    } else if (result.status === 201) {
      // US 2.3 : le spectateur choisit ensuite ses tarifs dans le panier
      navigate(`/reservation/${result.data.id}`);
      return;
    } else if (result.status === 409) {
      setMessage(t('seats.taken'));
    } else {
      setMessage(t('seats.notSideBySide'));
    }
    // Le plan est relu tout de suite (critère 2)
    setReload(reload + 1);
  }

  if (error) {
    return <p role="status">{t('seats.error')}</p>;
  }
  if (seatMap === null) {
    return <p role="status">{t('seats.loading')}</p>;
  }

  const day = getDay(seatMap.starts_at);
  const chosen = seatMap.seats.filter((seat) => selected.includes(seat.id));
  const sideBySide = areSideBySide(chosen);

  return (
    <section className="seat-map">
      <Link className="back" to={`/films/${seatMap.movie.id}`}>
        {t('seats.back')}
      </Link>
      <Steps current={2} />
      <h1>{t('seats.title')}</h1>
      <p className="card__details">
        <Link to={`/films/${seatMap.movie.id}`}>{seatMap.movie.title}</Link> ·{' '}
        {formatDay(day, i18n.language)} · {getTime(seatMap.starts_at)} ·{' '}
        {seatMap.room}
      </p>

      {seatMap.is_full ? (
        <>
          <p role="status" className="message">
            {t('seats.full')}
          </p>
          <OtherScreenings movieId={seatMap.movie.id} currentId={seatMap.id} />
        </>
      ) : (
        <p>{t('programme.remaining', { count: seatMap.remaining_seats })}</p>
      )}

      <p className="screen">{t('seats.screen')}</p>
      <div className="seats">
        {groupByRow(seatMap.seats).map((line) => (
          <div key={line.row} className="seats__row">
            <span className="seats__label">{line.row}</span>
            {line.seats.map((seat) => {
              const label = `${seat.row}${seat.number} ${t(`seats.status.${seat.status}`)}`;
              const isSelected = selected.includes(seat.id);
              let className = `seat seat--${seat.status.toLowerCase()}`;
              if (isSelected) {
                className += ' seat--selected';
              }
              if (seat.is_accessible) {
                className += ' seat--accessible';
              }
              // Place libre : bouton cliquable
              if (seat.status === 'FREE') {
                return (
                  <button
                    key={seat.id}
                    type="button"
                    className={className}
                    aria-label={label}
                    aria-pressed={isSelected}
                    title={label}
                    onClick={() => toggleSeat(seat.id)}
                  >
                    {seat.number}
                  </button>
                );
              }
              return (
                <span
                  key={seat.id}
                  className={className}
                  aria-label={label}
                  title={label}
                >
                  {seat.number}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <ul className="legend">
        {LEGEND.map((status) => (
          <li key={status}>
            <span
              className={`seat seat--${status.toLowerCase()}`}
              aria-hidden="true"
            ></span>
            {t(`seats.legend.${status}`)}
          </li>
        ))}
        <li>
          <span className="seat seat--accessible" aria-hidden="true"></span>
          {t('seats.legend.accessible')}
        </li>
      </ul>

      {message && (
        <p role="alert" className="message">
          {message}
        </p>
      )}

      <div className="selection">
        <p>{t('seats.selected', { count: chosen.length })}</p>
        {chosen.length > 1 && !sideBySide && <p>{t('seats.notSideBySide')}</p>}
        <button
          type="button"
          className="button"
          disabled={!sideBySide}
          onClick={handleHold}
        >
          {t('seats.hold')}
        </button>
      </div>
    </section>
  );
}

export default SeatMapPage;
