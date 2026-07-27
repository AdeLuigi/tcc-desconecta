const FEATURES = [
  {
    emoji: '📊',
    color: 'purple',
    title: 'Monitoramento Automático',
    desc: 'Rastreia o tempo de uso de cada aplicativo em segundo plano, sem intervenção manual. Dados precisos e em tempo real.',
  },
  {
    emoji: '👥',
    color: 'cyan',
    title: 'Grupos & Desafios',
    desc: 'Crie grupos com amigos e participe de desafios semanais coletivos. A dinâmica social é o motor da mudança de hábito.',
  },
  {
    emoji: '🏆',
    color: 'purple',
    title: 'Ranking Gamificado',
    desc: 'Compita amigavelmente com um ranking semanal. Veja quem está usando menos o celular e se motive a melhorar.',
  },
  {
    emoji: '🎯',
    color: 'green',
    title: 'Metas Personalizadas',
    desc: 'Defina limites diários por aplicativo. Receba alertas quando estiver se aproximando dos limites configurados.',
  },
  {
    emoji: '🔒',
    color: 'cyan',
    title: 'Bloqueio de Aplicativos',
    desc: 'Apps que excedam o tempo limite configurado são bloqueados automaticamente, ajudando a manter o foco.',
  },
  {
    emoji: '📈',
    color: 'purple',
    title: 'Histórico Detalhado',
    desc: 'Gráficos de evolução semanal, listagem dos apps mais utilizados e acompanhamento do progresso ao longo do tempo.',
  },
]

export default function Features() {
  return (
    <section id="features" className="features">
      <div className="container">
        <header className="features-header">
          <span className="section-tag">✦ Funcionalidades</span>
          <h2 className="section-title">
            Tudo que você precisa para{' '}
            <span className="gradient-text">reduzir o uso</span>
          </h2>
          <p className="section-subtitle">
            O Desconecta combina monitoramento automático, gamificação e engajamento social
            para tornar a redução do tempo de tela motivadora e sustentável.
          </p>
        </header>

        <div className="features-grid">
          {FEATURES.map(f => (
            <article key={f.title} className="card feature-card">
              <div className={`feature-icon ${f.color}`} aria-hidden="true">
                <span role="img" aria-label={f.title}>{f.emoji}</span>
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
