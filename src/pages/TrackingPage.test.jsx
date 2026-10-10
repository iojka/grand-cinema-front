import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TrackingPage from './TrackingPage.jsx';

// Séances du jour avec leurs ventes, comme les renvoie l'API
const TRACKING = [
  {
    id: 1,
    starts_at: '2026-10-09T14:00:00+02:00',
    movie: 'Le jazz à Mende',
    room: 'Salle 1 - IMAX',
    capacity: 120,
    sold: 30,
    web: 20,
    box_office: 10,
    fill_rate: 25,
  },
  {
    id: 2,
    starts_at: '2026-10-09T20:30:00+02:00',
    movie: "Les robots de l'espace",
    room: 'Salle 3',
    capacity: 80,
    sold: 60,
    web: 50,
    box_office: 10,
    fill_rate: 75,
  },
];

// Réponse préparée de l'API
function answer(data) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });
}

// Agent connecté qui ouvre le suivi
function renderTracking() {
  sessionStorage.setItem('token', 'jeton');
  render(
    <MemoryRouter>
      <TrackingPage />
    </MemoryRouter>,
  );
}

// Ligne du tableau d'une séance, trouvée par le titre du film
async function rowOf(title) {
  return (await screen.findByText(title)).closest('tr');
}

describe('TrackingPage (US 7.1)', () => {
  beforeEach(() => {
    // Les tests se passent le 9 octobre 2026 à 10 h
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 9, 9, 10, 0));
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('demande la connexion du personnel', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => answer([])),
    );
    render(
      <MemoryRouter>
        <TrackingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Connexion du personnel' }),
    ).toBeInTheDocument();
  });

  it('affiche pour chaque séance du jour les ventes, la capacité, le taux et la répartition', async () => {
    const fetchMock = vi.fn(() => answer(TRACKING));
    vi.stubGlobal('fetch', fetchMock);

    renderTracking();

    const row = await rowOf('Le jazz à Mende');
    expect(within(row).getByText('14:00')).toBeInTheDocument();
    expect(within(row).getByText('Salle 1 - IMAX')).toBeInTheDocument();
    expect(within(row).getByText('30 / 120')).toBeInTheDocument();
    expect(within(row).getByText('25 %')).toBeInTheDocument();
    expect(within(row).getByText('20')).toBeInTheDocument();
    expect(within(row).getByText('10')).toBeInTheDocument();
    // Séances du jour : la date d'aujourd'hui est envoyée à l'API
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/booking/tracking/?date=2026-10-09');
    expect(options.headers.Authorization).toBe('Bearer jeton');
  });

  it('met les chiffres à jour toutes les 30 secondes', async () => {
    const after = TRACKING.map((item) => ({ ...item, sold: item.sold + 1 }));
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(answer(TRACKING))
      .mockReturnValue(answer(after));
    vi.stubGlobal('fetch', fetchMock);

    renderTracking();
    await screen.findByText('30 / 120');
    await vi.advanceTimersByTimeAsync(30000);

    expect(await screen.findByText('31 / 120')).toBeInTheDocument();
  });

  it('affiche les séances de la date choisie', async () => {
    const fetchMock = vi.fn(() => answer(TRACKING));
    vi.stubGlobal('fetch', fetchMock);

    renderTracking();
    await screen.findByText('Le jazz à Mende');
    fireEvent.change(screen.getByLabelText('Date'), {
      target: { value: '2026-10-10' },
    });

    await vi.waitFor(() => {
      const urls = fetchMock.mock.calls.map(([url]) => url);
      expect(urls.some((url) => url.includes('date=2026-10-10'))).toBe(true);
    });
  });

  it('affiche seulement les séances de la salle choisie', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => answer(TRACKING)),
    );

    renderTracking();
    await screen.findByText('Le jazz à Mende');
    await userEvent.selectOptions(screen.getByLabelText('Salle'), 'Salle 3');

    expect(screen.queryByText('Le jazz à Mende')).not.toBeInTheDocument();
    expect(screen.getByText("Les robots de l'espace")).toBeInTheDocument();
  });

  it('signale un jour sans séance', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => answer([])),
    );

    renderTracking();

    expect(
      await screen.findByText('Aucune séance ce jour-là.'),
    ).toBeInTheDocument();
  });

  it("propose le suivi dans le menu de l'espace professionnel", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => answer(TRACKING)),
    );

    renderTracking();

    expect(
      await screen.findByRole('link', { name: 'Suivi des réservations' }),
    ).toHaveAttribute('href', '/suivi');
  });
});
