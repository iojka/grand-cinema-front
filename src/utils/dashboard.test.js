import { describe, expect, it } from 'vitest';
import { percent, rateLevel } from './dashboard.js';

describe('tableau de bord (US 8.1)', () => {
  it('classe un taux de remplissage pour le code couleur', () => {
    expect(rateLevel(0)).toBe('low');
    expect(rateLevel(19)).toBe('low');
    expect(rateLevel(20)).toBe('medium');
    expect(rateLevel(80)).toBe('medium');
    expect(rateLevel(81)).toBe('high');
  });

  it('calcule une part en pourcentage, arrondie', () => {
    expect(percent(40, 53)).toBe(75);
    expect(percent(13, 53)).toBe(25);
    expect(percent(0, 0)).toBe(0); // aucune vente sur la période
  });
});
