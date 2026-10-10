import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from './DashboardPage.jsx';

// Tableau de bord de 3 séances, comme le renvoie l'API
const DASHBOARD = {
  screenings: [
    {
      id: 1,
      starts_at: '2026-10-06T20:00:00+02:00',
      movie: 'Le jazz à Mende',
      room: 'Salle 1 - IMAX',
      day: '2026-10-06',
      week: '2026-10-05',
      capacity: 100,
      sold: 10,
      fill_rate: 10,
    },
    {
      id: 2,
      starts_at: '2026-10-07T14:00:00+02:00',
      movie: "Les robots de l'espace",
      room: 'Salle 3',
      day: '2026-10-07',
      week: '2026-10-05',
      capacity: 50,
      sold: 25,
      fill_rate: 50,
    },
    {
      id: 3,
      starts_at: '2026-10-08T20:30:00+02:00',
      movie: "Minuit sur l'Aubrac",
      room: 'Salle 7 - VIP',
      day: '2026-10-08',
      week: '2026-10-05',
      capacity: 20,
      sold: 18,
      fill_rate: 90,
    },
  ],
  rooms: [
    { label: 'Salle 1 - IMAX', capacity: 100, sold: 10, fill_rate: 10 },
    { label: 'Salle 3', capacity: 50, sold: 25, fill_rate: 50 },
    { label: 'Salle 7 - VIP', capacity: 20, sold: 18, fill_rate: 90 },
  ],
  days: [
    { label: '2026-10-06', capacity: 100, sold: 10, fill_rate: 10 },
    { label: '2026-10-07', capacity: 50, sold: 25, fill_rate: 50 },
    { label: '2026-10-08', capacity: 20, sold: 18, fill_rate: 90 },
  ],
  weeks: [{ label: '2026-10-05', capacity: 170, sold: 53, fill_rate: 31 }],
  web: 40,
  box_office: 13,
};

// Réponse préparée de l'API avec son code HTTP
function answer(status, data) {
  return Promise.resolve({
    ok: status < 400,
    status,
    json: () => Promise.resolve(data),
  });
}

// Isabelle connectée qui ouvre le tableau de bord
function renderDashboard() {
  sessionStorage.setItem('token', 'jeton');
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage (US 8.1)', () => {
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
      vi.fn(() => answer(200, DASHBOARD)),
    );
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Connexion du personnel' }),
    ).toBeInTheDocument();
  });

  it('affiche le taux par séance, par salle, par jour et par semaine', async () => {
    const fetchMock = vi.fn(() => answer(200, DASHBOARD));
    vi.stubGlobal('fetch', fetchMock);

    renderDashboard();

    const screenings = await screen.findByRole('table', { name: 'Par séance' });
    const jazz = within(screenings).getByText('Le jazz à Mende').closest('tr');
    expect(within(jazz).getByText('10 / 100')).toBeInTheDocument();
    expect(within(jazz).getByText('10 %')).toBeInTheDocument();
    const rooms = screen.getByRole('table', { name: 'Par salle' });
    const room = within(rooms).getByText('Salle 3').closest('tr');
    expect(within(room).getByText('50 %')).toBeInTheDocument();
    const days = screen.getByRole('table', { name: 'Par jour' });
    expect(within(days).getByText('mer. 7 oct.')).toBeInTheDocument();
    const weeks = screen.getByRole('table', { name: 'Par semaine' });
    expect(
      within(weeks).getByText('Semaine du lun. 5 oct.'),
    ).toBeInTheDocument();
    expect(within(weeks).getByText('31 %')).toBeInTheDocument();
    // Par défaut : les 7 derniers jours, aujourd'hui compris
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain(
      '/api/dashboard/occupancy/?start=2026-10-03&end=2026-10-09',
    );
    expect(options.headers.Authorization).toBe('Bearer jeton');
  });

  it('distingue les taux faibles, moyens et élevés par un code couleur', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => answer(200, DASHBOARD)),
    );

    renderDashboard();

    const screenings = await screen.findByRole('table', { name: 'Par séance' });
    expect(within(screenings).getByText('10 %')).toHaveClass('rate--low');
    expect(within(screenings).getByText('50 %')).toHaveClass('rate--medium');
    expect(within(screenings).getByText('90 %')).toHaveClass('rate--high');
    expect(screen.getByText('Moins de 20 %')).toBeInTheDocument();
  });

  it('compare les ventes web et guichet de la période choisie', async () => {
    const fetchMock = vi.fn(() => answer(200, DASHBOARD));
    vi.stubGlobal('fetch', fetchMock);

    renderDashboard();

    expect(
      await screen.findByText('Ventes en ligne : 40 (75 %)'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Ventes au guichet : 13 (25 %)'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Du'), {
      target: { value: '2026-10-01' },
    });
    fireEvent.change(screen.getByLabelText('Au'), {
      target: { value: '2026-10-31' },
    });

    await vi.waitFor(() => {
      const urls = fetchMock.mock.calls.map(([url]) => url);
      expect(
        urls.some((url) => url.includes('start=2026-10-01&end=2026-10-31')),
      ).toBe(true);
    });
  });

  it('signale un compte sans accès au tableau de bord', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => answer(403, {})),
    );

    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Votre compte n'a pas accès au tableau de bord.",
    );
  });

  it("propose le tableau de bord dans le menu de l'espace professionnel", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => answer(200, DASHBOARD)),
    );

    renderDashboard();

    expect(
      await screen.findByRole('link', { name: 'Tableau de bord' }),
    ).toHaveAttribute('href', '/tableau-de-bord');
  });
});
