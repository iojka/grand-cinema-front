import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ScanPage from './ScanPage.jsx';

// La caméra est remplacée par un bouton : on teste la page, pas la
// bibliothèque de lecture des QR codes
vi.mock('../components/QrScanner.jsx', () => ({
  default: ({ onScan }) => (
    <button type="button" onClick={() => onScan('code-du-billet')}>
      Simuler un scan
    </button>
  ),
}));

// Séance contrôlée par l'agent
const SCREENING = {
  id: 1,
  starts_at: '2026-10-09T20:30:00+02:00',
  room: 'Salle 1 - IMAX',
  movie: { id: 5, title: 'Le jazz à Mende' },
};

// Billet lu dans le QR code
const TICKET = {
  reference: 'LPNLT2HX',
  seat: 'A1',
  scanned_at: '2026-10-09T20:12:00+02:00',
  screening: SCREENING,
};

// Liste de la séance (mode dégradé)
const ENTRIES = [
  {
    id: 'abc',
    reference: 'LPNLT2HX',
    seats: ['A1', 'A2'],
    scanned_at: null,
  },
];

// Réservation après la validation de l'entrée
const CHECKED_IN = { ...ENTRIES[0], scanned_at: '2026-10-09T20:15:00+02:00' };

// Réponse préparée de l'API avec son code HTTP
function answer(status, data) {
  return Promise.resolve({
    ok: status < 400,
    status,
    json: () => Promise.resolve(data),
  });
}

// Simule l'API : programme, liste de la séance, scan et validation
function mockApi(scanResult) {
  const fetchMock = vi.fn((url) => {
    if (url.includes('/scan/')) {
      return answer(200, scanResult);
    }
    if (url.includes('/entries/')) {
      return answer(200, ENTRIES);
    }
    if (url.includes('/checkin/')) {
      return answer(200, CHECKED_IN);
    }
    return answer(200, [SCREENING]);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

// Agent connecté qui ouvre la page et choisit la séance 1
async function openScreening() {
  sessionStorage.setItem('token', 'jeton');
  render(
    <MemoryRouter>
      <ScanPage />
    </MemoryRouter>,
  );
  await userEvent.selectOptions(await screen.findByLabelText('Séance'), '1');
}

describe('ScanPage (US 7.3)', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('demande la connexion du personnel', () => {
    mockApi();
    render(
      <MemoryRouter>
        <ScanPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Connexion du personnel' }),
    ).toBeInTheDocument();
  });

  it('affiche un écran vert avec le film, la salle et la place', async () => {
    const fetchMock = mockApi({ result: 'VALID', ticket: TICKET });
    await openScreening();

    await userEvent.click(screen.getByText('Simuler un scan'));

    const panel = await screen.findByRole('status');
    expect(panel).toHaveClass('scan-result--green');
    expect(within(panel).getByText('Entrée validée')).toBeInTheDocument();
    expect(within(panel).getByText(/Le jazz à Mende/)).toBeInTheDocument();
    expect(within(panel).getByText(/Salle 1 - IMAX/)).toBeInTheDocument();
    expect(within(panel).getByText('Place A1')).toBeInTheDocument();
    const [, options] = fetchMock.mock.calls.find(([url]) =>
      url.includes('/scan/'),
    );
    expect(options.headers.Authorization).toBe('Bearer jeton');
    expect(JSON.parse(options.body)).toEqual({
      screening: 1,
      code: 'code-du-billet',
    });

    // L'agent passe au billet suivant : la caméra revient
    await userEvent.click(
      screen.getByRole('button', { name: 'Billet suivant' }),
    );
    expect(screen.getByText('Simuler un scan')).toBeInTheDocument();
  });

  it("affiche un écran rouge avec l'heure du 1er passage", async () => {
    mockApi({ result: 'ALREADY_SCANNED', ticket: TICKET });
    await openScreening();

    await userEvent.click(screen.getByText('Simuler un scan'));

    const panel = await screen.findByRole('status');
    expect(panel).toHaveClass('scan-result--red');
    expect(within(panel).getByText('Billet déjà scanné')).toBeInTheDocument();
    expect(
      within(panel).getByText('Premier passage à 20:12'),
    ).toBeInTheDocument();
  });

  it('affiche un écran orange pour une autre séance', async () => {
    const other = {
      ...SCREENING,
      id: 2,
      starts_at: '2026-10-10T14:00:00+02:00',
    };
    mockApi({
      result: 'OTHER_SCREENING',
      ticket: { ...TICKET, scanned_at: null, screening: other },
    });
    await openScreening();

    await userEvent.click(screen.getByText('Simuler un scan'));

    const panel = await screen.findByRole('status');
    expect(panel).toHaveClass('scan-result--orange');
    expect(within(panel).getByText('Autre séance')).toBeInTheDocument();
    expect(within(panel).getByText(/14:00/)).toBeInTheDocument();
  });

  it('refuse un faux billet', async () => {
    mockApi({ result: 'INVALID', ticket: null });
    await openScreening();

    await userEvent.click(screen.getByText('Simuler un scan'));

    const panel = await screen.findByRole('status');
    expect(panel).toHaveClass('scan-result--red');
    expect(within(panel).getByText('Billet non valide')).toBeInTheDocument();
  });

  it('valide une entrée par le numéro de réservation', async () => {
    mockApi();
    await openScreening();

    await userEvent.type(
      await screen.findByLabelText('Numéro de réservation'),
      'lpn',
    );
    expect(screen.getByText('LPNLT2HX')).toBeInTheDocument();
    expect(screen.getByText('A1, A2')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: "Valider l'entrée" }),
    );

    expect(
      await screen.findByText('Entrée validée à 20:15'),
    ).toBeInTheDocument();
  });

  it('signale un numéro absent de la liste de la séance', async () => {
    mockApi();
    await openScreening();

    await userEvent.type(
      await screen.findByLabelText('Numéro de réservation'),
      'ZGG7BZY2',
    );

    expect(
      screen.getByText('Aucune réservation avec ce numéro pour cette séance.'),
    ).toBeInTheDocument();
  });

  it('relit la liste de la séance toutes les 30 secondes', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Vente au guichet après l'ouverture de la page : liste vide, puis
    // la nouvelle réservation apparaît à la relecture
    let entries = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        if (url.includes('/entries/')) {
          return answer(200, entries);
        }
        return answer(200, [SCREENING]);
      }),
    );
    await openScreening();
    await userEvent.type(
      await screen.findByLabelText('Numéro de réservation'),
      'LPNLT2HX',
    );
    expect(
      screen.getByText('Aucune réservation avec ce numéro pour cette séance.'),
    ).toBeInTheDocument();

    entries = ENTRIES;
    await vi.advanceTimersByTimeAsync(30000);

    expect(await screen.findByText('A1, A2')).toBeInTheDocument();
  });

  it('mode dégradé : valide hors ligne puis envoie au retour du réseau', async () => {
    let online = false;
    const fetchMock = vi.fn((url) => {
      if (url.includes('/checkin/')) {
        // Coupure réseau : fetch échoue, puis le réseau revient
        return online
          ? answer(200, CHECKED_IN)
          : Promise.reject(new Error('réseau'));
      }
      if (url.includes('/entries/')) {
        // Au retour du réseau, la liste relue contient l'entrée envoyée
        return answer(200, online ? [CHECKED_IN] : ENTRIES);
      }
      return answer(200, [SCREENING]);
    });
    vi.stubGlobal('fetch', fetchMock);
    await openScreening();

    await userEvent.type(
      await screen.findByLabelText('Numéro de réservation'),
      'LPNLT2HX',
    );
    await userEvent.click(
      screen.getByRole('button', { name: "Valider l'entrée" }),
    );

    expect(await screen.findByText(/Validée hors ligne/)).toBeInTheDocument();
    expect(
      screen.getByText('1 entrée validée hors ligne à envoyer'),
    ).toBeInTheDocument();

    online = true;
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }));

    expect(
      await screen.findByText('Entrée validée à 20:15'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('1 entrée validée hors ligne à envoyer'),
    ).not.toBeInTheDocument();
  });

  it("propose les pages de l'espace professionnel", async () => {
    mockApi();
    await openScreening();

    expect(
      screen.getByRole('link', { name: 'Vente au guichet' }),
    ).toHaveAttribute('href', '/guichet');
    expect(
      screen.getByRole('link', { name: 'Contrôle des billets' }),
    ).toHaveAttribute('href', '/controle');
  });
});
