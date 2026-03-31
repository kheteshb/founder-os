import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDecks } from '../api';
import { DeckSummary } from '../types';

function VerdictBadge({ verdict }: { verdict?: 'invest' | 'maybe' | 'pass' }) {
  if (!verdict) return null;
  const cfg = {
    invest: 'bg-emerald-100 text-emerald-700',
    maybe: 'bg-amber-100 text-amber-700',
    pass: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs font-semibold uppercase px-1.5 py-0.5 rounded ${cfg[verdict]}`}>
      {verdict}
    </span>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<DeckSummary[]>([]);

  useEffect(() => {
    getDecks().then(setDecks).catch(() => {});
  }, []);

  // Refresh decks when navigating (simple polling-free approach via event)
  useEffect(() => {
    const handler = () => {
      getDecks().then(setDecks).catch(() => {});
    };
    window.addEventListener('founder-os:refresh', handler);
    return () => window.removeEventListener('founder-os:refresh', handler);
  }, []);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-gray-100 flex flex-col bg-white fixed top-0 left-0 h-full z-40">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-gray-900">Founder OS</span>
            <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
              beta
            </span>
          </NavLink>
        </div>

        {/* New Analysis CTA */}
        <div className="px-4 py-3 border-b border-gray-100">
          <button
            onClick={() => navigate('/new')}
            className="w-full flex items-center gap-2 bg-gray-900 text-white text-sm px-3 py-2 rounded font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={14} />
            New Analysis
          </button>
        </div>

        {/* Decks list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {decks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
                Decks
              </p>
              <div className="space-y-0.5">
                {decks.map(deck => (
                  <NavLink
                    key={deck.id}
                    to={
                      deck.latestVersionId
                        ? `/decks/${deck.id}/versions/${deck.latestVersionId}`
                        : `/decks/${deck.id}`
                    }
                    className={({ isActive }) =>
                      `flex items-center justify-between px-2 py-2 rounded text-sm transition-colors group cursor-pointer ${
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={13} className="text-gray-400 shrink-0" />
                      <span className="truncate text-xs font-medium">{deck.name}</span>
                    </div>
                    {deck.latestVerdict && (
                      <VerdictBadge verdict={deck.latestVerdict} />
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
