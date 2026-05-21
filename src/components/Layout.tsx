import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Layout() {
  const navigate = useNavigate()

  async function handleLogout() {
    const confirm = window.confirm('Deseja realmente sair do sistema?')
    if (confirm) {
      await supabase.auth.signOut()
      navigate('/login')
    }
  }

  return (
    <div className="app-layout">
      {/* Sidebar Fixa */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          {/* Logo Nutri Rita */}
          <svg 
            width="28" 
            height="28" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{ color: 'var(--primary)' }}
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <h2>Nutri Rita</h2>
        </div>

        <nav className="sidebar-menu">
          <NavLink 
            to="/" 
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            end
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            Dashboard
          </NavLink>

          <NavLink 
            to="/agenda" 
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Agenda
          </NavLink>

          <NavLink 
            to="/pacientes" 
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Pacientes
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-btn-logout">
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
