import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Consulta {
  data_consulta: string;
  proximo_retorno: string | null;
}

interface Paciente {
  id: string;
  nome: string;
  consultas: Consulta[];
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [nutriNome, setNutriNome] = useState('')
  const [totalPacientes, setTotalPacientes] = useState(0)
  const [consultasSemana, setConsultasSemana] = useState(0)
  const [pacientesSemRetorno, setPacientesSemRetorno] = useState<Paciente[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Converte string 'YYYY-MM-DD' para objeto Date local
  const parseDateString = (str: string) => {
    const [year, month, day] = str.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  async function fetchDashboardData() {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const userId = session.user.id

      // 1. Buscar o nome da nutricionista
      const { data: nutriData } = await supabase
        .from('nutricionistas')
        .select('nome')
        .eq('id', userId)
        .single()
      
      if (nutriData) {
        setNutriNome(nutriData.nome)
      }

      // 2. Card 1: Total de pacientes ativos da nutricionista
      const { count, error: countError } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .eq('nutricionista_id', userId)

      if (countError) throw countError
      setTotalPacientes(count || 0)

      // 3. Card 2: Consultas da semana atual
      // Calcular início (domingo) e fim (sábado) da semana atual
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      const startOfWeek = new Date(hoje)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day // ajusta para o domingo
      startOfWeek.setDate(diff)

      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)

      const dataInicio = formatDate(startOfWeek)
      const dataFim = formatDate(endOfWeek)

      const { data: consultasData, error: queriesSemanaError } = await supabase
        .from('consultas')
        .select('id, data_consulta, pacientes!inner(nutricionista_id)')
        .eq('pacientes.nutricionista_id', userId)
        .gte('data_consulta', dataInicio)
        .lte('data_consulta', dataFim)

      if (queriesSemanaError) throw queriesSemanaError
      setConsultasSemana(consultasData?.length || 0)

      // 4. Card 3: Pacientes sem retorno
      // Buscar todos os pacientes da nutricionista com suas respectivas consultas
      const { data: pacientesComConsultas, error: pacientesError } = await supabase
        .from('pacientes')
        .select('id, nome, consultas(data_consulta, proximo_retorno)')
        .eq('nutricionista_id', userId)

      if (pacientesError) throw pacientesError

      const limite30Dias = new Date(hoje)
      limite30Dias.setDate(hoje.getDate() - 30)
      limite30Dias.setHours(23, 59, 59, 999)

      const semRetorno = (pacientesComConsultas || []).filter(p => {
        const consultas = (p.consultas as unknown as Consulta[]) || []
        if (consultas.length === 0) return false // Não tem nenhuma consulta

        // Achar a consulta mais recente
        const datas = consultas.map(c => parseDateString(c.data_consulta))
        const ultimaConsultaData = new Date(Math.max(...datas.map(d => d.getTime())))

        // última consulta foi há mais de 30 dias?
        const ultimaMaisDe30Dias = ultimaConsultaData < limite30Dias

        // Possui algum próximo retorno agendado hoje ou no futuro?
        const temRetornoFuturo = consultas.some(c => {
          if (!c.proximo_retorno) return false
          const retornoData = parseDateString(c.proximo_retorno)
          return retornoData >= hoje
        })

        return ultimaMaisDe30Dias && !temRetornoFuturo
      }) as Paciente[]

      setPacientesSemRetorno(semRetorno)

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando informações do dashboard...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
            Olá, {nutriNome || 'Nutricionista'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Acompanhe o andamento dos seus pacientes e consultas esta semana.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchDashboardData} style={{ padding: '10px 16px', fontSize: '0.9rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          Atualizar dados
        </button>
      </div>

      {/* Grid de Estatísticas */}
      <div className="dashboard-grid">
        {/* Card 1: Total de pacientes */}
        <div className="stat-card">
          <span className="stat-card-title">Pacientes Ativos</span>
          <span className="stat-card-value">{totalPacientes}</span>
          <span className="stat-card-subtitle">Total de pacientes cadastrados por você</span>
        </div>

        {/* Card 2: Consultas da semana */}
        <div className="stat-card" style={{ borderColor: 'var(--secondary)' }}>
          <span className="stat-card-title" style={{ color: 'var(--secondary)' }}>Consultas da Semana</span>
          <span className="stat-card-value">{consultasSemana}</span>
          <span className="stat-card-subtitle">Consultas agendadas ou realizadas esta semana</span>
        </div>

        {/* Card 3: Pacientes sem retorno */}
        <div className="stat-card" style={{ gridColumn: 'span 1', borderColor: pacientesSemRetorno.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
          <span className="stat-card-title" style={{ color: pacientesSemRetorno.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
            Pacientes sem Retorno
          </span>
          <span className="stat-card-value">{pacientesSemRetorno.length}</span>
          <span className="stat-card-subtitle">Última consulta há +30 dias e sem retorno marcado</span>
        </div>
      </div>

      {/* Lista detalhada dos pacientes sem retorno */}
      <div className="card">
        <h2>Detalhamento: Pacientes sem retorno</h2>
        {pacientesSemRetorno.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--success)', marginBottom: '12px' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p style={{ fontWeight: '600', color: 'var(--text-dark)' }}>Excelente!</p>
            <p>Nenhum paciente sem retorno no momento.</p>
          </div>
        ) : (
          <div className="stat-card-list-container">
            <ul className="unreturned-list">
              {pacientesSemRetorno.map(paciente => (
                <li key={paciente.id} className="unreturned-item">
                  <Link to={`/pacientes/${paciente.id}`} className="unreturned-link">
                    {paciente.nome}
                    <span>Sem retorno</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
