import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import i18n from './i18n';

// Programme vide renvoyé par l'API
function mockEmptyProgramme() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) }),
  );
}

// Affiche l'application à une adresse donnée
function renderApp(url = '/') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    i18n.changeLanguage('fr');
  });

  it("affiche l'accueil avec le programme de la semaine", async () => {
    mockEmptyProgramme();

    renderApp();

    expect(screen.getByText('Programme de la semaine')).toBeInTheDocument();
    expect(
      await screen.findByText('Aucune séance dans les 7 prochains jours.'),
    ).toBeInTheDocument();
  });

  it("passe l'interface en anglais", async () => {
    mockEmptyProgramme();

    renderApp();
    await userEvent.click(screen.getByText('English version'));

    expect(screen.getByText("This week's programme")).toBeInTheDocument();
  });

  it("mène le personnel à la page du guichet depuis l'en-tête", async () => {
    mockEmptyProgramme();

    renderApp();
    await userEvent.click(
      screen.getByRole('link', { name: 'Espace professionnel' }),
    );

    expect(
      screen.getByRole('heading', { name: 'Connexion du personnel' }),
    ).toBeInTheDocument();
  });

  it('affiche une page introuvable pour une adresse inconnue', () => {
    mockEmptyProgramme();

    renderApp('/adresse-inconnue');

    expect(screen.getByText('Page introuvable')).toBeInTheDocument();
  });

  it('mène aux mentions légales et à la confidentialité depuis le pied de page', async () => {
    mockEmptyProgramme();

    renderApp();
    const footer = screen.getByRole('contentinfo');
    expect(
      within(footer).getByRole('link', {
        name: 'Politique de confidentialité',
      }),
    ).toHaveAttribute('href', '/confidentialite');
    await userEvent.click(
      within(footer).getByRole('link', { name: 'Mentions légales' }),
    );

    expect(
      screen.getByRole('heading', { name: 'Mentions légales' }),
    ).toBeInTheDocument();
  });
});
