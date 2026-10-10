import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

// Pied de page de toutes les pages : informations légales (NF6)
function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <Link to="/mentions-legales">{t('footer.legal')}</Link>
      <Link to="/confidentialite">{t('footer.privacy')}</Link>
    </footer>
  );
}

export default Footer;
