import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

function Header() {
  const { t, i18n } = useTranslation();

  const switchLanguage = () => {
    const newLanguage = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLanguage);
    document.documentElement.lang = newLanguage;
  };

  return (
    <header className="header">
      <Link to="/" className="header__title">
        {t('header.title')}
      </Link>
      <nav className="header__nav">
        <Link to="/">{t('header.home')}</Link>
        {/* Accès du personnel : guichet (US 7.2), connexion obligatoire */}
        <Link to="/guichet">{t('header.staff')}</Link>
        <button type="button" onClick={switchLanguage}>
          {t('header.switchLanguage')}
        </button>
      </nav>
    </header>
  );
}

export default Header;
