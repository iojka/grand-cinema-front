import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import LegalPage from './LegalPage.jsx';

describe('LegalPage (NF6)', () => {
  it("indique l'éditeur, l'hébergeur et l'absence de cookie de mesure", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Mentions légales' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Éditeur du site' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Hébergement' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Microsoft/)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: "Cookies et mesure d'audience" }),
    ).toBeInTheDocument();
  });
});
