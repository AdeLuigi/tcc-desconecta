const TEAM = [
  {
    initials: 'AV',
    name: 'Ademario V. C. de Santana',
    role: 'Desenvolvedor & Pesquisador',
    email: 'adeluigi@ic.ufrj.br',
    gradient: 'linear-gradient(135deg, #6B52D8, #1ECFE3)',
  },
  {
    initials: 'FJ',
    name: 'Felipe de J. A. da Conceição',
    role: 'Desenvolvedor & Pesquisador',
    email: 'felipejac@ic.ufrj.br',
    gradient: 'linear-gradient(135deg, #1ECFE3, #6B52D8)',
  },
  {
    initials: 'SR',
    name: 'Silvana Rossetto',
    role: 'Professora Orientadora',
    email: 'silvana@ic.ufrj.br',
    gradient: 'linear-gradient(135deg, #22C55E, #1ECFE3)',
  },
]

const MINI_STATS = [
  { num: '6',    label: 'Voluntários testaram' },
  { num: '3',    label: 'Dias de teste' },
  { num: '-16%', label: 'Redução média' },
  { num: '5,0',  label: 'Nota de utilidade' },
]

export default function About() {
  return (
    <section id="about" className="about">
      <div className="container">
        <div className="about-inner">

          <div className="about-info">
            <span className="section-tag">✦ Sobre o Projeto</span>
            <h2 className="section-title">
              Pesquisa do <span className="gradient-text">IC/UFRJ</span>
            </h2>
            <p className="section-subtitle">
              O Desconecta é um Trabalho de Conclusão de Curso do Instituto de
              Computação da Universidade Federal do Rio de Janeiro (UFRJ). O projeto
              investiga como a gamificação e a dinâmica social podem promover
              mudanças sustentáveis no comportamento digital.
            </p>
            <p className="section-subtitle" style={{ marginTop: 14 }}>
              O artigo foi apresentado no{' '}
              <strong style={{ color: 'var(--text)' }}>46º CSBC 2026 – WICS 2026</strong>
              {' '}em Gramado/RS. O código-fonte é aberto, disponível no GitHub,
              encorajando contribuições externas.
            </p>

            <div className="about-mini-stats">
              {MINI_STATS.map(s => (
                <div key={s.label} className="about-mini-stat">
                  <div className="about-mini-num">{s.num}</div>
                  <div className="about-mini-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="about-team-heading">Equipe</h3>
            <div className="about-team">
              {TEAM.map(m => (
                <div key={m.email} className="team-card">
                  <div className="team-avatar" style={{ background: m.gradient }} aria-hidden="true">
                    {m.initials}
                  </div>
                  <div>
                    <div className="team-name">{m.name}</div>
                    <div className="team-role">{m.role}</div>
                    <a href={`mailto:${m.email}`} className="team-email">{m.email}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
