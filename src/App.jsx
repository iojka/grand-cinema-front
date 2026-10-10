import { Route, Routes } from 'react-router';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import BookingPage from './pages/BookingPage.jsx';
import BoxOfficePage from './pages/BoxOfficePage.jsx';
import ConfirmationPage from './pages/ConfirmationPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import HomePage from './pages/HomePage.jsx';
import KpiPage from './pages/KpiPage.jsx';
import LegalPage from './pages/LegalPage.jsx';
import MoviePage from './pages/MoviePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import ScanPage from './pages/ScanPage.jsx';
import TrackingPage from './pages/TrackingPage.jsx';
import SeatMapPage from './pages/SeatMapPage.jsx';

// Les pages seront ajoutées au fil des US (programme, fiche film...)
function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/films/:id" element={<MoviePage />} />
          <Route path="/seances/:id" element={<SeatMapPage />} />
          <Route path="/reservation/:id" element={<BookingPage />} />
          <Route
            path="/reservation/:id/confirmation"
            element={<ConfirmationPage />}
          />
          <Route path="/confidentialite" element={<PrivacyPage />} />
          <Route path="/mentions-legales" element={<LegalPage />} />
          <Route path="/guichet" element={<BoxOfficePage />} />
          <Route path="/controle" element={<ScanPage />} />
          <Route path="/suivi" element={<TrackingPage />} />
          <Route path="/tableau-de-bord" element={<DashboardPage />} />
          <Route path="/indicateurs" element={<KpiPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
