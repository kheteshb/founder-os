import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import NewAnalysis from './pages/NewAnalysis';
import AnalysisView from './pages/AnalysisView';
import DeckHistory from './pages/DeckHistory';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="new" element={<NewAnalysis />} />
          <Route path="decks/:deckId/versions/:versionId" element={<AnalysisView />} />
          <Route path="decks/:deckId" element={<DeckHistory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
