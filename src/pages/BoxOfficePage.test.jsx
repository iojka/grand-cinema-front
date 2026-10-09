import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BoxOfficePage from './BoxOfficePage.jsx';

// Programme de test : deux séances de la semaine
const PROGRAMME = [
  {
    id: 1,
    starts_at: '2026-10-09T20:30:00+02:00',
    room: 'Salle 1 - IMAX',
    movie: { id: 5, title: 'Le jazz à Mende' },
  },
  {
    id: 2,
    starts_at: '2026-10-10T14:00:00+02:00',
    room: 'Salle 3',
    movie: { id: 6, title: "Les robots de l'espace" },
  },
];

// Plan de la séance 1 : mêmes places et mêmes tarifs que sur le site
const SEAT_MAP = {
  ...PROGRAMME[0],
  remaining_seats: 2,
  is_full: false,
  seats: [
    { id: 1, row: 'A', number: 1, is_accessible: false, status: 'FREE' },
    { id: 2, row: 'A', number: 2, is_accessible: false, status: 'FREE' },
    { id: 3, row: 'A', number: 3, is_accessible: false, status: 'SOLD' },
  ],
  prices: [
    { id: 1, label: 'Plein tarif', amount: '13.00', requires_proof: false },
    { id: 2, label: 'Tarif réduit', amount: '10.50', requires_proof: true },
  ],
};

// Vente enregistrée renvoyée par l'API
const SALE = {
  id: 'abc',
  reference: 'LPNLT2HX',
  total_amount: '23.50',
  payment_method: 'CARD_TERMINAL',
};

// Réponse préparée de l'API avec son code HTTP
function answer(status, data) {
  return Promise.resolve({
    ok: status < 400,
    status,
    json: () => Promise.resolve(data),
  });
}

// Simule l'API : connexion, programme, plan de salle et vente au guichet
function mockApi(saleStatus = 201) {
  const fetchMock = vi.fn((url) => {
    if (url.includes('/api/auth/login/')) {
      return answer(200, { access: 'jeton', refresh: 'jeton2' });
    }
    if (url.includes('/box-office/sales/')) {
      return answer(saleStatus, saleStatus === 201 ? SALE : {});
    }
    if (url.includes('/seats/')) {
      return answer(200, SEAT_MAP);
    }
    return answer(200, PROGRAMME);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderBoxOffice() {
  return render(
    <MemoryRouter>
      <BoxOfficePage />
    </MemoryRouter>,
  );
}

// Agent déjà connecté : le jeton est gardé pour la session du navigateur
function logIn() {
  sessionStorage.setItem('token', 'jeton');
}

// Choisit la séance 1 puis les places A1 et A2
async function chooseSeats() {
  await userEvent.selectOptions(await screen.findByLabelText('Séance'), '1');
  await userEvent.click(await screen.findByLabelText('A1 libre'));
  await userEvent.click(screen.getByLabelText('A2 libre'));
}

describe('BoxOfficePage (US 7.2)', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("connecte l'agent puis le déconnecte", async () => {
    const fetchMock = mockApi();
    renderBoxOffice();

    await userEvent.type(
      screen.getByLabelText('Adresse e-mail'),
      'agent@legrandcinema.test',
    );
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByLabelText('Séance')).toBeInTheDocument();
    expect(sessionStorage.getItem('token')).toBe('jeton');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/auth/login/');
    expect(JSON.parse(options.body)).toEqual({
      email: 'agent@legrandcinema.test',
      password: 'secret',
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Se déconnecter' }),
    );

    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeVisible();
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  it('refuse une connexion incorrecte', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => answer(401, {})),
    );
    renderBoxOffice();

    await userEvent.type(
      screen.getByLabelText('Adresse e-mail'),
      'agent@legrandcinema.test',
    );
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'faux');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Connexion refusée : vérifiez votre e-mail et votre mot de passe.',
    );
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  it('affiche le même plan de salle et les mêmes tarifs que le site', async () => {
    logIn();
    mockApi();
    renderBoxOffice();

    await chooseSeats();

    expect(screen.getByLabelText('A3 vendue')).toBeInTheDocument();
    const select = screen.getByLabelText('Place A1');
    expect(select).toHaveValue('1');
    expect(
      screen.getAllByRole('option', { name: /Tarif réduit/ }),
    ).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: /Encaisser 26,00/ }),
    ).toBeInTheDocument();

    await userEvent.selectOptions(select, '2');

    expect(
      screen.getByRole('button', { name: /Encaisser 23,50/ }),
    ).toBeInTheDocument();
  });

  it('enregistre la vente avec le mode de paiement et propose les billets à imprimer', async () => {
    logIn();
    const fetchMock = mockApi();
    renderBoxOffice();

    await chooseSeats();
    await userEvent.selectOptions(screen.getByLabelText('Place A1'), '2');
    await userEvent.click(screen.getByLabelText('Carte bancaire (terminal)'));
    await userEvent.click(screen.getByRole('button', { name: /Encaisser/ }));

    expect(
      await screen.findByText('Vente enregistrée : LPNLT2HX'),
    ).toBeInTheDocument();
    const link = screen.getByRole('link', {
      name: 'Imprimer les billets (PDF)',
    });
    expect(link.getAttribute('href')).toContain(
      '/api/tickets/bookings/abc/pdf/',
    );
    const [, options] = fetchMock.mock.calls.find(([url]) =>
      url.includes('/box-office/sales/'),
    );
    expect(options.headers.Authorization).toBe('Bearer jeton');
    expect(JSON.parse(options.body)).toEqual({
      screening: 1,
      tickets: [
        { seat: 1, price: 2 },
        { seat: 2, price: 1 },
      ],
      payment_method: 'CARD_TERMINAL',
    });
  });

  it('remplace le bouton Encaisser par la vente enregistrée, puis la masque à la vente suivante', async () => {
    logIn();
    mockApi();
    renderBoxOffice();

    await chooseSeats();
    await userEvent.click(screen.getByRole('button', { name: /Encaisser/ }));

    expect(
      await screen.findByText('Vente enregistrée : LPNLT2HX'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Encaisser/ }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('A1 libre'));

    expect(
      screen.queryByText('Vente enregistrée : LPNLT2HX'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Encaisser 13,00/ }),
    ).toBeInTheDocument();
  });

  it('signale une place déjà prise en ligne et relit le plan', async () => {
    logIn();
    const fetchMock = mockApi(409);
    renderBoxOffice();

    await chooseSeats();
    await userEvent.click(screen.getByRole('button', { name: /Encaisser/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Une des places vient d'être prise.",
    );
    const seatMapCalls = fetchMock.mock.calls.filter(([url]) =>
      url.includes('/seats/'),
    );
    expect(seatMapCalls.length).toBeGreaterThan(1);
  });

  it('revient à la connexion quand la session a expiré', async () => {
    logIn();
    mockApi(401);
    renderBoxOffice();

    await chooseSeats();
    await userEvent.click(screen.getByRole('button', { name: /Encaisser/ }));

    expect(
      await screen.findByRole('button', { name: 'Se connecter' }),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem('token')).toBeNull();
  });
});
