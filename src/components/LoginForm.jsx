import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { login } from '../api/client.js';

/**
 * Formulaire de connexion du personnel (US 9.1), utilisé par le guichet
 * @param {object} props onLogin (reçoit le jeton JWT si la connexion
 *   réussit)
 */
function LoginForm({ onLogin }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const token = await login(email, password);
    if (token === null) {
      setError(true);
    } else {
      onLogin(token);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h2>{t('login.title')}</h2>
      <label htmlFor="login-email">{t('login.email')}</label>
      <input
        id="login-email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <label htmlFor="login-password">{t('login.password')}</label>
      <input
        id="login-password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {error && (
        <p role="alert" className="message">
          {t('login.error')}
        </p>
      )}
      <button type="submit" className="button">
        {t('login.submit')}
      </button>
    </form>
  );
}

export default LoginForm;
