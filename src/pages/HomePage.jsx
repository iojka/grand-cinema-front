import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiHealth } from '../api/client.js';

// Page d'accueil provisoire : le programme arrivera avec l'US 1.1
function HomePage() {
  const { t } = useTranslation();
  const [apiOk, setApiOk] = useState(null); // null = en cours de chargement

  useEffect(() => {
    getApiHealth().then((ok) => setApiOk(ok));
  }, []);

  let message = t('home.loading');
  if (apiOk === true) {
    message = t('home.apiOk');
  } else if (apiOk === false) {
    message = t('home.apiKo');
  }

  return (
    <section>
      <h1>{t('home.welcome')}</h1>
      <p role="status">{message}</p>
    </section>
  );
}

export default HomePage;
