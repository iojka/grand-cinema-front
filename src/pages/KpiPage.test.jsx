import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import KpiPage from './KpiPage.jsx';

// Indicateurs du projet au 10e jour, comme les renvoie l'API
const KPI = {
  today: '2026-10-10',
  launch_date: '2026-10-01',
  days: 10,
  attendance: 15000,
  target: 14446,
  baseline: 11112,
  progress: 104,
  online_share: 55,
  online_target: 60,
  peak_rate: 82,
  peak_target: 80,
  tourist_share: 25,
  tourist_target: 20,
};

// Réponse préparée de l'API avec son code HTTP
function answer(status, data) {
  return Promise.resolve({
    ok: status < 400,
    status,
    json: () => Promise.resolve(data),
    blob: () => Promise.resolve(new Blob(['Indicateur;Valeur;Cible'])),
  });
}

// Membre de la direction connecté qui ouvre les indicateurs
function renderKpi() {
  sessionStorage.setItem('token', 'jeton');
  render(
    <MemoryRouter>
      <KpiPage />
    </MemoryRouter>,
  );
}

// Carte d'un indicateur, retrouvée par son titre
function card(title) {
  return screen.getByRole('heading', { name: title }).closest('article');
}

describe('KpiPage (US 8.2)', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('demande la connexion du personnel', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => answer(200, KPI)),
    );
    render(
      <MemoryRouter>
        <KpiPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Connexion du personnel' }),
    ).toBeInTheDocument();
  });

  it('compare la fréquentation à la trajectoire cible', async () => {
    const fetchMock = vi.fn(() => answer(200, KPI));
    vi.stubGlobal('fetch', fetchMock);

    renderKpi();

    expect(
      await screen.findByText(
        'Depuis le lancement le jeudi 1 octobre (10 jours).',
      ),
    ).toBeInTheDocument();
    const attendance = card('Fréquentation depuis le lancement');
    expect(within(attendance).getByText('15 000 entrées')).toBeInTheDocument();
    expect(
      within(attendance).getByText('Cible à date : 14 446 entrées'),
    ).toBeInTheDocument();
    expect(
      within(attendance).getByText(
        "Sans l'application, même durée : 11 112 entrées",
      ),
    ).toBeInTheDocument();
    expect(within(attendance).getByText('Objectif atteint')).toHaveClass(
      'kpi__status--ok',
    );
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/dashboard/kpi/');
    expect(options.headers.Authorization).toBe('Bearer jeton');
  });

  it('affiche la part en ligne, le remplissage en affluence et les touristes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => answer(200, KPI)),
    );

    renderKpi();

    await screen.findByText('15 000 entrées');
    const online = card('Part des réservations en ligne');
    expect(within(online).getByText('55 %')).toBeInTheDocument();
    expect(within(online).getByText('Cible : 60 %')).toBeInTheDocument();
    expect(within(online).getByText('Objectif non atteint')).toHaveClass(
      'kpi__status--ko',
    );
    const peak = card("Remplissage aux heures d'affluence");
    expect(within(peak).getByText('82 %')).toBeInTheDocument();
    expect(within(peak).getByText('Cible : 80 %')).toBeInTheDocument();
    expect(within(peak).getByText('Objectif atteint')).toBeInTheDocument();
    const tourists = card('Part de touristes pendant le festival');
    expect(within(tourists).getByText('25 %')).toBeInTheDocument();
    expect(within(tourists).getByText('Cible : 20 %')).toBeInTheDocument();
  });

  it('indique que les dates du festival ne sont pas réglées', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => answer(200, { ...KPI, tourist_share: null })),
    );

    renderKpi();

    await screen.findByText('15 000 entrées');
    const tourists = card('Part de touristes pendant le festival');
    expect(
      within(tourists).getByText(
        "Dates du festival à régler dans l'administration.",
      ),
    ).toBeInTheDocument();
    expect(within(tourists).queryByText(/Objectif/)).not.toBeInTheDocument();
  });

  it('exporte les indicateurs en CSV', async () => {
    const fetchMock = vi.fn(() => answer(200, KPI));
    vi.stubGlobal('fetch', fetchMock);
    // jsdom ne crée pas de fichier : lien et clic simulés
    URL.createObjectURL = vi.fn(() => 'blob:kpi');
    URL.revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    renderKpi();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Exporter en CSV' }),
    );

    await vi.waitFor(() => expect(click).toHaveBeenCalled());
    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toContain('/api/dashboard/kpi/csv/');
    expect(options.headers.Authorization).toBe('Bearer jeton');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('signale un compte sans accès aux indicateurs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => answer(403, {})),
    );

    renderKpi();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Votre compte n'a pas accès aux indicateurs du projet.",
    );
  });

  it("propose les indicateurs dans le menu de l'espace professionnel", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => answer(200, KPI)),
    );

    renderKpi();

    expect(
      await screen.findByRole('link', { name: 'Indicateurs du projet' }),
    ).toHaveAttribute('href', '/indicateurs');
  });
});
