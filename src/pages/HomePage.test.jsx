import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomePage from './HomePage.jsx';

// Programme de test : 2 jours, 3 séances, dont une complète
const jazz = {
  id: 1,
  title: 'Le jazz à Mende',
  duration_minutes: 95,
  rating: 'TP',
  version: 'VF',
  poster: null,
  is_young_audience: false,
};
const festival = { ...jazz, id: 2, title: 'Festival' };
const PROGRAMME = [
  {
    id: 1,
    starts_at: '2026-10-08T14:00:00+02:00',
    movie: jazz,
    room: 'Salle 3',
    remaining_seats: 120,
    is_full: false,
  },
  {
    id: 2,
    starts_at: '2026-10-08T20:00:00+02:00',
    movie: jazz,
    room: 'Salle 7 - VIP',
    remaining_seats: 0,
    is_full: true,
  },
  {
    id: 3,
    starts_at: '2026-10-09T18:00:00+02:00',
    movie: festival,
    room: 'Salle 1 - IMAX',
    remaining_seats: 300,
    is_full: false,
  },
];

// Remplace l'appel à l'API par une réponse préparée
function mockApi(data) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(data) }),
  );
}

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe('HomePage (US 1.1)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('affiche les films et les séances du premier jour', async () => {
    mockApi(PROGRAMME);

    renderHome();

    expect(await screen.findByText('Le jazz à Mende')).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();
    expect(screen.getByText('Salle 3')).toBeInTheDocument();
    expect(screen.getByText('120 places restantes')).toBeInTheDocument();
    expect(screen.queryByText('Festival')).not.toBeInTheDocument();
  });

  it("indique une séance complète, qui n'est pas réservable", async () => {
    mockApi(PROGRAMME);

    renderHome();

    const full = await screen.findByText('Complet');
    expect(full.closest('a')).toBeNull();
  });

  it('affiche les séances du jour choisi', async () => {
    mockApi(PROGRAMME);
    renderHome();
    const days = await screen.findByRole('navigation', { name: 'Jours' });

    await userEvent.click(within(days).getAllByRole('button')[1]);

    expect(screen.getByText('Festival')).toBeInTheDocument();
    expect(screen.queryByText('Le jazz à Mende')).not.toBeInTheDocument();
  });

  it("affiche un message si aucune séance n'est programmée", async () => {
    mockApi([]);

    renderHome();

    expect(
      await screen.findByText('Aucune séance dans les 7 prochains jours.'),
    ).toBeInTheDocument();
  });

  it("affiche un message si l'API ne répond pas", async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHome();

    expect(
      await screen.findByText('Le programme est momentanément indisponible.'),
    ).toBeInTheDocument();
  });
});
