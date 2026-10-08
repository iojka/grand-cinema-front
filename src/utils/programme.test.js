import { describe, expect, it } from 'vitest';
import {
  areSideBySide,
  formatDuration,
  formatLongDay,
  formatPrice,
  getDay,
  getTime,
  groupByDay,
  groupByMovie,
  groupByRow,
} from './programme.js';

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

describe('fiche film (US 1.3)', () => {
  it('affiche la durée en heures et minutes', () => {
    expect(formatDuration(95)).toBe('1 h 35');
    expect(formatDuration(120)).toBe('2 h 00');
  });
});

describe('plan de salle (US 2.1)', () => {
  it("regroupe les places par rangée, dans l'ordre", () => {
    const seats = [
      { id: 1, row: 'A', number: 1 },
      { id: 2, row: 'A', number: 2 },
      { id: 3, row: 'B', number: 1 },
    ];

    const rows = groupByRow(seats);

    expect(rows.map((item) => item.row)).toEqual(['A', 'B']);
    expect(rows[0].seats).toHaveLength(2);
  });
});

describe('choix des places (US 2.2)', () => {
  it('vérifie que les places sont côte à côte', () => {
    const a1 = { row: 'A', number: 1 };
    const a2 = { row: 'A', number: 2 };
    const a3 = { row: 'A', number: 3 };
    const b2 = { row: 'B', number: 2 };

    expect(areSideBySide([a2, a1])).toBe(true);
    expect(areSideBySide([a1, a3])).toBe(false);
    expect(areSideBySide([a1, b2])).toBe(false);
  });

  it('affiche un prix en euros', () => {
    expect(formatPrice('22.00', 'fr')).toMatch(/22,00/);
  });
});

describe('billet (US 4.1)', () => {
  it('écrit le jour en entier, sans abréviation', () => {
    expect(formatLongDay('2026-10-08', 'fr')).toBe('jeudi 8 octobre');
  });
});
