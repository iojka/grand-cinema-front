import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BookingPage from './BookingPage.jsx';

// Panier de test : A1 et A2 au plein tarif dans une salle IMAX (+2 €)
const BOOKING = {
  id: 'abc',
  reference: 'LPNLT2HX',
  status: 'PENDING',
  expires_at: '2026-10-08T20:40:00+02:00',
  total_amount: '26.00',
  screening: {
    id: 1,
    starts_at: '2026-10-08T20:30:00+02:00',
    room: 'Salle 1 - IMAX',
    movie: { id: 5, title: 'Le jazz à Mende' },
  },
  tickets: [
    { id: 't1', seat: 'A1', price: 1, unit_price: '13.00' },
    { id: 't2', seat: 'A2', price: 1, unit_price: '13.00' },
  ],
  prices: [
    { id: 1, label: 'Plein tarif', amount: '13.00', requires_proof: false },
    { id: 2, label: 'Tarif réduit', amount: '10.50', requires_proof: true },
  ],
};

// Panier après le passage de A1 au tarif réduit
const UPDATED = {
  ...BOOKING,
  total_amount: '23.50',
  tickets: [
    { id: 't1', seat: 'A1', price: 2, unit_price: '10.50' },
    { id: 't2', seat: 'A2', price: 1, unit_price: '13.00' },
  ],
};

// Adresse de paiement renvoyée par l'API (page Stripe de test)
const STRIPE_URL = 'https://checkout.stripe.com/c/pay/cs_test_123';

// Simule l'API : GET du panier, PATCH du tarif d'une place, POST du
// paiement
function mockApi(booking) {
  const fetchMock = vi.fn((url, options) => {
    if (options && options.method === 'DELETE') {
      return Promise.resolve({ ok: true, status: 204 });
    }
    let data = booking;
    if (options && options.method === 'POST') {
      data = { url: STRIPE_URL };
    }
    if (options && options.method === 'PATCH') {
      data = url.includes('/customer/') ? booking : UPDATED;
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderBooking(path = '/reservation/abc') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reservation/:id" element={<BookingPage />} />
        <Route path="/seances/:id" element={<p>Page plan de salle</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('BookingPage (US 2.3)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('propose les tarifs paramétrés pour chaque place', async () => {
    mockApi(BOOKING);

    renderBooking();

    const select = await screen.findByLabelText('Place A1');
    expect(select).toHaveValue('1');
    expect(screen.getAllByRole('option')).toHaveLength(4); // 2 places x 2
    expect(screen.getByText(/Total : 26,00/)).toBeInTheDocument();
  });

  it('recalcule le total et signale le justificatif', async () => {
    const fetchMock = mockApi(BOOKING);
    renderBooking();

    await userEvent.selectOptions(
      await screen.findByLabelText('Place A1'),
      '2',
    );

    expect(await screen.findByText(/Total : 23,50/)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Un justificatif sera demandé à l'entrée pour les tarifs réduits.",
      ),
    ).toBeInTheDocument();
    const [url, options] = fetchMock.mock.calls.find(
      ([, request]) => request && request.method === 'PATCH',
    );
    expect(url).toContain('/api/booking/bookings/abc/tickets/t1/');
    expect(JSON.parse(options.body)).toEqual({ price: 2 });
  });

  it('annule le panier pour changer de places', async () => {
    const fetchMock = mockApi(BOOKING);
    renderBooking();

    await userEvent.click(await screen.findByText('Modifier mes places'));

    expect(await screen.findByText('Page plan de salle')).toBeInTheDocument();
    const [url] = fetchMock.mock.calls.find(
      ([, request]) => request && request.method === 'DELETE',
    );
    expect(url).toContain('/api/booking/bookings/abc/');
  });

  it('signale la fin du blocage sans recharger la page', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const soon = new Date(Date.now() + 2000).toISOString();
    mockApi({ ...BOOKING, expires_at: soon });

    renderBooking();
    await screen.findByLabelText('Place A1');
    await vi.advanceTimersByTimeAsync(2000);

    expect(
      await screen.findByText(
        'Votre blocage a expiré : vos places ont été libérées.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Revenir au plan de salle')).toHaveAttribute(
      'href',
      '/seances/1',
    );
  });

  it("affiche un message si le panier n'existe plus", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    renderBooking();

    expect(
      await screen.findByText(
        'Votre blocage a expiré : vos places ont été libérées.',
      ),
    ).toBeInTheDocument();
  });
});

// Remplit le formulaire des coordonnées (US 2.4)
async function fillCustomer(email, confirmation) {
  await userEvent.type(await screen.findByLabelText('Nom'), 'Marine Crognier');
  await userEvent.type(screen.getByLabelText('Adresse e-mail'), email);
  await userEvent.type(
    screen.getByLabelText("Confirmation de l'adresse e-mail"),
    confirmation,
  );
  await userEvent.type(screen.getByLabelText('Code postal'), '48000');
}

// Appels PATCH envoyés pour les coordonnées
function customerCalls(fetchMock) {
  return fetchMock.mock.calls.filter(([url]) => url.includes('/customer/'));
}

describe('BookingPage (US 2.4)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('enregistre les coordonnées du spectateur sans compte', async () => {
    const fetchMock = mockApi(BOOKING);
    renderBooking();

    await fillCustomer('marine@example.com', 'marine@example.com');
    await userEvent.click(screen.getByText('Valider mes coordonnées'));

    expect(
      await screen.findByText('Vos coordonnées sont enregistrées.'),
    ).toBeInTheDocument();
    const [, options] = customerCalls(fetchMock)[0];
    expect(JSON.parse(options.body)).toEqual({
      customer_name: 'Marine Crognier',
      customer_email: 'marine@example.com',
      email_confirmation: 'marine@example.com',
      customer_postcode: '48000',
      customer_country: '',
    });
  });

  it("signale une adresse e-mail non valide avant l'envoi", async () => {
    const fetchMock = mockApi(BOOKING);
    renderBooking();

    await fillCustomer('marine.example.com', 'marine.example.com');
    await userEvent.click(screen.getByText('Valider mes coordonnées'));

    expect(
      screen.getByText("L'adresse e-mail n'est pas valide."),
    ).toBeInTheDocument();
    expect(customerCalls(fetchMock)).toHaveLength(0);
  });

  it("affiche l'information RGPD et le lien vers la politique", async () => {
    mockApi(BOOKING);
    renderBooking();

    expect(await screen.findByText(/conservées 3 ans/)).toBeInTheDocument();
    const link = screen.getByRole('link', {
      name: 'Politique de confidentialité',
    });
    expect(link).toHaveAttribute('href', '/confidentialite');
    // Nouvel onglet : le panier et le formulaire restent ouverts
    expect(link).toHaveAttribute('target', '_blank');
  });
});

// Panier dont les coordonnées sont déjà enregistrées (US 2.4)
const WITH_CUSTOMER = {
  ...BOOKING,
  customer_name: 'Marine Crognier',
  customer_email: 'marine@example.com',
  customer_postcode: '48000',
  customer_country: '',
};

describe('BookingPage (US 3.1)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('propose le paiement une fois les coordonnées enregistrées', async () => {
    mockApi(BOOKING);
    renderBooking();

    await fillCustomer('marine@example.com', 'marine@example.com');
    expect(screen.queryByRole('button', { name: /^Payer/ })).toBeNull();
    await userEvent.click(screen.getByText('Valider mes coordonnées'));

    expect(
      await screen.findByRole('button', { name: /^Payer/ }),
    ).toBeInTheDocument();
  });

  it('redirige vers la page de paiement sécurisée Stripe', async () => {
    const fetchMock = mockApi(WITH_CUSTOMER);
    // Faux window.location : on vérifie la redirection sans quitter le test
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    renderBooking();

    await userEvent.click(
      await screen.findByRole('button', { name: /^Payer/ }),
    );

    const [url] = fetchMock.mock.calls.find(
      ([, request]) => request && request.method === 'POST',
    );
    expect(url).toContain('/api/payment/bookings/abc/checkout/');
    expect(assign).toHaveBeenCalledWith(STRIPE_URL);
  });

  it('signale un paiement abandonné et permet de réessayer', async () => {
    mockApi(WITH_CUSTOMER);

    renderBooking('/reservation/abc?paiement=annule');

    expect(
      await screen.findByText(/Le paiement n'a pas abouti/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Payer/ })).toBeInTheDocument();
  });
});
