import { render, screen } from '@testing-library/react';
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

  it('affiche une page introuvable pour une adresse inconnue', () => {
    mockEmptyProgramme();

    renderApp('/adresse-inconnue');

    expect(screen.getByText('Page introuvable')).toBeInTheDocument();
  });
});
