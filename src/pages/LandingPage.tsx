import { useNavigate } from 'react-router-dom'
import heroImg from '../assets/hero-nutritionist.png'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing-root">
      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <span className="landing-nav-icon">🌿</span>
          <span className="landing-nav-brand">Nutri Rita</span>
        </div>
        <div className="landing-nav-actions">
          <button
            className="landing-btn-ghost"
            onClick={() => navigate('/login')}
          >
            Entrar
          </button>
          <button
            className="landing-btn-solid"
            onClick={() => navigate('/login')}
          >
            Agendar Consulta
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-container">

          {/* Coluna Esquerda — Conteúdo */}
          <div className="hero-content">
            {/* Tag discreta */}
            <div className="hero-tag">
              <span className="hero-tag-dot" />
              Nutrição Personalizada
            </div>

            {/* Título principal */}
            <h1 className="hero-title">
              Transforme sua saúde com uma{' '}
              <span className="hero-title-highlight">nutrição que respeita você</span>
            </h1>

            {/* Subtítulo */}
            <p className="hero-subtitle">
              Acompanhamento nutricional humanizado para quem busca equilibrio, energia e resultados reais — sem dietas restritivas.
            </p>

            {/* Badges de prova social */}
            <div className="hero-social-proof">
              <div className="hero-proof-item">
                <span className="hero-proof-value">500+</span>
                <span className="hero-proof-label">Pacientes atendidos</span>
              </div>
              <div className="hero-proof-divider" />
              <div className="hero-proof-item">
                <span className="hero-proof-value">98%</span>
                <span className="hero-proof-label">Satisfação</span>
              </div>
              <div className="hero-proof-divider" />
              <div className="hero-proof-item">
                <span className="hero-proof-value">8 anos</span>
                <span className="hero-proof-label">De experiência</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="hero-ctas">
              <button
                id="cta-agendar"
                className="hero-cta-primary"
                onClick={() => navigate('/login')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Agendar Consulta
              </button>
              <button
                id="cta-metodologia"
                className="hero-cta-secondary"
                onClick={() => {
                  document.getElementById('metodologia')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Conhecer Metodologia
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Coluna Direita — Visual */}
          <div className="hero-visual">
            {/* Card flutuante superior-esquerdo */}
            <div className="hero-float-card hero-float-top-left">
              <span className="hero-float-icon">📋</span>
              <div>
                <div className="hero-float-title">Plano Alimentar</div>
                <div className="hero-float-sub">Personalizado para você</div>
              </div>
            </div>

            {/* Imagem */}
            <div className="hero-img-wrapper">
              <img
                src={heroImg}
                alt="Dra. Rita — Nutricionista"
                className="hero-img"
              />
              {/* Anel decorativo */}
              <div className="hero-img-ring" />
              {/* Blob decorativo */}
              <div className="hero-blob" />
            </div>

            {/* Card flutuante inferior-direito */}
            <div className="hero-float-card hero-float-bottom-right">
              <span className="hero-float-icon">💬</span>
              <div>
                <div className="hero-float-title">Suporte Diário</div>
                <div className="hero-float-sub">Acompanhamento via WhatsApp</div>
              </div>
            </div>

            {/* Card flutuante superior-direito */}
            <div className="hero-float-card hero-float-top-right">
              <span className="hero-float-icon">⭐</span>
              <div>
                <div className="hero-float-title">4.9 / 5.0</div>
                <div className="hero-float-sub">Avaliação dos pacientes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Metodologia ── */}
      <section id="metodologia" className="metodologia-section">
        <div className="metodologia-container">
          <div className="metodologia-header">
            <div className="hero-tag" style={{ margin: '0 auto 16px' }}>Nossa Abordagem</div>
            <h2 className="metodologia-title">Uma metodologia centrada em <span className="hero-title-highlight">você</span></h2>
            <p className="metodologia-subtitle">
              Cada consulta é um passo na construção de hábitos saudáveis e duradouros.
            </p>
          </div>

          <div className="metodologia-grid">
            {[
              { icon: '🔍', title: 'Avaliação Completa', desc: 'Anamnese detalhada com histórico clínico, estilo de vida e objetivos pessoais.' },
              { icon: '🥗', title: 'Plano Personalizado', desc: 'Cardápio elaborado com base nas suas necessidades, preferências e rotina.' },
              { icon: '📊', title: 'Monitoramento', desc: 'Acompanhamento regular com ajustes finos e análise de evolução corporal.' },
              { icon: '💡', title: 'Educação Alimentar', desc: 'Autonomia na cozinha com receitas, substituições e orientações práticas.' },
            ].map((item) => (
              <div key={item.title} className="metodologia-card">
                <div className="metodologia-card-icon">{item.icon}</div>
                <h3 className="metodologia-card-title">{item.title}</h3>
                <p className="metodologia-card-desc">{item.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <button
              className="hero-cta-primary"
              style={{ margin: '0 auto' }}
              onClick={() => navigate('/login')}
            >
              Começar minha jornada
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <span>🌿 Nutri Rita © {new Date().getFullYear()}</span>
        <span style={{ color: 'var(--lp-muted)' }}>Nutrição que transforma.</span>
      </footer>
    </div>
  )
}
