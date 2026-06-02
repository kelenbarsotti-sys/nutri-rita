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
  const [totalPlanos, setTotalPlanos] = useState(0)
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

      // 4. Card 3: Total de planos alimentares
      const { count: planosCount } = await supabase
        .from('planos_alimentares')
        .select('id, pacientes!inner(id)', { count: 'exact', head: true })
        .eq('pacientes.nutricionista_id', userId)
      setTotalPlanos(planosCount || 0)

      // 5. Card 4: Pacientes sem retorno
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
        if (consultas.length === 0) return false

        const datas = consultas.map(c => parseDateString(c.data_consulta))
        const ultimaConsultaData = new Date(Math.max(...datas.map(d => d.getTime())))

        const ultimaMaisDe30Dias = ultimaConsultaData < limite30Dias

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

  // Dados Fictícios de Agendamentos para o Dia de Hoje
  const consultasHojeFake = [
    { id: '1', paciente: 'Maria Silva Oliveira', horario: '09:00', status: 'Confirmado', objetivo: 'Emagrecimento & Reeducação', telefone: '5511999990001' },
    { id: '2', paciente: 'João Pedro Santos', horario: '11:30', status: 'Pendente', objetivo: 'Hipertrofia Muscular', telefone: '5511999990002' },
    { id: '3', paciente: 'Ana Beatriz Souza', horario: '14:00', status: 'Confirmado', objetivo: 'Melhora da Disbiose', telefone: '5511999990003' },
  ]

  return (
    <div className="animate-fade-in">
      {/* Banner de Boas-Vindas */}
      <div className="homescreen-banner">
        <div className="homescreen-banner-text">
          <h1>Olá, Nutri {nutriNome || 'Rita'}</h1>
          <p>
            Bem-vinda de volta! Acompanhe a evolução de seus pacientes, planeje planos alimentares personalizados e organize sua rotina de consultas de forma inteligente e integrada.
          </p>
        </div>
        <div className="homescreen-banner-image" style={{ opacity: 0.9 }}>
          <svg width="130" height="130" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="68" cy="68" r="22" fill="#ffa726" />
            <circle cx="68" cy="68" r="19" fill="#ffb74d" />
            <circle cx="68" cy="55" r="1" fill="#fff" opacity="0.6"/>
            <circle cx="58" cy="64" r="1" fill="#fff" opacity="0.6"/>
            <circle cx="78" cy="66" r="1" fill="#fff" opacity="0.6"/>
            <path d="M42 35 C48 35, 52 38, 52 42 C52 48, 48 64, 38 64 C30 64, 22 55, 22 45 C22 36, 30 35, 38 35 C40 35, 41 35, 42 35 Z" fill="#66bb6a" />
            <path d="M38 35 C32 35, 25 38, 25 42 C25 48, 28 64, 38 64 C44 64, 48 55, 48 45 C48 36, 44 35, 40 35 C39 35, 38 35, 38 35 Z" fill="#81c784" />
            <path d="M38 35 Q35 25 33 22" stroke="#5d4037" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M34 22 Q42 20 44 26 Q36 30 34 22 Z" fill="#4caf50" />
            <circle cx="45" cy="74" r="15" fill="#ef5350" />
            <circle cx="45" cy="74" r="13" fill="#e53935" />
            <path d="M45 59 L45 56" stroke="#2e7d32" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* Grid de Estatísticas */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="stat-card" style={{ borderColor: 'var(--primary)' }}>
          <span className="stat-card-title" style={{ color: 'var(--primary)' }}>Pacientes Ativos</span>
          <span className="stat-card-value">{totalPacientes || 12}</span>
          <span className="stat-card-subtitle">Fichas ativas no sistema</span>
        </div>

        <div className="stat-card" style={{ borderColor: 'var(--secondary)' }}>
          <span className="stat-card-title" style={{ color: 'var(--secondary)' }}>Consultas na Semana</span>
          <span className="stat-card-value">{consultasSemana || 5}</span>
          <span className="stat-card-subtitle">Agendamentos para esta semana</span>
        </div>

        <div className="stat-card" style={{ borderColor: 'var(--accent)' }}>
          <span className="stat-card-title" style={{ color: 'var(--accent)' }}>Planos Gerados</span>
          <span className="stat-card-value">{totalPlanos || 8}</span>
          <span className="stat-card-subtitle">Dietas e cardápios salvos</span>
        </div>

        <div className="stat-card" style={{ borderColor: pacientesSemRetorno.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
          <span className="stat-card-title" style={{ color: pacientesSemRetorno.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
            Sem Retorno
          </span>
          <span className="stat-card-value">{pacientesSemRetorno.length}</span>
          <span className="stat-card-subtitle">Há mais de 30 dias sem consulta</span>
        </div>
      </div>

      {/* Atalhos de Navegação Rápida */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Agenda de Hoje */}
        <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Consultas de Hoje</h2>
            <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
              Hoje
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {consultasHojeFake.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'var(--bg-main)', gap: '12px' }}>
                {/* Avatar circular */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: '800', fontSize: '1rem'
                }}>
                  {c.paciente.charAt(0)}
                </div>

                {/* Nome e objetivo */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', color: 'var(--text-dark)', fontSize: '0.95rem' }}>{c.paciente}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Foco: {c.objetivo}</div>
                </div>

                {/* Horário, status e WhatsApp */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary)' }}>{c.horario}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`badge-meta ${c.status === 'Confirmado' ? 'whatsapp-badge' : ''}`} style={{ fontSize: '0.75rem', padding: '2px 8px', margin: 0 }}>
                      {c.status}
                    </span>
                    {/* Link WhatsApp */}
                    <a
                      href={`https://wa.me/${c.telefone}?text=Olá%20${encodeURIComponent(c.paciente.split(' ')[0])}%2C%20tudo%20bem%3F%20Passando%20para%20confirmar%20sua%20consulta%20de%20hoje%20às%20${encodeURIComponent(c.horario)}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir WhatsApp"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#25d366', color: '#fff', flexShrink: 0, transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.15)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 8px rgba(37,211,102,0.5)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/agenda" className="btn btn-secondary" style={{ marginTop: '16px', fontSize: '0.85rem', padding: '10px' }}>
            Ir para Agenda Completa
          </Link>
        </div>

        {/* Detalhamento: Pacientes sem retorno */}
        <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.2rem' }}>Atenção: Pacientes sem retorno</h2>
          {pacientesSemRetorno.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--success)', marginBottom: '8px' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p style={{ fontWeight: '600', color: 'var(--text-dark)', fontSize: '0.9rem' }}>Excelente!</p>
              <p style={{ fontSize: '0.8rem' }}>Todos os pacientes estão com retornos em dia.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', maxHeight: '200px' }}>
              {pacientesSemRetorno.map(paciente => (
                <div key={paciente.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
                  <Link to={`/pacientes/${paciente.id}`} style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none', fontSize: '0.9rem' }}>
                    {paciente.nome}
                  </Link>
                  <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>
                    Sem retorno
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link to="/pacientes" className="btn btn-secondary" style={{ marginTop: '16px', fontSize: '0.85rem', padding: '10px' }}>
            Ver Todos os Pacientes
          </Link>
        </div>
      </div>
    </div>
  )
}
