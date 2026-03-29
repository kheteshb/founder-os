import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, History, ChevronRight } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const isNew = location.pathname === '/new';
  const isHistory = location.pathname === '/history';
  const isAnalysis = location.pathname.startsWith('/analysis/');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-14">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-gray-900">
              Founder OS
            </span>
            <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
              beta
            </span>
          </NavLink>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <LayoutDashboard size={14} />
              Dashboard
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <History size={14} />
              History
            </NavLink>
          </div>

          {/* CTA */}
          <NavLink
            to="/new"
            className="flex items-center gap-1.5 bg-gray-900 text-white text-sm px-3 py-1.5 rounded hover:bg-gray-800 transition-colors font-medium"
          >
            <Plus size={14} />
            New Analysis
          </NavLink>
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-14 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
