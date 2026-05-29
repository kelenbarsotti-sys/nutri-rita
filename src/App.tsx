import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import PacientePerfil from './pages/PacientePerfil'
import PacienteCadastro from './pages/PacienteCadastro'
import Login from './pages/Login'
import Agenda from './pages/Agenda'
import PlanosAlimentares from './pages/PlanosAlimentares'
import './App.css'

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Busca inicial da sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Escuta mudanças no estado de autenticação (login/logout/signup)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="loading-container" style={{ height: '100vh' }}>
        <div className="spinner"></div>
        <p>Verificando autenticação...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page pública */}
        <Route
          path="/"
          element={!session ? <LandingPage /> : <Navigate to="/dashboard" replace />}
        />

        {/* Rota de Autenticação */}
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/dashboard" replace />} 
        />

        {/* Rotas Privadas (Protegidas pelo Layout) */}
        <Route 
          path="/dashboard" 
          element={session ? <Layout /> : <Navigate to="/login" replace />}
        >
          {/* Dashboard como página inicial */}
          <Route index element={<Dashboard />} />
          
          {/* Agenda */}
          <Route path="agenda" element={<Agenda />} />
          
          {/* Gerenciamento de Pacientes */}
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="pacientes/novo" element={<PacienteCadastro />} />
          
          {/* Perfil do Paciente */}
          <Route path="pacientes/:id" element={<PacientePerfil />} />
          
          {/* Planos Alimentares */}
          <Route path="planos-alimentares" element={<PlanosAlimentares />} />
        </Route>

        {/* Redirecionamento padrão para rotas não mapeadas */}
        <Route path="*" element={<Navigate to={session ? "/dashboard" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
