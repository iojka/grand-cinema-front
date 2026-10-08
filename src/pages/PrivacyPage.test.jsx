import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import PrivacyPage from './PrivacyPage.jsx';

describe('PrivacyPage (US 2.4)', () => {
  it('indique les finalités et la durée de conservation', () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Politique de confidentialité' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Finalités/)).toBeInTheDocument();
    expect(screen.getByText(/Durée de conservation/)).toBeInTheDocument();
  });
});
