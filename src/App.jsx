import { Route, Routes } from 'react-router';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import MoviePage from './pages/MoviePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
