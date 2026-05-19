import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Map, User, PlusCircle, LogOut, Menu, X, Compass, Globe } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path
  const profileNavActive =
    location.pathname === '/profile' ||
    (location.pathname.startsWith('/profile/') && location.pathname.length > '/profile/'.length)

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-stone-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center group-hover:bg-brand-700 transition-colors">
            <Compass size={18} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold text-stone-800">Мандри</span>
        </Link>

        {/* Desktop nav */}
        {user && (
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" active={isActive('/')}>
              <Map size={16} />
              Подорожі
            </NavLink>
            <NavLink to="/explore" active={isActive('/explore')}>
              <Globe size={16} />
              Стрічка
            </NavLink>
            <NavLink to="/profile" active={profileNavActive}>
              <User size={16} />
              Профіль
            </NavLink>
          </div>
        )}

        {/* Actions */}
        {user ? (
          <div className="hidden md:flex items-center gap-3">
            <Link to="/trips/new" className="btn-primary flex items-center gap-2 text-sm py-2">
              <PlusCircle size={16} />
              Нова подорож
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Вийти"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2">
            <Link to="/login" className="btn-secondary text-sm py-2">Увійти</Link>
            <Link to="/register" className="btn-primary text-sm py-2">Реєстрація</Link>
          </div>
        )}

        {/* Mobile burger */}
        <button
          className="md:hidden p-2 text-stone-500 hover:bg-stone-100 rounded-lg"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-stone-100 px-4 py-3 space-y-1 animate-fade-in">
          {user ? (
            <>
              <MobileLink to="/" onClick={() => setMenuOpen(false)}>Подорожі</MobileLink>
              <MobileLink to="/explore" onClick={() => setMenuOpen(false)}>🌍 Стрічка</MobileLink>
              <MobileLink to="/profile" onClick={() => setMenuOpen(false)}>Профіль</MobileLink>
              <MobileLink to="/trips/new" onClick={() => setMenuOpen(false)}>+ Нова подорож</MobileLink>
              <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-red-500 font-medium rounded-lg hover:bg-red-50">
                Вийти
              </button>
            </>
          ) : (
            <>
              <MobileLink to="/login" onClick={() => setMenuOpen(false)}>Увійти</MobileLink>
              <MobileLink to="/register" onClick={() => setMenuOpen(false)}>Реєстрація</MobileLink>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-800'
      }`}
    >
      {children}
    </Link>
  )
}

function MobileLink({ to, onClick, children }) {
  return (
    <Link to={to} onClick={onClick} className="block px-3 py-2.5 text-stone-700 font-medium rounded-lg hover:bg-stone-100">
      {children}
    </Link>
  )
}
