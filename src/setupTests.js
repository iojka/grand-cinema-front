// Préparation commune à tous les tests
import '@testing-library/jest-dom/vitest'; // toBeInTheDocument...
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import './i18n';

// Vide la page après chaque test pour que les tests restent indépendants
afterEach(() => {
  cleanup();
});
