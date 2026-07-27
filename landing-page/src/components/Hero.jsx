import homeImg from '../../screenshots/Home.png'

function DownloadArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

export default function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="container">
        <div className="hero-inner">

          {/* Content */}
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" aria-hidden="true" />
              Projeto de Pesquisa — IC/UFRJ
            </div>

            <h1 className="hero-title">
              <span className="logo-prefix">Bem-vindo ao</span>
              <span className="gradient-text">DESCONECTA</span>
            </h1>

            <p className="hero-tagline">Reduza o tempo de tela. Juntos.</p>

            <p className="hero-description">
              Um aplicativo gamificado onde grupos de usuários participam de desafios
              semanais para reduzir o tempo de uso de tela. Defina metas, compare
              resultados no ranking e promova hábitos digitais mais saudáveis — com
              o apoio das pessoas ao seu redor.
            </p>

            <div className="hero-actions">
              <a
                href="https://drive.google.com/file/d/18fTsQKklQliBatZ4C3pdckIpQ0L-OiJn/view"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
              >
                <DownloadArrow />
                Baixar para Android
              </a>
              <a
                href="https://github.com/adeLuigi/tcc-desconecta"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-lg"
              >
                <GitHubIcon />
                Ver Código
              </a>
            </div>

            <div className="hero-chips">
              {['Gratuito', 'Android', 'Código Aberto', 'IC/UFRJ'].map(label => (
                <span key={label} className="hero-chip">
                  <span className="hero-chip-dot" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="hero-visual">
            <div className="hero-phone-wrapper">
              <div className="hero-phone-glow" aria-hidden="true" />
              <div className="hero-phone" role="img" aria-label="Tela inicial do aplicativo Desconecta">
                <div className="hero-phone-screen">
                  <img
                    src={homeImg}
                    alt="Tela inicial do Desconecta mostrando 2h 32min de tempo de tela, streak de 4 dias e grupos ativos"
                    className="hero-phone-img"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
