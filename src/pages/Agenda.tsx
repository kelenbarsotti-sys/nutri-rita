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

  // Form states
  const [pacienteId, setPacienteId] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('09:00')
  const [observacoes, setObservacoes] = useState('')
  
  // Feedback states
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

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
      setPacientes(pacientesData || [])

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

  async function handleAgendar(e: React.FormEvent) {
    e.preventDefault()
    if (!pacienteId || !data || !hora || !userId) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    try {
      setSubmitting(true)
      setErrorMsg('')
      setSuccessMsg('')

      // Mesclar data e hora
      const dataHoraStr = `${data}T${hora}:00`
      const dataHoraObj = new Date(dataHoraStr)

      const { error } = await supabase
        .from('agendamentos')
        .insert({
          paciente_id: pacienteId,
          nutricionista_id: userId,
          data_hora: dataHoraObj.toISOString(),
          observacoes: observacoes || null
        })

      if (error) throw error

      setSuccessMsg('Consulta agendada com sucesso!')
      
      // Limpar formulário parcialmente (mantém paciente vazio e data redefinida para +30 dias)
      setPacienteId('')
      setData(obterData30Dias())
      setHora('09:00')
      setObservacoes('')

      // Recarregar agendamentos
      fetchDados(userId)

    } catch (err: any) {
      console.error('Erro ao agendar:', err)
      setErrorMsg('Erro ao salvar o agendamento no banco de dados.')
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
      fetchDados(userId)
    } catch (err) {
      console.error('Erro ao deletar agendamento:', err)
      setErrorMsg('Não foi possível cancelar o agendamento.')
    }
  }

  // Formatar a exibição de data e hora local
  const formatarDataHora = (dataHoraISO: string) => {
    const dataObj = new Date(dataHoraISO)
    const dataStr = dataObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    const horaStr = dataObj.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
    return `${dataStr} às ${horaStr}`
  }

  // Filtrar agendamentos futuros
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  
  const proximosAgendamentos = agendamentos.filter(a => new Date(a.data_hora) >= hoje)
  const agendamentosPassados = agendamentos.filter(a => new Date(a.data_hora) < hoje).reverse()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando agenda...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
            Agenda de Pacientes
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Agende novas consultas ou gerencie os retornos de seus pacientes.
          </p>
        </div>
      </div>

      {/* Alertas de sucesso e erro */}
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Formulário de Novo Agendamento */}
        <div className="card">
          <h2>Novo Agendamento</h2>
          <form onSubmit={handleAgendar} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-group">
              <label htmlFor="paciente">Selecione o Paciente *</label>
              <select
                id="paciente"
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                required
              >
                <option value="">Selecione um paciente...</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
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
              <small style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.8rem' }}>
                * Pré-preenchido para 30 dias a partir de hoje (retorno recomendado).
              </small>
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
              <label htmlFor="observacoes">Observações / Notas</label>
              <textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Retorno de avaliação antropométrica, foco em perda de gordura..."
                rows={3}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={submitting}
              style={{ width: '100%', marginTop: '10px' }}
            >
              {submitting ? 'Salvando...' : 'Agendar Consulta'}
            </button>
          </form>
        </div>

        {/* Listagem de Agendamentos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card">
            <h2>Próximas Consultas ({proximosAgendamentos.length})</h2>
            
            {proximosAgendamentos.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <p style={{ fontWeight: '600' }}>Nenhuma consulta agendada</p>
                <p>Use o formulário ao lado para agendar uma nova consulta.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {proximosAgendamentos.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#fff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: 'var(--shadow-sm)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: 'var(--primary)' }}></div>
                    <div style={{ paddingLeft: '8px' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: 'var(--text-dark)' }}>
                        {agendamento.pacientes?.nome}
                      </h4>
                      <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '600' }}>
                        {formatarDataHora(agendamento.data_hora)}
                      </p>
                      {agendamento.observacoes && (
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Nota: {agendamento.observacoes}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {agendamento.pacientes?.whatsapp && (
                        <a
                          href={`https://wa.me/${agendamento.pacientes.whatsapp.replace(/\D/g, '')}?text=Olá,%20gostaria%20de%20confirmar%20sua%20consulta%20agendada%20para%20o%20dia%20${encodeURIComponent(formatarDataHora(agendamento.data_hora))}.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{
                            padding: '8px',
                            backgroundColor: '#25D366',
                            color: '#fff',
                            borderRadius: '6px',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Lembrete por WhatsApp"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.453L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.49 1.967 14.03 .942 11.996.942c-5.445 0-9.87 4.373-9.875 9.805-.002 1.794.494 3.542 1.439 5.093l-1.008 3.682 3.823-.988c1.558.835 3.087 1.24 4.692 1.24zm10.74-7.447c-.297-.148-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          </svg>
                        </a>
                      )}
                      
                      <button
                        onClick={() => handleCancelarAgendamento(agendamento.id)}
                        className="btn"
                        style={{
                          padding: '8px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: 'var(--danger)',
                          borderRadius: '6px',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Cancelar Agendamento"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Histórico Recente */}
          {agendamentosPassados.length > 0 && (
            <div className="card">
              <h2>Histórico Recente ({agendamentosPassados.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {agendamentosPassados.slice(0, 5).map((agendamento) => (
                  <div
                    key={agendamento.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-main)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      opacity: 0.8
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                        {agendamento.pacientes?.nome}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Realizado em {formatarDataHora(agendamento.data_hora)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
