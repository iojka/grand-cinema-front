import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getOccupancy } from '../api/client.js';
import LoginForm from '../components/LoginForm.jsx';
import RateTable, { Rate } from '../components/RateTable.jsx';
import StaffNav from '../components/StaffNav.jsx';
import { percent } from '../utils/dashboard.js';
import { daysAgo, formatDay, getTime, todayDate } from '../utils/programme.js';

// Niveaux du code couleur, expliqués dans la légende (critère 2)
const LEVELS = ['low', 'medium', 'high'];

// Tableau de bord du remplissage pour Isabelle (US 8.1) : taux par
// séance, salle, jour et semaine, ventes web et guichet de la période
function DashboardPage() {
  const { t, i18n } = useTranslation();
  // Jeton JWT, partagé avec les autres pages de l'espace professionnel
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  // Période : les 7 derniers jours par défaut (critère 3)
  const [start, setStart] = useState(daysAgo(6));
  const [end, setEnd] = useState(todayDate());
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(''); // '', forbidden ou server

  useEffect(() => {
    if (token === null) {
      return;
    }
    getOccupancy(token, start, end).then((response) => {
      if (response !== null && response.status === 401) {
        // Jeton expiré : retour à la connexion
        sessionStorage.removeItem('token');
        setToken(null);
        return;
      }
      if (response !== null && response.status === 200) {
        setError('');
        setDashboard(response.data);
      } else if (response !== null && response.status === 403) {
        setError('forbidden');
      } else {
        setError('server');
      }
    });
  }, [token, start, end]);

  function handleLogin(newToken) {
    sessionStorage.setItem('token', newToken);
    setToken(newToken);
  }

  function handleLogout() {
    sessionStorage.removeItem('token');
    setToken(null);
    setDashboard(null);
  }

  if (token === null) {
    return (
      <section className="dashboard">
        <h1>{t('dashboard.title')}</h1>
        <LoginForm onLogin={handleLogin} />
      </section>
    );
  }

  let content = null;
  if (dashboard !== null && dashboard.screenings.length === 0) {
    content = <p role="status">{t('dashboard.empty')}</p>;
  } else if (dashboard !== null) {
    // Comparaison des ventes web et guichet (critère 3)
    const total = dashboard.web + dashboard.box_office;
    const webShare = percent(dashboard.web, total);
    const boxOfficeShare = percent(dashboard.box_office, total);
    content = (
      <>
        <h2>{t('dashboard.sales')}</h2>
        <p>
          {t('dashboard.web', { number: dashboard.web, percent: webShare })}
        </p>
        <p>
          {t('dashboard.boxOffice', {
            number: dashboard.box_office,
            percent: boxOfficeShare,
          })}
        </p>
        {/* Barre de comparaison : sa longueur suit la part des ventes */}
        <div className="compare" aria-hidden="true">
          <span
            className="compare__web"
            style={{ width: `${webShare}%` }}
          ></span>
          <span
            className="compare__box-office"
            style={{ width: `${boxOfficeShare}%` }}
          ></span>
        </div>

        <h2>{t('dashboard.fillRate')}</h2>
        <ul className="legend">
          {LEVELS.map((level) => (
            <li key={level}>
              <span className={`rate rate--${level}`} aria-hidden="true">
                %
              </span>
              {t(`dashboard.levels.${level}`)}
            </li>
          ))}
        </ul>

        <RateTable
          caption={t('dashboard.byWeek')}
          header={t('dashboard.week')}
          rows={dashboard.weeks}
          formatLabel={(label) =>
            t('dashboard.weekOf', { day: formatDay(label, i18n.language) })
          }
        />
        <RateTable
          caption={t('dashboard.byDay')}
          header={t('dashboard.day')}
          rows={dashboard.days}
          formatLabel={(label) => formatDay(label, i18n.language)}
        />
        <RateTable
          caption={t('dashboard.byRoom')}
          header={t('dashboard.room')}
          rows={dashboard.rooms}
          formatLabel={(label) => label}
        />

        <div className="table-wrapper">
          <table className="dashboard__table">
            <caption>{t('dashboard.byScreening')}</caption>
            <thead>
              <tr>
                <th>{t('dashboard.day')}</th>
                <th>{t('dashboard.movie')}</th>
                <th>{t('dashboard.room')}</th>
                <th>{t('dashboard.sold')}</th>
                <th>{t('dashboard.rate')}</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.screenings.map((item) => (
                <tr key={item.id}>
                  <td>
                    {`${formatDay(item.day, i18n.language)} ${getTime(item.starts_at)}`}
                  </td>
                  <td>{item.movie}</td>
                  <td>{item.room}</td>
                  <td>{`${item.sold} / ${item.capacity}`}</td>
                  <td>
                    <Rate rate={item.fill_rate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <section className="dashboard">
      <h1>{t('dashboard.title')}</h1>
      <StaffNav onLogout={handleLogout} />

      <div className="dashboard__period">
        <div>
          <label htmlFor="start">{t('dashboard.start')}</label>
          <input
            id="start"
            type="date"
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="end">{t('dashboard.end')}</label>
          <input
            id="end"
            type="date"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="message">
          {t(`dashboard.errors.${error}`)}
        </p>
      )}
      {content}
    </section>
  );
}

export default DashboardPage;
