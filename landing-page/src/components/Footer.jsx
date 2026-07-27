function LogoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="url(#footerLogoGrad)" />
      <path d="M7 13c0-4.142 4.03-7.5 9-7.5s9 3.358 9 7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M11 16.5c0-2.485 2.239-4.5 5-4.5s5 2.015 5 4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="16" cy="21" r="2" fill="white" />
      <line x1="6" y1="6" x2="26" y2="26" stroke="#1ECFE3" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="footerLogoGrad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#6B52D8" />
          <stop offset="100%" stopColor="#1ECFE3" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">

          {/* Brand */}
          <div>
            <a href="#" className="footer-logo" aria-label="Desconecta — voltar ao topo">
              <LogoIcon />
              <span className="footer-logo-text">Desconecta</span>
            </a>
            <p className="footer-brand-desc">
              Aplicativo gamificado para redução coletiva do tempo de tela.
              Projeto de pesquisa do Instituto de Computação da UFRJ.
            </p>
            <div className="footer-social">
              <a
                href="https://github.com/adeLuigi/tcc-desconecta"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="GitHub do projeto"
              >
                <GitHubIcon />
              </a>
            </div>
          </div>

          {/* App links */}
          <div>
            <div className="footer-col-title">App</div>
            <ul className="footer-col-links">
              <li><a href="#features">Funcionalidades</a></li>
              <li><a href="#how-it-works">Como Funciona</a></li>
              <li><a href="#results">Resultados</a></li>
              <li><a href="#screenshots">Interface</a></li>
              <li>
                <a href="https://drive.google.com/file/d/18fTsQKklQliBatZ4C3pdckIpQ0L-OiJn/view"
                  target="_blank" rel="noopener noreferrer">Download APK</a>
              </li>
            </ul>
          </div>

          {/* Research links */}
          <div>
            <div className="footer-col-title">Pesquisa</div>
            <ul className="footer-col-links">
              <li><a href="#about">Sobre o Projeto</a></li>
              <li><a href="#about">Equipe</a></li>
              <li>
                <a href="https://github.com/adeLuigi/tcc-desconecta"
                  target="_blank" rel="noopener noreferrer">Código-fonte</a>
              </li>
              <li><a href="#contact">Contato</a></li>
            </ul>
          </div>

          {/* Institutions */}
          <div>
            <div className="footer-col-title">Instituições</div>
            <ul className="footer-col-links">
              <li>
                <a href="https://www.ic.ufrj.br" target="_blank" rel="noopener noreferrer">IC/UFRJ</a>
              </li>
              <li>
                <a href="https://ufrj.br" target="_blank" rel="noopener noreferrer">UFRJ</a>
              </li>
              <li>
                <a href="https://csbc.sbc.org.br" target="_blank" rel="noopener noreferrer">CSBC 2026</a>
              </li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            © {year} Desconecta — IC/UFRJ.{' '}
            Projeto de código aberto sob{' '}
            <a href="https://github.com/adeLuigi/tcc-desconecta/blob/main/LICENSE"
              target="_blank" rel="noopener noreferrer">licença MIT</a>.
          </p>
          <nav className="footer-btm-links" aria-label="Links do rodapé">
            <a href="https://github.com/adeLuigi/tcc-desconecta"
              target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="#about">Sobre</a>
            <a href="#contact">Contato</a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
