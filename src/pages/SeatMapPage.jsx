import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { getSeatMap } from '../api/client.js';
import OtherScreenings from '../components/OtherScreenings.jsx';
import { formatDay, getDay, getTime, groupByRow } from '../utils/programme.js';

// US 2.1 : le plan est relu toutes les 4 secondes (moins de 5 s. demandées)
const REFRESH_DELAY = 4000;

// Les 3 états d'une place, dans l'ordre de la légende
const STATUSES = ['FREE', 'HELD', 'SOLD'];

// Plan de salle d'une séance : places libres, bloquées et vendues
function SeatMapPage() {
  const { id } = useParams(); // identifiant de la séance dans l'adresse
  const { t, i18n } = useTranslation();
  const [seatMap, setSeatMap] = useState(null); // null = chargement
  const [error, setError] = useState(false);

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
  }, [id]);

  if (error) {
    return <p role="status">{t('seats.error')}</p>;
  }
  if (seatMap === null) {
    return <p role="status">{t('seats.loading')}</p>;
  }

  const day = getDay(seatMap.starts_at);
  return (
    <section className="seat-map">
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
              let className = `seat seat--${seat.status.toLowerCase()}`;
              if (seat.is_accessible) {
                className += ' seat--accessible';
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
        {STATUSES.map((status) => (
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
    </section>
  );
}

export default SeatMapPage;
