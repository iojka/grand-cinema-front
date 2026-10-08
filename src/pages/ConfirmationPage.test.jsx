import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import ConfirmationPage from './ConfirmationPage.jsx';

describe('ConfirmationPage (US 3.1)', () => {
  it('remercie le spectateur après le paiement', () => {
    render(
      <MemoryRouter>
        <ConfirmationPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Merci pour votre réservation' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/billet vous sera envoyé/)).toBeInTheDocument();
  });
});
