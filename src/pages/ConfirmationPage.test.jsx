import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConfirmationPage from './ConfirmationPage.jsx';

// Réservation payée : 2 places au plein tarif
const CONFIRMED = {
  id: 'abc',
  reference: 'QXHZDJMA',
  status: 'CONFIRMED',
  total_amount: '22.00',
  screening: {
    id: 1,
    starts_at: '2026-10-08T20:30:00+02:00',
    room: 'Salle 9 - Événementielle',
    movie: { id: 5, title: 'La dernière séance' },
  },
  tickets: [
    { id: 't1', seat: 'A1', price: 1, unit_price: '11.00' },
    { id: 't2', seat: 'A2', price: 1, unit_price: '11.00' },
  ],
};

// Réponse de l'API simulée
function answer(data) {
  return { ok: true, json: () => Promise.resolve(data) };
}

function renderConfirmation() {
  return render(
    <MemoryRouter initialEntries={['/reservation/abc/confirmation']}>
      <Routes>
        <Route
          path="/reservation/:id/confirmation"
          element={<ConfirmationPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ConfirmationPage (US 3.3)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('récapitule la réservation payée', async () => {
    const fetchMock = vi.fn().mockResolvedValue(answer(CONFIRMED));
    vi.stubGlobal('fetch', fetchMock);

    renderConfirmation();

    expect(
      await screen.findByRole('heading', {
        name: 'Merci pour votre réservation',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('QXHZDJMA')).toBeInTheDocument();
    // Film et salle : dans le récapitulatif et sur chacun des 2 billets
    expect(screen.getAllByText('La dernière séance')).toHaveLength(3);
    expect(screen.getAllByText('Salle 9 - Événementielle')).toHaveLength(3);
    expect(screen.getByText('A1, A2')).toBeInTheDocument();
    expect(screen.getByText(/22,00/)).toBeInTheDocument();
    expect(screen.getByText(/e-mail de confirmation/)).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toContain(
      '/api/booking/bookings/abc/confirmation/',
    );
  });

  it('attend la confirmation du paiement par Stripe', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(answer({ ...CONFIRMED, status: 'PENDING' }))
        .mockResolvedValue(answer(CONFIRMED)),
    );

    renderConfirmation();

    expect(
      await screen.findByText(/Paiement en cours de validation/),
    ).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(4000);
    expect(await screen.findByText('QXHZDJMA')).toBeInTheDocument();
  });

  it('affiche un billet QR code par place (US 4.1)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(CONFIRMED)));

    renderConfirmation();

    // Critère 1 : le QR code du billet, servi par l'API
    const qrCode = await screen.findByAltText('QR code du billet A1');
    expect(qrCode.getAttribute('src')).toContain('/api/tickets/t1/qr/');
    expect(screen.getByAltText('QR code du billet A2')).toBeInTheDocument();
    // Critère 3 : chaque billet mentionne sa place
    expect(screen.getByText('Place A1')).toBeInTheDocument();
    expect(screen.getByText('Place A2')).toBeInTheDocument();
  });

  it('propose de télécharger les billets à imprimer (US 4.2)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(CONFIRMED)));

    renderConfirmation();

    // Critère 3 : depuis le lien de l'e-mail, le billet se télécharge
    const link = await screen.findByRole('link', {
      name: 'Télécharger mes billets à imprimer (PDF)',
    });
    expect(link.getAttribute('href')).toContain(
      '/api/tickets/bookings/abc/pdf/',
    );
  });

  it("n'affiche aucune confirmation sans paiement confirmé", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    renderConfirmation();

    expect(
      await screen.findByText(/Aucune réservation confirmée/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Merci pour votre réservation/)).toBeNull();
  });
});
