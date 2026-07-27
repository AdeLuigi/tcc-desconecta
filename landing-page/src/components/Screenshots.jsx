import homeImg      from '../../screenshots/Home.png'
import rankingImg   from '../../screenshots/Desafios.png'
import grupoImg     from '../../screenshots/Desafios (1).png'
import statsImg     from '../../screenshots/Estatística do dia.png'
import feedImg      from '../../screenshots/Desafios (2).png'

/**
 * PhoneFrame — wraps a real screenshot inside a styled phone shell.
 * `tall` adds a scroll gradient and scrollable container for long screens.
 */
function PhoneFrame({ src, alt, tall = false }) {
  return (
    <div className="sc-phone-real">
      <div className="sc-scroll-area">
        <img src={src} alt={alt} draggable="false" />
      </div>
      {tall && (
        <>
          <div className="sc-scroll-fade" aria-hidden="true" />
          <div className="sc-scroll-hint" aria-hidden="true">
            <span className="sc-scroll-dot" />
            <span className="sc-scroll-dot" />
            <span className="sc-scroll-dot" />
          </div>
        </>
      )}
    </div>
  )
}

const SCREENS = [
  {
    label: 'Home',
    src: homeImg,
    alt: 'Tela inicial do Desconecta mostrando tempo de tela, streak e grupos',
    tall: false,
  },
  {
    label: 'Ranking',
    src: rankingImg,
    alt: 'Tela de ranking do grupo Sem Brainrot com membros e tempos de uso',
    tall: false,
  },
  {
    label: 'Grupo',
    src: grupoImg,
    alt: 'Tela de detalhes do grupo com atividades offline dos membros',
    tall: false,
  },
  {
    label: 'Estatísticas',
    src: statsImg,
    alt: 'Tela de estatísticas pessoais detalhadas por dia, com categorias e apps',
    tall: true,
  },
  {
    label: 'Comentário',
    src: feedImg,
    alt: 'Tela de comentários em uma atividade offline do grupo',
    tall: true,
  },
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
            Nas telas mais longas, deslize para baixo para ver o conteúdo completo.
          </p>
        </header>

        <div className="screenshots-row" role="list">
          {SCREENS.map(({ label, src, alt, tall }) => (
            <figure key={label} className="screenshot-item" role="listitem">
              <PhoneFrame src={src} alt={alt} tall={tall} />
              <figcaption className="screenshot-label">{label}</figcaption>
            </figure>
          ))}
        </div>

      </div>
    </section>
  )
}
