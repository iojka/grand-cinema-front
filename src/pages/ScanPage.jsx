import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  checkIn,
  getEntries,
  getProgramme,
  scanTicket,
} from '../api/client.js';
import LoginForm from '../components/LoginForm.jsx';
import QrScanner from '../components/QrScanner.jsx';
import ScreeningSelect from '../components/ScreeningSelect.jsx';
import StaffNav from '../components/StaffNav.jsx';
import { formatDay, getDay, getTime } from '../utils/programme.js';

// Relecture de la liste de la séance toutes les 30 secondes
const REFRESH_DELAY = 30000;

// Couleur de l'écran selon le résultat du scan (critères 1 à 3)
const COLORS = {
  VALID: 'green',
  ALREADY_SCANNED: 'red',
  OTHER_SCREENING: 'orange',
  INVALID: 'red',
  ERROR: 'red',
};

/**
 * Heure actuelle, par exemple "20:15" (entrée validée hors ligne)
 * @returns {string} l'heure de la tablette
 */
function currentTime() {
  return new Date().toTimeString().slice(0, 5);
}

// Contrôle des billets à l'entrée par un agent d'accueil connecté
// (US 7.3) : scan du QR code, ou numéro de réservation (mode dégradé)
function ScanPage() {
  const { t, i18n } = useTranslation();
  // Jeton JWT de l'agent, partagé avec la page du guichet
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [screenings, setScreenings] = useState([]);
  const [screeningId, setScreeningId] = useState('');
  const [result, setResult] = useState(null); // null = caméra affichée
  const [entries, setEntries] = useState([]); // liste de la séance
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState([]); // id validés hors ligne

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

  // Liste de la séance, relue toutes les 30 secondes tant que le réseau
  // fonctionne : elle reste dans la page pendant une coupure (critère 4)
  useEffect(() => {
    // Entrées hors ligne pas encore envoyées : on ne relit pas la liste
    // pour ne pas les effacer
    if (screeningId === '' || pending.length > 0) {
      return;
    }
    function load() {
      getEntries(token, screeningId).then((data) => {
        if (data !== null) {
          setEntries(data);
        }
      });
    }

    load();
    const timer = setInterval(load, REFRESH_DELAY);
    // Nettoyage : on arrête la relecture en changeant de séance
    return () => clearInterval(timer);
  }, [token, screeningId, pending]);

  function handleLogin(newToken) {
    sessionStorage.setItem('token', newToken);
    setToken(newToken);
  }

  function handleLogout() {
    sessionStorage.removeItem('token');
    setToken(null);
    setScreeningId('');
    setResult(null);
    setEntries([]);
  }

  function handleScreening(event) {
    setScreeningId(event.target.value);
    setResult(null);
    setEntries([]);
    setSearch('');
  }

  // QR code lu par la caméra : l'API indique l'écran à afficher
  async function handleScan(code) {
    const response = await scanTicket(token, screeningId, code);
    if (response !== null && response.status === 401) {
      handleLogout();
      return;
    }
    if (response === null || response.status !== 200) {
      // Réseau coupé : l'agent utilise la liste de la séance
      setResult({ result: 'ERROR', ticket: null });
      return;
    }
    setResult(response.data);
    // Billet validé : la réservation est notée entrée dans la liste
    if (response.data.result === 'VALID') {
      const ticket = response.data.ticket;
      setEntries(
        entries.map((entry) =>
          entry.reference === ticket.reference && entry.scanned_at === null
            ? { ...entry, scanned_at: ticket.scanned_at }
            : entry,
        ),
      );
    }
  }

  // Entrée validée par le numéro de réservation (critère 4)
  async function handleCheckIn(entry) {
    const response = await checkIn(token, entry.id);
    if (response === null) {
      // Coupure réseau : entrée notée sur la tablette, envoyée plus tard
      setEntries(
        entries.map((item) =>
          item.id === entry.id ? { ...item, offline_at: currentTime() } : item,
        ),
      );
      setPending([...pending, entry.id]);
      return;
    }
    if (response.status === 401) {
      handleLogout();
      return;
    }
    if (response.status === 200) {
      setEntries(
        entries.map((item) => (item.id === entry.id ? response.data : item)),
      );
    }
  }

  // Retour du réseau : envoi des entrées validées hors ligne
  async function handleSend() {
    const sent = []; // réservations enregistrées par le serveur
    for (const id of pending) {
      const response = await checkIn(token, id);
      if (response !== null && response.status === 200) {
        sent.push(response.data);
      }
    }
    setEntries(
      entries.map((item) => {
        const data = sent.find((booking) => booking.id === item.id);
        return data ? data : item;
      }),
    );
    setPending(pending.filter((id) => !sent.some((item) => item.id === id)));
  }

  if (token === null) {
    return (
      <section className="scan">
        <h1>{t('scan.title')}</h1>
        <LoginForm onLogin={handleLogin} />
      </section>
    );
  }

  // Réservations trouvées par leur numéro (majuscules ou minuscules)
  let found = [];
  if (search !== '') {
    found = entries.filter((entry) =>
      entry.reference.includes(search.toUpperCase()),
    );
  }

  // État d'une réservation de la liste
  function entryStatus(entry) {
    if (entry.scanned_at) {
      return (
        <span>{t('scan.entered', { time: getTime(entry.scanned_at) })}</span>
      );
    }
    if (entry.offline_at) {
      return (
        <span>{t('scan.offlineEntered', { time: entry.offline_at })}</span>
      );
    }
    return (
      <button
        type="button"
        className="button"
        onClick={() => handleCheckIn(entry)}
      >
        {t('scan.checkIn')}
      </button>
    );
  }

  const ticket = result ? result.ticket : null;

  return (
    <section className="scan">
      <h1>{t('scan.title')}</h1>
      <StaffNav onLogout={handleLogout} />
      <ScreeningSelect
        screenings={screenings}
        value={screeningId}
        onChange={handleScreening}
      />

      {screeningId !== '' && (
        <>
          {result === null ? (
            <QrScanner onScan={handleScan} />
          ) : (
            <div
              role="status"
              className={`scan-result scan-result--${COLORS[result.result]}`}
            >
              <h2>{t(`scan.results.${result.result}`)}</h2>
              {ticket && (
                <>
                  <p>
                    {ticket.screening.movie.title} · {ticket.screening.room}
                  </p>
                  <p>{t('booking.seat', { seat: ticket.seat })}</p>
                </>
              )}
              {result.result === 'ALREADY_SCANNED' && (
                <p>
                  {t('scan.firstPassage', { time: getTime(ticket.scanned_at) })}
                </p>
              )}
              {result.result === 'OTHER_SCREENING' && (
                <p>
                  {t('scan.otherDate', {
                    day: formatDay(
                      getDay(ticket.screening.starts_at),
                      i18n.language,
                    ),
                    time: getTime(ticket.screening.starts_at),
                  })}
                </p>
              )}
              {result.result === 'ERROR' && <p>{t('scan.errorHelp')}</p>}
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setResult(null)}
              >
                {t('scan.next')}
              </button>
            </div>
          )}

          <div className="entries">
            <h2>{t('scan.list')}</h2>
            <label htmlFor="reference">{t('scan.reference')}</label>
            <input
              id="reference"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {pending.length > 0 && (
              <div className="pending">
                <p>{t('scan.pending', { count: pending.length })}</p>
                <button type="button" className="button" onClick={handleSend}>
                  {t('scan.send')}
                </button>
              </div>
            )}
            {search !== '' && found.length === 0 && <p>{t('scan.notFound')}</p>}
            <ul className="entries__list">
              {found.map((entry) => (
                <li key={entry.id}>
                  <strong>{entry.reference}</strong>
                  <span>{entry.seats.join(', ')}</span>
                  {entryStatus(entry)}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}

export default ScanPage;
