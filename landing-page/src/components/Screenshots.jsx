/* eslint-disable react/display-name */

/* ---- Shared mini helpers ---- */
function StatusBar() {
  return (
    <div className="sc-statusbar">
      <span className="sc-time">9:41</span>
      <span className="sc-icons">●●● 🔋</span>
    </div>
  )
}

function TopBar({ title, right }) {
  return (
    <div className="sc-topbar">
      <span className="sc-title">{title}</span>
      {right && <span style={{ fontSize: '0.65rem' }}>{right}</span>}
    </div>
  )
}

/* ---- Screen 1: Home ---- */
function HomeScreen() {
  const members = [
    { pos: '1°', init: 'F', name: 'Felipe',   time: '2h32m', me: true  },
    { pos: '2°', init: 'A', name: 'Ademario', time: '3h05m', me: false },
    { pos: '3°', init: 'S', name: 'Silvana',  time: '4h12m', me: false },
  ]
  return (
    <div className="sc-phone">
      <StatusBar />
      <TopBar title="DESCONECTA" right="🔔" />
      <div className="sc-body">
        <p className="sc-greeting">Olá, <strong>Felipe</strong>! Segunda 🌅</p>
        <div className="sc-time-card">
          <div className="sc-time-big">2h 32min</div>
          <div className="sc-time-sub">de tela hoje</div>
        </div>
        <div className="sc-label">Ranking do grupo</div>
        {members.map(m => (
          <div key={m.name} className={`sc-row${m.me ? ' me' : ''}`}>
            <span className="pos">{m.pos}</span>
            <div className="av" aria-hidden="true">{m.init}</div>
            <span className="nm">{m.name}</span>
            <span className="tm">{m.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---- Screen 2: Statistics ---- */
function StatsScreen() {
  const bars = [
    { day: 'S', h: 75 }, { day: 'T', h: 60 }, { day: 'Q', h: 85 },
    { day: 'Q', h: 55 }, { day: 'S', h: 70 }, { day: 'S', h: 42 },
    { day: 'H', h: 53, today: true },
  ]
  const apps = [
    { icon: '📸', name: 'Instagram', time: '45min' },
    { icon: '🎵', name: 'TikTok',    time: '32min' },
    { icon: '💬', name: 'WhatsApp',  time: '28min' },
  ]
  return (
    <div className="sc-phone">
      <StatusBar />
      <TopBar title="Estatísticas" />
      <div className="sc-body">
        <div className="sc-label">Esta semana</div>
        <div className="sc-chart" aria-hidden="true">
          {bars.map((b, i) => (
            <div key={i} className={`sc-bar${b.today ? ' today' : ''}`} style={{ height: `${b.h}%` }} />
          ))}
        </div>
        <div className="sc-day-row" aria-hidden="true">
          {bars.map((b, i) => (
            <span key={i} className={`sc-day${b.today ? ' today' : ''}`}>{b.day}</span>
          ))}
        </div>
        <div className="sc-label" style={{ marginTop: 4 }}>Apps mais usados</div>
        {apps.map(a => (
          <div key={a.name} className="sc-app-row">
            <span className="sc-app-icon" aria-hidden="true">{a.icon}</span>
            <span className="sc-app-name">{a.name}</span>
            <span className="sc-app-time">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---- Screen 3: Group ---- */
function GroupScreen() {
  const members = [
    { pos: '1°', posClass: 'gold',   init: 'F', name: 'Felipe',   time: '2h32m', me: true  },
    { pos: '2°', posClass: 'silver', init: 'A', name: 'Ademario', time: '3h05m', me: false },
    { pos: '3°', posClass: 'bronze', init: 'S', name: 'Silvana',  time: '4h12m', me: false },
    { pos: '4°', posClass: '',       init: 'G', name: 'Gabriel',  time: '5h41m', me: false },
  ]
  return (
    <div className="sc-phone">
      <StatusBar />
      <div className="sc-topbar">
        <span className="sc-title">Grupo</span>
        <span className="sc-trophy" aria-hidden="true">🏆</span>
      </div>
      <div className="sc-body">
        <div className="sc-group-hd">
          <div>
            <div className="sc-group-name">Turma UFRJ 2025</div>
            <div className="sc-group-sub">Semana 12 • 4 membros</div>
          </div>
        </div>
        <div className="sc-rank-box">
          <div className="sc-rank-hd">Ranking esta semana</div>
          {members.map(m => (
            <div key={m.name} className={`sc-mbr${m.me ? ' me' : ''}`}>
              <span className={`pos ${m.posClass}`}>{m.pos}</span>
              <div style={{
                width: 13, height: 13, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--purple), var(--cyan))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.45rem', fontWeight: 700, color: '#fff', flexShrink: 0
              }} aria-hidden="true">{m.init}</div>
              <span className="name">{m.name}</span>
              <span className="time">{m.time}</span>
            </div>
          ))}
        </div>
        <div className="sc-winner-badge">
          Você está em 1° lugar esta semana! 🎉
        </div>
      </div>
    </div>
  )
}

/* ---- Screen 4: Feed ---- */
function FeedScreen() {
  const posts = [
    { init: 'A', user: 'Ademario', when: '2h atrás',
      text: 'Consegui ficar abaixo de 3h hoje pela 1ª vez! 💪', stat: '3h no total' },
    { init: 'G', user: 'Gabriel',  when: '4h atrás',
      text: 'O ranking me motivou a largar o celular. Está funcionando!', stat: '5h41min' },
    { init: 'F', user: 'Felipe',   when: '5h atrás',
      text: '2h32min hoje. Meu recorde pessoal no grupo 🏆', stat: '2h32min' },
  ]
  return (
    <div className="sc-phone">
      <StatusBar />
      <TopBar title="Feed do grupo" />
      <div className="sc-body">
        {posts.map(p => (
          <div key={p.user} className="sc-post">
            <div className="sc-post-hd">
              <div className="sc-post-av" aria-hidden="true">{p.init}</div>
              <span className="sc-post-user">{p.user}</span>
              <span className="sc-post-when">{p.when}</span>
            </div>
            <p className="sc-post-txt">{p.text}</p>
            <span className="sc-post-badge">📱 {p.stat}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---- Main export ---- */
const SCREENS = [
  { label: 'Home',         Component: HomeScreen  },
  { label: 'Estatísticas', Component: StatsScreen },
  { label: 'Grupo',        Component: GroupScreen },
  { label: 'Feed',         Component: FeedScreen  },
]

export default function Screenshots() {
  return (
    <section id="screenshots" className="screenshots">
      <div className="container">

        <header className="screenshots-header">
          <span className="section-tag">✦ Interface</span>
          <h2 className="section-title">
            Uma experiência <span className="gradient-text">intuitiva</span>
          </h2>
          <p className="section-subtitle">
            Interface limpa e moderna para acompanhar seu progresso, competir com amigos
            e manter hábitos digitais saudáveis.
          </p>
        </header>

        <div className="screenshots-row" role="list">
          {SCREENS.map(({ label, Component }) => (
            <figure key={label} className="screenshot-item" role="listitem">
              <Component />
              <figcaption className="screenshot-label">{label}</figcaption>
            </figure>
          ))}
        </div>

      </div>
    </section>
  )
}
