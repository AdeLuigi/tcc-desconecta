const RATINGS = [
  { name: 'Facilidade de uso',          value: 4.78, pct: 95.6 },
  { name: 'Engajamento com gamificação', value: 4.50, pct: 90   },
  { name: 'Utilidade percebida',         value: 5.00, pct: 100  },
]

export default function Stats() {
  return (
    <section id="results" className="stats">
      <div className="container">

        <header className="stats-header">
          <span className="section-tag">✦ Resultados</span>
          <h2 className="section-title">
            Resultados <span className="gradient-text">comprovados</span> em teste
          </h2>
          <p className="section-subtitle">
            Testado com 6 voluntários ao longo de 3 dias consecutivos.
            Dados coletados diretamente pelo app e questionário de avaliação aplicado ao final.
          </p>
        </header>

        {/* Big numbers */}
        <div className="stats-big-nums">
          <div className="stats-num-card highlight">
            <div className="stats-arrow-row">
              <span className="stats-from">322min</span>
              <span className="stats-arrow-icon" aria-hidden="true">→</span>
              <span className="stats-to">270min</span>
            </div>
            <p className="stats-big-label">Tempo médio diário — redução ao longo dos 3 dias</p>
          </div>

          <div className="stats-num-card">
            <div className="stats-big-num green" aria-label="menos 16 porcento">-16%</div>
            <p className="stats-big-label">Redução no tempo de tela em apenas 3 dias de uso</p>
          </div>

          <div className="stats-num-card">
            <div className="stats-big-num purple" aria-label="5 de 5">5,0/5</div>
            <p className="stats-big-label">Média máxima em utilidade percebida pelos participantes</p>
          </div>
        </div>

        {/* Ratings + Quote */}
        <div className="stats-bottom">
          <div className="ratings-list">
            <h3 className="ratings-heading">Avaliação dos participantes</h3>
            {RATINGS.map(r => (
              <div key={r.name} className="rating-item">
                <div className="rating-header">
                  <span className="rating-name">{r.name}</span>
                  <span className="rating-value">{r.value.toFixed(2)}/5</span>
                </div>
                <div className="rating-track" role="progressbar"
                  aria-valuenow={r.value} aria-valuemin={0} aria-valuemax={5}>
                  <div className="rating-fill" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
            <p className="stats-all-changed">
              ✓ 100% dos participantes relataram alguma mudança de comportamento
            </p>
          </div>

          <blockquote className="stats-quote">
            <div className="stats-quote-mark" aria-hidden="true">"</div>
            <p className="stats-quote-text">
              O ranking já gerou a sensação de precisar diminuir o tempo de tela.
              Saber que meu uso seria visível para o grupo fez toda a diferença.
            </p>
            <footer>
              <cite className="stats-quote-author">— Participante do teste piloto</cite>
            </footer>
          </blockquote>
        </div>

      </div>
    </section>
  )
}
