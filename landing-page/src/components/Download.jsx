function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

export default function Download() {
  return (
    <section id="download" className="download">
      <div className="download-bg" aria-hidden="true" />
      <div className="container">
        <div className="download-inner">
          <span className="section-tag">✦ Download</span>
          <h2 className="download-title">
            Pronto para <span className="gradient-text">desconectar</span>?<br />
            Comece hoje mesmo.
          </h2>
          <p className="download-subtitle">
            Baixe o Desconecta gratuitamente, convide seus amigos e comece a
            reduzir o tempo de tela com gamificação e apoio coletivo.
          </p>
          <div className="download-actions">
            <a
              href="https://drive.google.com/file/d/18fTsQKklQliBatZ4C3pdckIpQ0L-OiJn/view"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-cyan"
            >
              <DownloadIcon />
              Download APK Android
            </a>
            <a
              href="https://github.com/adeLuigi/tcc-desconecta"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              <GitHubIcon />
              Ver no GitHub
            </a>
          </div>
          <p className="download-note">
            APK disponível para instalação direta. Android 10 ou superior.{' '}
            <a href="https://github.com/adeLuigi/tcc-desconecta" target="_blank" rel="noopener noreferrer">
              Código-fonte aberto
            </a>
            {' '}no GitHub.
          </p>
        </div>
      </div>
    </section>
  )
}
