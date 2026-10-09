import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getTracking } from '../api/client.js';
import LoginForm from '../components/LoginForm.jsx';
import StaffNav from '../components/StaffNav.jsx';
import { getTime, todayDate } from '../utils/programme.js';

// Critère 2 : chiffres relus toutes les 30 secondes
const REFRESH_DELAY = 30000;

// Suivi des réservations par séance pour Isabelle (US 7.1) : places
// vendues, capacité, taux de remplissage, répartition web / guichet
function TrackingPage() {
  const { t } = useTranslation();
  // Jeton JWT, partagé avec le guichet et le contrôle des billets
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [day, setDay] = useState(todayDate()); // séances du jour
  const [room, setRoom] = useState(''); // '' = toutes les salles
  const [screenings, setScreenings] = useState(null); // null = chargement
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    if (token === null) {
      return;
    }
    function load() {
      getTracking(token, day).then((response) => {
        if (response !== null && response.status === 401) {
          // Jeton expiré : retour à la connexion
          sessionStorage.removeItem('token');
          setToken(null);
          return;
        }
        if (response === null || response.status !== 200) {
          setError(true);
          return;
        }
        setError(false);
        setScreenings(response.data);
        setUpdatedAt(new Date().toTimeString().slice(0, 8));
      });
    }

    load();
    const timer = setInterval(load, REFRESH_DELAY);
    // Nettoyage : on arrête la relecture en changeant de jour
    return () => clearInterval(timer);
  }, [token, day]);

  function handleLogin(newToken) {
    sessionStorage.setItem('token', newToken);
    setToken(newToken);
  }

  function handleLogout() {
    sessionStorage.removeItem('token');
    setToken(null);
  }

  // Choix d'un autre jour (critère 3)
  function handleDay(event) {
    setDay(event.target.value);
    setRoom('');
    setScreenings(null);
  }

  if (token === null) {
    return (
      <section className="tracking">
        <h1>{t('tracking.title')}</h1>
        <LoginForm onLogin={handleLogin} />
      </section>
    );
  }

  // Salles des séances du jour, pour le filtre (critère 3)
  const rooms = [];
  let shown = [];
  if (screenings !== null) {
    for (const item of screenings) {
      if (!rooms.includes(item.room)) {
        rooms.push(item.room);
      }
    }
    shown = screenings.filter((item) => room === '' || item.room === room);
  }

  let content;
  if (screenings === null) {
    content = <p role="status">{t('tracking.loading')}</p>;
  } else if (shown.length === 0) {
    content = <p role="status">{t('tracking.empty')}</p>;
  } else {
    content = (
      <div className="table-wrapper">
        <table className="tracking__table">
          <thead>
            <tr>
              <th>{t('tracking.time')}</th>
              <th>{t('tracking.movie')}</th>
              <th>{t('tracking.room')}</th>
              <th>{t('tracking.sold')}</th>
              <th>{t('tracking.rate')}</th>
              <th>{t('tracking.web')}</th>
              <th>{t('tracking.boxOffice')}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((item) => (
              <tr key={item.id}>
                <td>{getTime(item.starts_at)}</td>
                <td>{item.movie}</td>
                <td>{item.room}</td>
                <td>{`${item.sold} / ${item.capacity}`}</td>
                <td>{`${item.fill_rate} %`}</td>
                <td>{item.web}</td>
                <td>{item.box_office}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="tracking">
      <h1>{t('tracking.title')}</h1>
      <StaffNav onLogout={handleLogout} />

      <div className="tracking__filters">
        <div>
          <label htmlFor="day">{t('tracking.date')}</label>
          <input id="day" type="date" value={day} onChange={handleDay} />
        </div>
        <div>
          <label htmlFor="room">{t('tracking.room')}</label>
          <select
            id="room"
            value={room}
            onChange={(event) => setRoom(event.target.value)}
          >
            <option value="">{t('tracking.allRooms')}</option>
            {rooms.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="message">
          {t('tracking.error')}
        </p>
      )}
      {updatedAt && (
        <p className="tracking__updated">
          {t('tracking.updated', { time: updatedAt })}
        </p>
      )}
      {content}
    </section>
  );
}

export default TrackingPage;
