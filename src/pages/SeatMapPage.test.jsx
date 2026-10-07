import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SeatMapPage from './SeatMapPage.jsx';

// Plan de salle de test : 3 places, une de chaque état
const SEAT_MAP = {
  id: 1,
  starts_at: '2026-10-08T20:30:00+02:00',
  room: 'Salle 3',
  remaining_seats: 1,
  is_full: false,
  movie: { id: 5, title: 'Le jazz à Mende' },
  seats: [
    { id: 1, row: 'A', number: 1, is_accessible: true, status: 'FREE' },
    { id: 2, row: 'A', number: 2, is_accessible: false, status: 'HELD' },
    { id: 3, row: 'A', number: 3, is_accessible: false, status: 'SOLD' },
  ],
};

// Fiche du film : la séance 1 (complète) et deux autres séances
const MOVIE = {
  id: 5,
  title: 'Le jazz à Mende',
  screenings: [
    { id: 1, starts_at: '2026-10-08T20:30:00+02:00', is_full: true },
    {
      id: 7,
      starts_at: '2026-10-09T14:00:00+02:00',
      room: 'Salle 3',
      remaining_seats: 50,
      is_full: false,
    },
    { id: 8, starts_at: '2026-10-09T20:30:00+02:00', is_full: true },
  ],
};

// Réponse préparée de l'API
function response(data) {
  return { ok: true, json: () => Promise.resolve(data) };
}

// Affiche la page à l'adresse du plan de salle de la séance 1
function renderSeatMap() {
  return render(
    <MemoryRouter initialEntries={['/seances/1']}>
      <Routes>
        <Route path="/seances/:id" element={<SeatMapPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SeatMapPage (US 2.1)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('affiche les places libres, bloquées et vendues avec la légende', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(SEAT_MAP)));

    renderSeatMap();

    expect(await screen.findByLabelText('A1 libre')).toBeInTheDocument();
    expect(screen.getByLabelText('A2 bloquée')).toBeInTheDocument();
    expect(screen.getByLabelText('A3 vendue')).toBeInTheDocument();
    expect(screen.getByText('Libre')).toBeInTheDocument();
    expect(screen.getByText('Bloquée temporairement')).toBeInTheDocument();
    expect(screen.getByText('Vendue')).toBeInTheDocument();
  });

  it('met à jour le plan toutes les 4 secondes', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const sold = {
      ...SEAT_MAP,
      seats: SEAT_MAP.seats.map((seat) => ({ ...seat, status: 'SOLD' })),
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(SEAT_MAP))
      .mockResolvedValue(response(sold));
    vi.stubGlobal('fetch', fetchMock);

    renderSeatMap();
    await screen.findByLabelText('A1 libre');
    await vi.advanceTimersByTimeAsync(4000);

    expect(await screen.findByLabelText('A1 vendue')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("signale une séance complète et propose d'autres séances", async () => {
    const full = { ...SEAT_MAP, remaining_seats: 0, is_full: true };
    vi.stubGlobal(
      'fetch',
      vi.fn((url) =>
        Promise.resolve(response(url.includes('/seats/') ? full : MOVIE)),
      ),
    );

    renderSeatMap();

    expect(
      await screen.findByText('Cette séance est complète.'),
    ).toBeInTheDocument();
    const other = await screen.findByText('14:00');
    expect(other.closest('a')).toHaveAttribute('href', '/seances/7');
    expect(screen.queryByText('20:30', { selector: 'strong' })).toBeNull();
  });

  it("affiche un message si la séance n'est pas disponible", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    renderSeatMap();

    expect(
      await screen.findByText("Cette séance n'est pas disponible."),
    ).toBeInTheDocument();
  });
});
