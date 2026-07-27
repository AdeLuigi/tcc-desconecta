const STEPS = [
  {
    num: '01',
    tag: 'Configuração',
    title: 'Conceda a permissão de acesso',
    desc: 'Permita que o Desconecta monitore o tempo de uso dos aplicativos. A coleta é feita localmente no dispositivo — transparente e sem envio de dados sensíveis.',
  },
  {
    num: '02',
    tag: 'Social',
    title: 'Entre em um grupo com amigos',
    desc: 'Crie ou entre em um grupo, convide pessoas e participe dos desafios semanais coletivos. A competição amigável é o principal motor da mudança.',
  },
  {
    num: '03',
    tag: 'Metas',
    title: 'Defina limites e acompanhe',
    desc: 'Configure metas diárias por aplicativo, ative o bloqueio automático e acompanhe o progresso no ranking semana a semana.',
  },
  {
    num: '04',
    tag: 'Resultado',
    title: 'Reduza e mantenha o hábito',
    desc: 'Com apoio coletivo e gamificação, a redução se torna um hábito sustentável. Nosso teste piloto mostrou -16% em apenas 3 dias.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="how-it-works">
      <div className="container">
        <div className="how-inner">

          <header className="how-header">
            <span className="section-tag">✦ Como Funciona</span>
            <h2 className="section-title">
              Simples de usar,{' '}
              <span className="gradient-text">poderoso em resultado</span>
            </h2>
            <p className="section-subtitle">
              Em quatro passos você começa a transformar sua relação com o smartphone,
              com o apoio de quem você conhece.
            </p>
          </header>

          <div role="list">
            {STEPS.map((step, i) => (
              <div key={step.num} className="how-step" role="listitem">
                <div className="step-number" aria-hidden="true">
                  <div className="step-num">{step.num}</div>
                  {i < STEPS.length - 1 && <div className="step-line" />}
                </div>
                <div className="step-content">
                  <div className="step-tag">{step.tag}</div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
