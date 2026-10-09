import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

/**
 * Menu de l'espace professionnel : guichet, contrôle, déconnexion
 * @param {object} props onLogout (déconnexion de l'agent)
 */
function StaffNav({ onLogout }) {
  const { t } = useTranslation();

  return (
    <nav className="staff-nav" aria-label={t('header.staff')}>
      <Link to="/guichet">{t('staff.boxOffice')}</Link>
      <Link to="/controle">{t('staff.scan')}</Link>
      <button
        type="button"
        className="button button--secondary"
        onClick={onLogout}
      >
        {t('login.logout')}
      </button>
    </nav>
  );
}

export default StaffNav;
