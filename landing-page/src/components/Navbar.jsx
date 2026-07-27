import { useState, useEffect } from 'react'

function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="url(#navLogoGrad)" />
      <path d="M7 13c0-4.142 4.03-7.5 9-7.5s9 3.358 9 7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M11 16.5c0-2.485 2.239-4.5 5-4.5s5 2.015 5 4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="16" cy="21" r="2" fill="white" />
      <line x1="6" y1="6" x2="26" y2="26" stroke="#1ECFE3" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="navLogoGrad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#6B52D8" />
          <stop offset="100%" stopColor="#1ECFE3" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '#features',     label: 'Funcionalidades' },
    { href: '#how-it-works', label: 'Como Funciona' },
    { href: '#results',      label: 'Resultados' },
    { href: '#about',        label: 'Sobre' },
    { href: '#contact',      label: 'Contato' },
  ]

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="container navbar-inner">
        <a href="#" className="navbar-logo" aria-label="Desconecta — voltar ao topo">
          <LogoIcon />
          <span className="navbar-logo-text">Desconecta</span>
        </a>

        <ul className={`navbar-links${menuOpen ? ' open' : ''}`} role="list">
          {links.map(l => (
            <li key={l.href}>
              <a href={l.href} onClick={closeMenu}>{l.label}</a>
            </li>
          ))}
        </ul>

        <div className="navbar-actions">
          <a
            href="https://drive.google.com/file/d/18fTsQKklQliBatZ4C3pdckIpQ0L-OiJn/view"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary navbar-download-btn"
            style={{ fontSize: '0.875rem', padding: '10px 20px' }}
          >
            <DownloadIcon />
            Baixar App
          </a>
          <button
            className="hamburger"
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
          >
            <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ opacity: menuOpen ? 0 : 1 }} />
            <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>
      </div>
    </nav>
  )
}
