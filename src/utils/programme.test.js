import { describe, expect, it } from 'vitest';
import { getDay, getTime, groupByDay, groupByMovie } from './programme.js';

// Trois séances comme les renvoie l'API (déjà triées par date et heure)
const jazz = { id: 1, title: 'Le jazz à Mende' };
const festival = { id: 2, title: 'Festival' };
const SCREENINGS = [
  { id: 1, starts_at: '2026-10-08T14:00:00+02:00', movie: jazz },
  { id: 2, starts_at: '2026-10-08T20:00:00+02:00', movie: festival },
  { id: 3, starts_at: '2026-10-09T18:00:00+02:00', movie: jazz },
];

describe('programme (US 1.1)', () => {
  it("lit le jour et l'heure de la séance", () => {
    expect(getDay('2026-10-08T14:00:00+02:00')).toBe('2026-10-08');
    expect(getTime('2026-10-08T14:00:00+02:00')).toBe('14:00');
  });

  it("regroupe les séances par jour, dans l'ordre", () => {
    const days = groupByDay(SCREENINGS);

    expect(days.map((day) => day.date)).toEqual(['2026-10-08', '2026-10-09']);
    expect(days[0].screenings).toHaveLength(2);
  });

  it("regroupe les séances d'un jour par film", () => {
    const movies = groupByMovie(SCREENINGS);

    expect(movies.map((item) => item.movie.title)).toEqual([
      'Le jazz à Mende',
      'Festival',
    ]);
    expect(movies[0].screenings).toHaveLength(2);
  });
});
