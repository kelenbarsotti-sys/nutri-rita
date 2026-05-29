import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [authNome, setAuthNome] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    if (isRegistering) {
      if (authPassword !== confirmPassword) {
        alert('As senhas não coincidem!')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      })

      if (error) {
        alert(error.message)
      } else if (data.user) {
        // Salvar o nome na tabela nutricionistas
        const { error: profileError } = await supabase
          .from('nutricionistas')
          .insert([
            { id: data.user.id, nome: authNome, email: authEmail }
          ])
        
        if (profileError) {
          console.error('Erro ao salvar perfil da nutricionista:', profileError)
        }
        
        alert('Cadastro realizado! Faça login com a sua conta.')
        setIsRegistering(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      })
      if (error) {
        alert(error.message)
      } else {
        navigate('/dashboard')
      }
    }
    setLoading(false)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)',
      padding: '20px'
    }}>
      <div className="card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '40px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        backgroundColor: 'var(--card-bg)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '2.2rem',
            fontWeight: '800',
            color: 'var(--primary)',
            margin: '0 0 8px 0',
            letterSpacing: '-1px'
          }}>Nutri Rita</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {isRegistering ? 'Crie sua conta profissional' : 'Faça login para acessar o painel'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
          {isRegistering && (
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label>Nome Completo</label>
              <input 
                type="text" 
                value={authNome} 
                onChange={(e) => setAuthNome(e.target.value)} 
                placeholder="Ex: Dra. Rita Souza"
                required 
              />
            </div>
          )}

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label>E-mail profissional</label>
            <input 
              type="email" 
              value={authEmail} 
              onChange={(e) => setAuthEmail(e.target.value)} 
              placeholder="exemplo@email.com"
              required 
            />
          </div>

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label>Senha</label>
            <input 
              type="password" 
              value={authPassword} 
              onChange={(e) => setAuthPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>

          {isRegistering && (
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label>Confirmar Senha</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', marginTop: '8px', padding: '14px' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span>
                Carregando...
              </span>
            ) : (
              isRegistering ? 'Criar conta profissional' : 'Entrar no painel'
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {isRegistering ? (
              <>
                Já possui uma conta?{' '}
                <span 
                  style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '700' }}
                  onClick={() => setIsRegistering(false)}
                >
                  Faça login
                </span>
              </>
            ) : (
              <>
                Ainda não tem cadastro?{' '}
                <span 
                  style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '700' }}
                  onClick={() => setIsRegistering(true)}
                >
                  Cadastre-se aqui
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
