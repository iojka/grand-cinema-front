import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import i18n from './i18n';

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

  it("affiche l'accueil et indique que l'API est disponible", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    renderApp();

    expect(screen.getByText('Bienvenue au Grand Cinéma')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText('Le service de réservation est disponible.'),
      ).toBeInTheDocument(),
    );
  });

  it("affiche un message clair si l'API ne répond pas", async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    renderApp();

    await waitFor(() =>
      expect(
        screen.getByText(
          'Le service de réservation est momentanément indisponible.',
        ),
      ).toBeInTheDocument(),
    );
  });

  it("passe l'interface en anglais", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    renderApp();
    await userEvent.click(screen.getByText('English version'));

    expect(screen.getByText('Welcome to Le Grand Cinéma')).toBeInTheDocument();
  });

  it('affiche une page introuvable pour une adresse inconnue', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    renderApp('/adresse-inconnue');

    expect(screen.getByText('Page introuvable')).toBeInTheDocument();
  });
});
