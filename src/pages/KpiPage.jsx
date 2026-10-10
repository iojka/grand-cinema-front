import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { downloadKpiCsv, getKpi } from '../api/client.js';
import KpiCard from '../components/KpiCard.jsx';
import LoginForm from '../components/LoginForm.jsx';
import StaffNav from '../components/StaffNav.jsx';
import { formatLongDay } from '../utils/programme.js';

// Indicateurs du projet pour la direction (US 8.2) : fréquentation
// comparée à la trajectoire cible et objectifs du Bloc 1
function KpiPage() {
  const { t, i18n } = useTranslation();
  // Jeton JWT, partagé avec les autres pages de l'espace professionnel
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [kpi, setKpi] = useState(null);
  const [error, setError] = useState(''); // '', forbidden, server ou export

  // Critère 3 : indicateurs recalculés par l'API à chaque ouverture
  useEffect(() => {
    if (token === null) {
      return;
    }
    getKpi(token).then((response) => {
      if (response !== null && response.status === 401) {
        // Jeton expiré : retour à la connexion
        sessionStorage.removeItem('token');
        setToken(null);
        return;
      }
      if (response !== null && response.status === 200) {
        setError('');
        setKpi(response.data);
      } else if (response !== null && response.status === 403) {
        setError('forbidden');
      } else {
        setError('server');
      }
    });
  }, [token]);

  function handleLogin(newToken) {
    sessionStorage.setItem('token', newToken);
    setToken(newToken);
  }

  function handleLogout() {
    sessionStorage.removeItem('token');
    setToken(null);
    setKpi(null);
  }

  // Critère 3 : export CSV. Un simple lien n'enverrait pas le jeton :
  // le fichier est récupéré avec fetch, puis téléchargé par un lien
  // temporaire
  async function handleExport() {
    const file = await downloadKpiCsv(token);
    if (file === null) {
      setError('export');
      return;
    }
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kpi-${kpi.today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Nombre écrit dans la langue choisie, par exemple "15 000"
  function formatNumber(number) {
    return number.toLocaleString(i18n.language);
  }

  if (token === null) {
    return (
      <section className="kpi-page">
        <h1>{t('kpi.title')}</h1>
        <LoginForm onLogin={handleLogin} />
      </section>
    );
  }

  let content = null;
  if (kpi !== null) {
    // Sans dates du festival, la part de touristes n'est pas calculée
    const noFestival = kpi.tourist_share === null;
    content = (
      <>
        <p>
          {t('kpi.since', {
            day: formatLongDay(kpi.launch_date, i18n.language),
            days: kpi.days,
          })}
        </p>
        <button type="button" className="button" onClick={handleExport}>
          {t('kpi.export')}
        </button>

        <div className="kpi-list">
          {/* Critère 1 : fréquentation et trajectoire cible */}
          <KpiCard
            title={t('kpi.attendance')}
            value={t('kpi.entries', { number: formatNumber(kpi.attendance) })}
            target={t('kpi.targetToDate', {
              number: formatNumber(kpi.target),
            })}
            reached={kpi.attendance >= kpi.target}
          >
            <p>{t('kpi.baseline', { number: formatNumber(kpi.baseline) })}</p>
          </KpiCard>

          {/* Critère 2 : objectifs secondaires du Bloc 1 */}
          <KpiCard
            title={t('kpi.online')}
            value={`${kpi.online_share} %`}
            target={t('kpi.target', { value: kpi.online_target })}
            reached={kpi.online_share >= kpi.online_target}
          />
          <KpiCard
            title={t('kpi.peak')}
            value={`${kpi.peak_rate} %`}
            target={t('kpi.target', { value: kpi.peak_target })}
            reached={kpi.peak_rate >= kpi.peak_target}
          >
            <p className="kpi__help">{t('kpi.peakHelp')}</p>
          </KpiCard>
          <KpiCard
            title={t('kpi.tourists')}
            value={noFestival ? null : `${kpi.tourist_share} %`}
            target={t('kpi.target', { value: kpi.tourist_target })}
            reached={
              noFestival ? null : kpi.tourist_share >= kpi.tourist_target
            }
          >
            <p className="kpi__help">
              {noFestival ? t('kpi.noFestival') : t('kpi.touristsHelp')}
            </p>
          </KpiCard>
        </div>
      </>
    );
  }

  return (
    <section className="kpi-page">
      <h1>{t('kpi.title')}</h1>
      <StaffNav onLogout={handleLogout} />

      {error && (
        <p role="alert" className="message">
          {t(`kpi.errors.${error}`)}
        </p>
      )}
      {content}
    </section>
  );
}

export default KpiPage;
