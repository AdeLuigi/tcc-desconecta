function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M7 17L17 7M17 7H7M17 7V17" />
    </svg>
  )
}

const LINKS = [
  {
    icon: '🐙',
    cls: 'github',
    title: 'GitHub',
    desc: 'Ver código-fonte completo do projeto',
    href: 'https://github.com/adeLuigi/tcc-desconecta',
  },
  {
    icon: '🤖',
    cls: 'android',
    title: 'Download APK',
    desc: 'Baixar o app diretamente para Android',
    href: 'https://drive.google.com/file/d/18fTsQKklQliBatZ4C3pdckIpQ0L-OiJn/view',
  },
  {
    icon: '✉️',
    cls: 'email',
    title: 'E-mail',
    desc: 'Entrar em contato com a equipe',
    href: 'mailto:adeluigi@ic.ufrj.br',
  },
]

export default function Contact() {
  return (
    <section id="contact" className="contact">
      <div className="container">
        <div className="contact-inner">

          <div className="contact-info">
            <span className="section-tag">✦ Contato</span>
            <h2 className="section-title">
              Fale com a <span className="gradient-text">equipe</span>
            </h2>
            <p className="section-subtitle">
              Tem dúvidas, sugestões ou quer contribuir? Abra uma issue no GitHub
              ou entre em contato direto com a equipe.
            </p>

            <address className="contact-items" style={{ fontStyle: 'normal' }}>
              <div className="contact-item">
                <div className="contact-icon" aria-hidden="true">🏛️</div>
                <div>
                  <div className="contact-lbl">Instituição</div>
                  <div className="contact-val">Instituto de Computação – UFRJ</div>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon" aria-hidden="true">📍</div>
                <div>
                  <div className="contact-lbl">Localização</div>
                  <div className="contact-val">Cidade Universitária, Rio de Janeiro – RJ</div>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon" aria-hidden="true">📧</div>
                <div>
                  <div className="contact-lbl">E-mails da equipe</div>
                  <div className="contact-val">
                    <a href="mailto:adeluigi@ic.ufrj.br">adeluigi@ic.ufrj.br</a><br />
                    <a href="mailto:felipejac@ic.ufrj.br">felipejac@ic.ufrj.br</a><br />
                    <a href="mailto:silvana@ic.ufrj.br">silvana@ic.ufrj.br</a>
                  </div>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon" aria-hidden="true">📄</div>
                <div>
                  <div className="contact-lbl">Publicação</div>
                  <div className="contact-val">46º CSBC 2026 – WICS 2026, Gramado/RS</div>
                </div>
              </div>
            </address>
          </div>

          <div className="contact-links">
            {LINKS.map(l => (
              <a
                key={l.title}
                href={l.href}
                target={l.href.startsWith('http') ? '_blank' : undefined}
                rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="contact-link-card"
              >
                <div className={`contact-link-icon ${l.cls}`} aria-hidden="true">
                  <span role="img" aria-label={l.title}>{l.icon}</span>
                </div>
                <div className="contact-link-body">
                  <div className="contact-link-title">{l.title}</div>
                  <div className="contact-link-desc">{l.desc}</div>
                </div>
                <span className="contact-link-arrow"><ArrowIcon /></span>
              </a>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
