import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import authBg from '../assets/auth-bg.png'

type View = 'login' | 'cadastro'

interface FeedbackMsg {
  type: 'error' | 'success'
  text: string
}

export default function Login() {
  const navigate = useNavigate()
  const [view, setView] = useState<View>('login')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackMsg | null>(null)

  // campos
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)

  const resetForm = () => {
    setNome(''); setEmail(''); setSenha(''); setConfirmarSenha('')
    setFeedback(null); setShowSenha(false); setShowConfirmar(false)
  }

  const trocarView = (v: View) => { resetForm(); setView(v) }

  /* ─── Login ─── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setFeedback(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      const msg =
        error.message.includes('Invalid login') ? 'E-mail ou senha incorretos.' :
        error.message.includes('Email not confirmed') ? 'Confirme seu e-mail antes de entrar.' :
        'Erro ao fazer login. Tente novamente.'
      setFeedback({ type: 'error', text: msg })
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  /* ─── Cadastro ─── */
  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)

    if (nome.trim().length < 3) {
      setFeedback({ type: 'error', text: 'Digite seu nome completo (mín. 3 caracteres).' }); return
    }
    if (senha.length < 6) {
      setFeedback({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres.' }); return
    }
    if (senha !== confirmarSenha) {
      setFeedback({ type: 'error', text: 'As senhas não coincidem. Verifique e tente novamente.' }); return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password: senha })

    if (error) {
      const msg =
        error.message.includes('already registered') ? 'Este e-mail já está cadastrado.' :
        error.message.includes('invalid') ? 'E-mail inválido. Verifique e tente novamente.' :
        'Erro ao criar conta. Tente novamente.'
      setFeedback({ type: 'error', text: msg })
    } else if (data.user) {
      // Salvar nome e email na tabela nutricionistas
      await supabase.from('nutricionistas').insert([
        { id: data.user.id, nome: nome.trim(), email }
      ])
      setFeedback({ type: 'success', text: '🎉 Conta criada! Verifique seu e-mail para confirmar o cadastro.' })
      setTimeout(() => trocarView('login'), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="auth-root">
      {/* Fundo com imagem + overlay gradiente */}
      <div className="auth-bg">
        <img src={authBg} alt="" className="auth-bg-img" />
        <div className="auth-bg-overlay" />
      </div>

      {/* Orbs decorativos animados */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      {/* Container central */}
      <div className="auth-wrapper">

        {/* Header — Logo */}
        <div className="auth-logo-area">
          <div className="auth-logo-icon">🌿</div>
          <h1 className="auth-logo-text">Nutri Rita</h1>
          <p className="auth-logo-sub">Plataforma de Nutrição Personalizada</p>
        </div>

        {/* Card de autenticação */}
        <div className="auth-card">

          {/* Tabs Login / Cadastro */}
          <div className="auth-tabs">
            <button
              id="tab-login"
              className={`auth-tab ${view === 'login' ? 'active' : ''}`}
              onClick={() => trocarView('login')}
            >
              Entrar
            </button>
            <button
              id="tab-cadastro"
              className={`auth-tab ${view === 'cadastro' ? 'active' : ''}`}
              onClick={() => trocarView('cadastro')}
            >
              Criar conta
            </button>
            {/* Indicador deslizante */}
            <span className={`auth-tab-slider ${view === 'cadastro' ? 'right' : ''}`} />
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`auth-feedback auth-feedback--${feedback.type}`}>
              <span className="auth-feedback-icon">
                {feedback.type === 'error' ? '⚠️' : '✅'}
              </span>
              {feedback.text}
            </div>
          )}

          {/* ─── FORM LOGIN ─── */}
          {view === 'login' && (
            <form id="form-login" className="auth-form" onSubmit={handleLogin}>
              <p className="auth-form-subtitle">Bem-vinda de volta! ✨</p>

              <div className="auth-field">
                <label htmlFor="login-email">E-mail</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">📧</span>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="login-senha">Senha</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">🔒</span>
                  <input
                    id="login-senha"
                    type={showSenha ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-toggle-pw"
                    onClick={() => setShowSenha(p => !p)}
                    aria-label="Mostrar/ocultar senha"
                  >
                    {showSenha ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button id="btn-login" type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : null}
                {loading ? 'Entrando...' : 'Entrar no painel'}
              </button>

              <p className="auth-switch-text">
                Ainda não tem conta?{' '}
                <button type="button" className="auth-link" onClick={() => trocarView('cadastro')}>
                  Cadastre-se grátis
                </button>
              </p>
            </form>
          )}

          {/* ─── FORM CADASTRO ─── */}
          {view === 'cadastro' && (
            <form id="form-cadastro" className="auth-form" onSubmit={handleCadastro}>
              <p className="auth-form-subtitle">Crie sua conta profissional 🚀</p>

              <div className="auth-field">
                <label htmlFor="cad-nome">Nome Completo</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">👤</span>
                  <input
                    id="cad-nome"
                    type="text"
                    placeholder="Dra. Rita Souza"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="cad-email">E-mail profissional</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">📧</span>
                  <input
                    id="cad-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="cad-senha">
                  Senha
                  <span className="auth-field-hint">mín. 6 caracteres</span>
                </label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">🔒</span>
                  <input
                    id="cad-senha"
                    type={showSenha ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-toggle-pw"
                    onClick={() => setShowSenha(p => !p)}
                    aria-label="Mostrar/ocultar senha"
                  >
                    {showSenha ? '🙈' : '👁️'}
                  </button>
                </div>
                {/* Barra de força da senha */}
                {senha.length > 0 && (
                  <div className="auth-pw-strength">
                    <div
                      className="auth-pw-strength-bar"
                      data-strength={
                        senha.length < 6 ? 'fraca' :
                        senha.length < 10 ? 'media' : 'forte'
                      }
                    />
                    <span className="auth-pw-strength-label">
                      {senha.length < 6 ? 'Fraca' : senha.length < 10 ? 'Média' : 'Forte'}
                    </span>
                  </div>
                )}
              </div>

              <div className="auth-field">
                <label htmlFor="cad-confirmar">Confirmar Senha</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">🔐</span>
                  <input
                    id="cad-confirmar"
                    type={showConfirmar ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmarSenha}
                    onChange={e => setConfirmarSenha(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-toggle-pw"
                    onClick={() => setShowConfirmar(p => !p)}
                    aria-label="Mostrar/ocultar confirmação"
                  >
                    {showConfirmar ? '🙈' : '👁️'}
                  </button>
                </div>
                {/* Indicador de match */}
                {confirmarSenha.length > 0 && (
                  <span className={`auth-match-hint ${senha === confirmarSenha ? 'match' : 'no-match'}`}>
                    {senha === confirmarSenha ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                  </span>
                )}
              </div>

              <button id="btn-cadastro" type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : null}
                {loading ? 'Criando conta...' : 'Criar minha conta'}
              </button>

              <p className="auth-switch-text">
                Já tem uma conta?{' '}
                <button type="button" className="auth-link" onClick={() => trocarView('login')}>
                  Faça login
                </button>
              </p>
            </form>
          )}
        </div>

        <p className="auth-footer-text">
          🔒 Seus dados são protegidos com criptografia de ponta a ponta.
        </p>
      </div>
    </div>
  )
}
