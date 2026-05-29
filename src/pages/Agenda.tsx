import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Paciente {
  id: string
  nome: string
  whatsapp?: string
}

interface Agendamento {
  id: string
  data_hora: string
  observacoes: string | null
  paciente_id: string
  pacientes: {
    nome: string
    whatsapp: string | null
  }
}

export default function Agenda() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  // Mapa persistente de overrides de status (id do evento -> status)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, 'Confirmado' | 'Pendente' | 'Cancelado'>>({}) 

  // Estados do Calendário
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'mensal' | 'semanal'>('mensal')
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  // Form states
  const [pacienteId, setPacienteId] = useState('')
  const [pacienteNomeSelecionado, setPacienteNomeSelecionado] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('09:00')
  const [observacoes, setObservacoes] = useState('')
  const [statusAgendamento, setStatusAgendamento] = useState<'Confirmado' | 'Pendente' | 'Cancelado'>('Confirmado')

  // Searchable select states
  const [searchPaciente, setSearchPaciente] = useState('')
  const [dropdownAberto, setDropdownAberto] = useState(false)

  // Feedback states
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Pacientes fictícios globais (mesmos do Pacientes.tsx)
  const fakePacientes: Paciente[] = [
    { id: 'fake-p1', nome: 'Maria Silva Oliveira',  whatsapp: '5511991234567' },
    { id: 'fake-p2', nome: 'João Pedro Santos',     whatsapp: '5511982345678' },
    { id: 'fake-p3', nome: 'Ana Beatriz Souza',     whatsapp: '5521993456789' },
    { id: 'fake-p4', nome: 'Marcos Vinícius Costa', whatsapp: '5531994567890' },
    { id: 'fake-p5', nome: 'Carolina Lima Dias',    whatsapp: '5541995678901' },
    { id: 'fake-p6', nome: 'Roberto Fonseca Neto',  whatsapp: '5551996789012' },
    { id: 'fake-p7', nome: 'Gabriela Vasconcelos',  whatsapp: '5561997890123' },
    { id: 'fake-p8', nome: 'Felipe Albuquerque',    whatsapp: '5571998901234' },
  ]

  // Mapa de whatsapp fictício por nome (para agendamentos fake da agenda)
  const whatsappPorNome: Record<string, string> = {
    'Maria Silva Oliveira':  '5511991234567',
    'João Pedro Santos':     '5511982345678',
    'Ana Beatriz Souza':     '5521993456789',
    'Marcos Vinícius Costa': '5531994567890',
    'Carolina Lima Dias':    '5541995678901',
    'Roberto Fonseca Neto':  '5551996789012',
    'Gabriela Vasconcelos':  '5561997890123',
    'Felipe Albuquerque':    '5571998901234',
  }

  // Retorna string correspondente a data de hoje + 30 dias no formato YYYY-MM-DD
  const obterData30Dias = () => {
    const dataFutura = new Date()
    dataFutura.setDate(dataFutura.getDate() + 30)
    const y = dataFutura.getFullYear()
    const m = String(dataFutura.getMonth() + 1).padStart(2, '0')
    const d = String(dataFutura.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id)
        fetchDados(session.user.id)
        // Inicializa com a data de 30 dias no futuro
        setData(obterData30Dias())
      } else {
        navigate('/login')
      }
    })
  }, [navigate])

  async function fetchDados(nutriId: string) {
    try {
      setLoading(true)
      setErrorMsg('')

      // 1. Buscar pacientes da nutricionista para o dropdown
      const { data: pacientesData, error: pacientesError } = await supabase
        .from('pacientes')
        .select('id, nome, whatsapp')
        .eq('nutricionista_id', nutriId)
        .order('nome', { ascending: true })

      if (pacientesError) throw pacientesError
      // Mesclar com pacientes fictícios (evitar duplicar por id)
      const reais: Paciente[] = (pacientesData || []).map(p => ({
        id: p.id,
        nome: p.nome,
        whatsapp: p.whatsapp ?? undefined,
      }))
      const merged = [...reais]
      fakePacientes.forEach(f => {
        if (!merged.some(r => r.id === f.id)) merged.push(f)
      })
      setPacientes(merged)

      // 2. Buscar agendamentos futuros e passados recentes
      const { data: agendamentosData, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select(`
          id,
          data_hora,
          observacoes,
          paciente_id,
          pacientes (
            nome,
            whatsapp
          )
        `)
        .eq('nutricionista_id', nutriId)
        .order('data_hora', { ascending: true })

      if (agendamentosError) throw agendamentosError
      setAgendamentos((agendamentosData as unknown as Agendamento[]) || [])

    } catch (err: any) {
      console.error('Erro ao buscar dados da agenda:', err)
      setErrorMsg('Não foi possível carregar as informações da agenda.')
    } finally {
      setLoading(false)
    }
  }

  // Define a data para hoje
  const definirHoje = () => {
    const hoje = new Date()
    const y = hoje.getFullYear()
    const m = String(hoje.getMonth() + 1).padStart(2, '0')
    const d = String(hoje.getDate()).padStart(2, '0')
    setData(`${y}-${m}-${d}`)
  }

  // Define a data para 30 dias no futuro
  const definir30Dias = () => {
    setData(obterData30Dias())
  }

  // Limpar seleção de paciente
  const limparSelecaoPaciente = () => {
    setPacienteId('')
    setPacienteNomeSelecionado('')
    setSearchPaciente('')
  }

  // Helper: retorna estilos de cor por status
  const getStatusStyle = (status: string): { bg: string; color: string; border: string } => {
    if (status === 'Confirmado') return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' }
    if (status === 'Pendente')   return { bg: '#fef9c3', color: '#92400e', border: '#fde68a' }
    return                              { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' }  // Cancelado
  }

  // Altera o status de um evento: salva no mapa de overrides E atualiza o modal em tempo real
  const handleAlterarStatus = (novoStatus: 'Confirmado' | 'Pendente' | 'Cancelado') => {
    if (!selectedEvent) return
    // Persiste o override no mapa de estado (sobrevive a re-renders)
    setStatusOverrides(prev => ({ ...prev, [selectedEvent.id]: novoStatus }))
    // Atualiza o modal imediatamente (feedback visual instantâneo)
    setSelectedEvent((prev: any) => ({ ...prev, status: novoStatus }))
  }

  async function handleAgendar(e: React.FormEvent) {
    e.preventDefault()
    if (!pacienteId || !data || !hora) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    try {
      setSubmitting(true)
      setErrorMsg('')
      setSuccessMsg('')

      const dataHoraStr = `${data}T${hora}:00`
      const dataHoraObj = new Date(dataHoraStr)
      const isFake = pacienteId.startsWith('fake-')

      if (isFake) {
        // Paciente fictício: salvar apenas no estado local
        const novoEvento = {
          id: `local-${Date.now()}`,
          paciente_nome: pacienteNomeSelecionado,
          data_hora: dataHoraObj.toISOString(),
          status: 'Pendente',
          observacoes: observacoes || null,
          isReal: false
        }
        // Adicionar aos eventos da agenda localmente via um agendamento fictício temporário
        setAgendamentos(prev => [
          ...prev,
          {
            id: novoEvento.id,
            data_hora: novoEvento.data_hora,
            observacoes: novoEvento.observacoes,
            paciente_id: pacienteId,
            pacientes: { nome: pacienteNomeSelecionado, whatsapp: null }
          } as any
        ])
      } else {
        // Paciente real: salvar no banco
        if (!userId) throw new Error('Usuário não autenticado')
        const { error } = await supabase
          .from('agendamentos')
          .insert({
            paciente_id: pacienteId,
            nutricionista_id: userId,
            data_hora: dataHoraObj.toISOString(),
            observacoes: observacoes || null
          })
        if (error) throw error
        fetchDados(userId)
      }

      setSuccessMsg(`Consulta de ${pacienteNomeSelecionado} agendada para ${new Date(dataHoraObj).toLocaleDateString('pt-BR')} às ${hora} — ${statusAgendamento}!`)
      limparSelecaoPaciente()
      setData(obterData30Dias())
      setHora('09:00')
      setObservacoes('')
      setStatusAgendamento('Confirmado')

    } catch (err: any) {
      console.error('Erro ao agendar:', err)
      setErrorMsg('Erro ao salvar o agendamento. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancelarAgendamento(id: string) {
    const confirm = window.confirm('Deseja realmente cancelar este agendamento?')
    if (!confirm || !userId) return

    try {
      setErrorMsg('')
      setSuccessMsg('')
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSuccessMsg('Agendamento cancelado com sucesso.')
      setSelectedEvent(null)
      fetchDados(userId)
    } catch (err) {
      console.error('Erro ao deletar agendamento:', err)
      setErrorMsg('Não foi possível cancelar o agendamento.')
    }
  }

  // --- LÓGICA DO CALENDÁRIO COM DADOS FICTÍCIOS ---
  
  // Lista rica de dados fictícios para preencher visualmente o calendário
  const getFakeAgendamentos = () => {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = hoje.getMonth()
    
    return [
      {
        id: 'fake-1',
        paciente_nome: 'Maria Silva Oliveira',
        data_hora: new Date(ano, mes, hoje.getDate() - 1, 9, 0).toISOString(),
        status: 'Confirmado',
        observacoes: 'Retorno de 30 dias. Avaliação física e ajuste calórico.'
      },
      {
        id: 'fake-2',
        paciente_nome: 'João Pedro Santos',
        data_hora: new Date(ano, mes, hoje.getDate(), 10, 30).toISOString(),
        status: 'Confirmado',
        observacoes: 'Acompanhamento nutricional focado em hipertrofia.'
      },
      {
        id: 'fake-3',
        paciente_nome: 'Ana Beatriz Souza',
        data_hora: new Date(ano, mes, hoje.getDate(), 14, 0).toISOString(),
        status: 'Pendente',
        observacoes: 'Primeira consulta. Anamnese clínica e hábitos alimentares.'
      },
      {
        id: 'fake-4',
        paciente_nome: 'Marcos Vinícius Costa',
        data_hora: new Date(ano, mes, hoje.getDate() + 1, 16, 0).toISOString(),
        status: 'Confirmado',
        observacoes: 'Paciente esportista, dieta para maratona.'
      },
      {
        id: 'fake-5',
        paciente_nome: 'Carolina Lima Dias',
        data_hora: new Date(ano, mes, hoje.getDate() + 2, 8, 30).toISOString(),
        status: 'Pendente',
        observacoes: 'Dieta gestacional para controle de glicemia.'
      },
      {
        id: 'fake-6',
        paciente_nome: 'Roberto Fonseca Neto',
        data_hora: new Date(ano, mes, hoje.getDate() + 3, 11, 0).toISOString(),
        status: 'Confirmado',
        observacoes: 'Ajuste de insulina e contagem de carboidratos.'
      },
      {
        id: 'fake-7',
        paciente_nome: 'Gabriela Vasconcelos',
        data_hora: new Date(ano, mes, hoje.getDate() - 3, 15, 30).toISOString(),
        status: 'Confirmado',
        observacoes: 'Melhora da saúde intestinal, foco em fibras e hidratação.'
      },
      {
        id: 'fake-8',
        paciente_nome: 'Felipe Albuquerque',
        data_hora: new Date(ano, mes, hoje.getDate() + 5, 14, 30).toISOString(),
        status: 'Pendente',
        observacoes: 'Cardápio vegetariano estrito para transição alimentar.'
      },
      {
        id: 'fake-9',
        paciente_nome: 'Maria Silva Oliveira',
        data_hora: new Date(ano, mes, hoje.getDate() - 5, 10, 0).toISOString(),
        status: 'Confirmado',
        observacoes: 'Avaliação inicial antropométrica.'
      },
      {
        id: 'fake-10',
        paciente_nome: 'João Pedro Santos',
        data_hora: new Date(ano, mes, hoje.getDate() - 2, 16, 0).toISOString(),
        status: 'Confirmado',
        observacoes: 'Ajuste de macros pós-treino.'
      },
      {
        id: 'fake-11',
        paciente_nome: 'Ana Beatriz Souza',
        data_hora: new Date(ano, mes, hoje.getDate() + 4, 14, 0).toISOString(),
        status: 'Pendente',
        observacoes: 'Retorno quinzenal para avaliação de sintomas intestinais.'
      },
      {
        id: 'fake-12',
        paciente_nome: 'Maria Silva Oliveira',
        data_hora: new Date(ano, mes, hoje.getDate() + 7, 10, 30).toISOString(),
        status: 'Pendente',
        observacoes: 'Entrega e explicação do novo plano alimentar.'
      }
    ]
  }

  // Mesclar dados reais do banco com fictícios, aplicando overrides de status
  const getTodosAgendamentos = () => {
    const reaisMapped = agendamentos.map(a => {
      const statusBase = (a as any)._status_local || (new Date(a.data_hora) < new Date() ? 'Confirmado' : 'Pendente')
      return {
        id: a.id,
        paciente_nome: a.pacientes?.nome || 'Paciente',
        data_hora: a.data_hora,
        // Override tem prioridade máxima
        status: statusOverrides[a.id] || statusBase,
        observacoes: a.observacoes,
        isReal: true,
        whatsapp: a.pacientes?.whatsapp
      }
    })

    // Aplicar overrides também nos eventos fictícios
    const fakeMapped = getFakeAgendamentos().map(ev => ({
      ...ev,
      status: statusOverrides[ev.id] || ev.status
    }))

    return [...reaisMapped, ...fakeMapped]
  }

  const todosEventos = getTodosAgendamentos()

  // Navegação no calendário
  const prevPeriod = () => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      if (viewMode === 'mensal') {
        d.setMonth(prev.getMonth() - 1)
      } else {
        d.setDate(prev.getDate() - 7)
      }
      return d
    })
  }

  const nextPeriod = () => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      if (viewMode === 'mensal') {
        d.setMonth(prev.getMonth() + 1)
      } else {
        d.setDate(prev.getDate() + 7)
      }
      return d
    })
  }

  // Métodos de construção do grid de dias
  const getDiasMensal = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const startDayOfWeek = firstDay.getDay()
    const days = []
    
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      })
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }
    
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      })
    }
    
    while (days.length < 42) {
      const lastVal = days[days.length - 1].date.getDate()
      days.push({
        date: new Date(year, month + 1, lastVal + 1),
        isCurrentMonth: false
      })
    }
    
    return days
  }

  const getDiasSemanal = () => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      days.push(d)
    }
    return days
  }

  // Filtrar eventos por dia específico
  const getEventosDoDia = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return todosEventos.filter(e => {
      const eventDateStr = new Date(e.data_hora).toISOString().split('T')[0]
      return eventDateStr === dateStr
    }).sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
  }

  const formatarHora = (dataHoraISO: string) => {
    const d = new Date(dataHoraISO)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const diasSemanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando agenda...</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Cabeçalho da Agenda */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--primary)', margin: 0 }}>
            Agenda Integrada
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Gerencie e acompanhe o agendamento de consultas da semana e do mês de forma centralizada.
          </p>
        </div>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div className="card" style={{ borderLeft: '4px solid var(--danger)', backgroundColor: '#fef2f2', color: '#991b1b', padding: '16px', marginBottom: '24px' }}>
          <strong>Erro:</strong> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="card" style={{ borderLeft: '4px solid var(--success)', backgroundColor: '#ecfdf5', color: '#065f46', padding: '16px', marginBottom: '24px' }}>
          {successMsg}
        </div>
      )}

      {/* Grid Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Formulário de Novo Agendamento */}
        <div className="card">
          <h2>Novo Agendamento</h2>
          <form onSubmit={handleAgendar} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-group" style={{ position: 'relative' }}>
              <label htmlFor="busca-paciente">Selecione o Paciente *</label>

              {/* Campo de busca */}
              {pacienteNomeSelecionado ? (
                // Paciente já selecionado: exibir chip com nome e botão de limpar
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  border: '2px solid var(--primary)',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary-light)',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: 'var(--primary)'
                }}>
                  <span>✅ {pacienteNomeSelecionado}</span>
                  <button
                    type="button"
                    onClick={limparSelecaoPaciente}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1 }}
                    title="Alterar paciente"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ position: 'relative' }}>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                    >
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      id="busca-paciente"
                      type="text"
                      value={searchPaciente}
                      onChange={(e) => { setSearchPaciente(e.target.value); setDropdownAberto(true) }}
                      onFocus={() => setDropdownAberto(true)}
                      onBlur={() => setTimeout(() => setDropdownAberto(false), 180)}
                      placeholder="Digite para buscar paciente..."
                      autoComplete="off"
                      style={{
                        paddingLeft: '36px',
                        width: '100%',
                        fontSize: '0.95rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        backgroundColor: '#fff'
                      }}
                    />
                  </div>

                  {/* Dropdown de resultados */}
                  {dropdownAberto && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      backgroundColor: '#fff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      boxShadow: 'var(--shadow-md)',
                      zIndex: 999,
                      maxHeight: '220px',
                      overflowY: 'auto'
                    }}>
                      {pacientes
                        .filter(p => p.nome.toLowerCase().includes(searchPaciente.toLowerCase()))
                        .length === 0 ? (
                        <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                          Nenhum paciente encontrado.
                        </div>
                      ) : (
                        pacientes
                          .filter(p => p.nome.toLowerCase().includes(searchPaciente.toLowerCase()))
                          .map(p => (
                            <div
                              key={p.id}
                              onMouseDown={() => {
                                setPacienteId(p.id)
                                setPacienteNomeSelecionado(p.nome)
                                setSearchPaciente('')
                                setDropdownAberto(false)
                              }}
                              style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                                fontSize: '0.92rem',
                                color: 'var(--text-dark)',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'background 0.15s'
                              }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--primary-light)')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <div style={{
                                width: '30px', height: '30px', borderRadius: '50%',
                                backgroundColor: 'var(--primary)', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.85rem', fontWeight: '700', flexShrink: 0
                              }}>
                                {p.nome.charAt(0)}
                              </div>
                              {p.nome}
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>Data da Consulta *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button" 
                    onClick={definirHoje}
                    style={{ fontSize: '0.75rem', padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', background: '#fff' }}
                  >
                    Hoje
                  </button>
                  <button 
                    type="button" 
                    onClick={definir30Dias}
                    style={{ fontSize: '0.75rem', padding: '4px 8px', border: '1px solid var(--primary)', borderRadius: '4px', cursor: 'pointer', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '600' }}
                  >
                    Retorno (30 dias)
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="hora">Hora *</label>
              <input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
              />
            </div>


            <div className="form-group">
              <label htmlFor="observacoes">Notas da Consulta</label>
              <textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Primeira avaliação de bioimpedância."
                rows={3}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={submitting}
              style={{ width: '100%' }}
            >
              {submitting ? 'Aguarde...' : 'Agendar Consulta'}
            </button>
          </form>
        </div>

        {/* Calendário Interativo */}
        <div className="card" style={{ padding: '20px' }}>
          
          {/* Header do Calendário */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--primary)' }}>
                {viewMode === 'mensal' 
                  ? `${mesesNomes[currentDate.getMonth()]} de ${currentDate.getFullYear()}`
                  : `Semana de ${currentDate.getDate()} ${mesesNomes[currentDate.getMonth()]}`}
              </h2>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={prevPeriod} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>&larr;</button>
                <button onClick={() => setCurrentDate(new Date())} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Hoje</button>
                <button onClick={nextPeriod} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>&rarr;</button>
              </div>
            </div>

            <div className="calendar-view-selector" style={{ margin: 0 }}>
              <button 
                type="button" 
                className={`btn ${viewMode === 'mensal' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('mensal')}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Mensal
              </button>
              <button 
                type="button" 
                className={`btn ${viewMode === 'semanal' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('semanal')}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Semanal
              </button>
            </div>
          </div>

          {/* Renderização do Calendário Mensal */}
          {viewMode === 'mensal' ? (
            <div className="calendar-grid">
              {diasSemanaNomes.map((d, idx) => (
                <div key={idx} className="calendar-header-cell">{d}</div>
              ))}
              
              {getDiasMensal().map((dCell, idx) => {
                const diaEventos = getEventosDoDia(dCell.date)
                const isHoje = dCell.date.toDateString() === new Date().toDateString()
                
                return (
                  <div 
                    key={idx} 
                    className={`calendar-day-cell ${!dCell.isCurrentMonth ? 'other-month' : ''} ${isHoje ? 'today' : ''}`}
                  >
                    <div className="calendar-day-number">{dCell.date.getDate()}</div>
                    <div className="calendar-day-events">
                      {diaEventos.map((ev) => {
                        const st = getStatusStyle(ev.status)
                        return (
                          <div 
                            key={ev.id} 
                            className={`calendar-event-card ${ev.status.toLowerCase()}`}
                            onClick={() => setSelectedEvent(ev)}
                            title={`${formatarHora(ev.data_hora)} - ${ev.paciente_nome} [${ev.status}]`}
                          >
                            <span className="event-time">{formatarHora(ev.data_hora)}</span>
                            <span className="event-name">{ev.paciente_nome}</span>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: '20px',
                              backgroundColor: st.bg,
                              color: st.color,
                              border: `1px solid ${st.border}`,
                              marginTop: '3px',
                              display: 'inline-block',
                              letterSpacing: '0.02em'
                            }}>{ev.status}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            // Renderização do Calendário Semanal
            <div className="weekly-calendar-grid">
              {getDiasSemanal().map((dia, idx) => {
                const diaEventos = getEventosDoDia(dia)
                const isHoje = dia.toDateString() === new Date().toDateString()
                
                return (
                  <div key={idx} className="weekly-day-row">
                    <div className="weekly-day-info" style={{ backgroundColor: isHoje ? 'var(--primary-light)' : '#fcfdfc' }}>
                      <span className="weekly-day-name">{diasSemanaNomes[dia.getDay()]}</span>
                      <span className="weekly-day-date">{dia.getDate()} / {mesesNomes[dia.getMonth()]}</span>
                    </div>
                    <div className="weekly-day-events">
                      {diaEventos.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                          Nenhuma consulta agendada.
                        </span>
                      ) : (
                        diaEventos.map((ev) => {
                          const st = getStatusStyle(ev.status)
                          return (
                            <div 
                              key={ev.id} 
                              className={`calendar-event-card ${ev.status.toLowerCase()}`}
                              onClick={() => setSelectedEvent(ev)}
                              style={{ minWidth: '160px', padding: '10px 12px', fontSize: '0.85rem' }}
                            >
                              <span className="event-time" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{formatarHora(ev.data_hora)}</span>
                              <span className="event-name" style={{ fontSize: '0.9rem' }}>{ev.paciente_nome}</span>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '20px',
                                backgroundColor: st.bg,
                                color: st.color,
                                border: `1px solid ${st.border}`,
                                marginTop: '4px',
                                display: 'inline-block'
                              }}>{ev.status}</span>
                              {ev.observacoes && (
                                <span style={{ fontSize: '0.75rem', opacity: 0.8, fontStyle: 'italic', marginTop: '4px' }}>
                                  {ev.observacoes.slice(0, 30)}{ev.observacoes.length > 30 ? '...' : ''}
                                </span>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>

      </div>

      {/* MODAL DE DETALHES DO EVENTO */}
      {selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-card animate-scale-in">
            <div className="modal-header">
              <h3>Detalhes do Agendamento</h3>
              <button className="btn-close-modal" onClick={() => setSelectedEvent(null)}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Paciente + WhatsApp */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Paciente</strong>
                  <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-dark)' }}>{selectedEvent.paciente_nome}</span>
                </div>

                {/* Bloco WhatsApp */}
                {(() => {
                  const wpp = selectedEvent.whatsapp || whatsappPorNome[selectedEvent.paciente_nome]
                  if (!wpp) return null
                  const dataFormatada = new Date(selectedEvent.data_hora).toLocaleDateString('pt-BR')
                  const horaFormatada = formatarHora(selectedEvent.data_hora)
                  const msg = encodeURIComponent(`Olá ${selectedEvent.paciente_nome.split(' ')[0]}! 🌿 Passando para confirmar sua consulta marcada para o dia *${dataFormatada}* às *${horaFormatada}h*. Pode confirmar sua presença?`)
                  const wppLink = `https://wa.me/${wpp}?text=${msg}`
                  const wppFormatado = wpp.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <strong style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WhatsApp</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-dark)', fontSize: '0.9rem' }}>{wppFormatado}</span>
                        <a
                          href={wppLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            borderRadius: '20px',
                            backgroundColor: '#25D366',
                            color: '#fff',
                            fontWeight: '700',
                            fontSize: '0.82rem',
                            textDecoration: 'none',
                            boxShadow: '0 2px 8px rgba(37,211,102,0.35)',
                            transition: 'opacity 0.15s'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                          Confirmar via WhatsApp
                        </a>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Data e Hora */}
              <div>
                <strong style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Data e Hora</strong>
                <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '1rem' }}>
                  {new Date(selectedEvent.data_hora).toLocaleDateString('pt-BR')} às {formatarHora(selectedEvent.data_hora)}
                </span>
              </div>

              {/* Seletor de Status */}
              <div>
                <strong style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Status da Consulta</strong>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(['Confirmado', 'Pendente', 'Cancelado'] as const).map(s => {
                    const st = getStatusStyle(s)
                    const isActive = selectedEvent.status === s
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleAlterarStatus(s)}
                        style={{
                          flex: 1,
                          padding: '10px 6px',
                          borderRadius: '10px',
                          border: `2px solid ${isActive ? st.border : 'var(--border-color)'}`,
                          backgroundColor: isActive ? st.bg : '#fff',
                          color: isActive ? st.color : 'var(--text-muted)',
                          fontWeight: isActive ? '700' : '500',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          boxShadow: isActive ? `0 0 0 3px ${st.border}` : 'none'
                        }}
                      >
                        {s === 'Confirmado' && '✅ '}
                        {s === 'Pendente'   && '⏳ '}
                        {s === 'Cancelado'  && '❌ '}
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Notas */}
              {selectedEvent.observacoes && (
                <div>
                  <strong style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Notas de Acompanhamento</strong>
                  <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-dark)', lineHeight: '1.6' }}>
                    {selectedEvent.observacoes}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedEvent.isReal ? (
                <button 
                  type="button" 
                  className="btn" 
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}
                  onClick={() => handleCancelarAgendamento(selectedEvent.id)}
                >
                  Cancelar Consulta
                </button>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', alignSelf: 'center', marginRight: 'auto' }}>
                  * Agendamento Demonstrativo
                </span>
              )}
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setSelectedEvent(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
