import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MoviePage from './MoviePage.jsx';

// Fiche film de test : sans affiche, 2 séances dont une complète
const MOVIE = {
  id: 1,
  title: 'Le jazz à Mende',
  synopsis: 'Une musicienne retrouve le goût de jouer.',
  duration_minutes: 95,
  rating: 'TP',
  version: 'VF',
  poster: null,
  is_young_audience: false,
  screenings: [
    {
      id: 1,
      starts_at: '2026-10-08T14:00:00+02:00',
      room: 'Salle 3',
      remaining_seats: 120,
      is_full: false,
    },
    {
      id: 2,
      starts_at: '2026-10-09T20:00:00+02:00',
      room: 'Salle 7 - VIP',
      remaining_seats: 0,
      is_full: true,
    },
  ],
};

// Remplace l'appel à l'API par une réponse préparée
function mockApi(data) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(data) }),
  );
}

// Affiche la page à l'adresse de la fiche du film 1
function renderMovie() {
  return render(
    <MemoryRouter initialEntries={['/films/1']}>
      <Routes>
        <Route path="/films/:id" element={<MoviePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MoviePage (US 1.3)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('affiche la fiche complète du film', async () => {
    mockApi(MOVIE);

    renderMovie();

    expect(
      await screen.findByRole('heading', { name: 'Le jazz à Mende' }),
    ).toBeInTheDocument();
    expect(screen.getByText('VF · 1 h 35 · Tous publics')).toBeInTheDocument();
    expect(
      screen.getByText('Une musicienne retrouve le goût de jouer.'),
    ).toBeInTheDocument();
  });

  it('ouvre le plan de salle quand on clique sur une séance', async () => {
    mockApi(MOVIE);

    renderMovie();

    const time = await screen.findByText('14:00');
    expect(time.closest('a')).toHaveAttribute('href', '/seances/1');
    expect(screen.getByText('Complet').closest('a')).toBeNull();
  });

  it("affiche un visuel par défaut si le film n'a pas d'affiche", async () => {
    mockApi(MOVIE);

    renderMovie();

    const image = await screen.findByRole('img', {
      name: 'Affiche non disponible',
    });
    expect(image).toHaveAttribute('src', '/default-poster.svg');
  });

  it("affiche un message si le film n'existe pas", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    renderMovie();

    expect(
      await screen.findByText('Ce film est introuvable.'),
    ).toBeInTheDocument();
  });
});
