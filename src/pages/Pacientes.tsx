import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Consulta {
  data_consulta: string
}

interface Paciente {
  id: string
  nome: string
  objetivos: string[]
  objetivo_texto: string | null
  consultas: Consulta[]
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchPacientes(session.user.id)
      } else {
        navigate('/login')
      }
    })
  }, [navigate])

  async function fetchPacientes(userId: string) {
    try {
      setLoading(true)
      
      // Buscar pacientes com o histórico de datas das consultas
      const { data, error } = await supabase
        .from('pacientes')
        .select('id, nome, objetivos, objetivo_texto, consultas(data_consulta)')
        .eq('nutricionista_id', userId)
        .order('nome', { ascending: true })

      if (error) throw error
      setPacientes((data as unknown as Paciente[]) || [])
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err)
    } finally {
      setLoading(false)
    }
  }

  // Lógica de filtro de busca por nome
  const pacientesFiltrados = pacientes.filter(p => 
    p.nome.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Obtém de forma legível a data da última consulta
  const obterUltimaConsultaStr = (consultas: Consulta[]) => {
    if (!consultas || consultas.length === 0) {
      return 'Nenhuma consulta realizada'
    }
    
    const datas = consultas.map(c => {
      const [year, month, day] = c.data_consulta.split('-').map(Number)
      return new Date(year, month - 1, day)
    })
    
    const maxData = new Date(Math.max(...datas.map(d => d.getTime())))
    return maxData.toLocaleDateString('pt-BR')
  }

  // Formata os objetivos do paciente de maneira resumida e elegante
  const formatarObjetivos = (p: Paciente) => {
    const list: string[] = []
    if (p.objetivos && p.objetivos.length > 0) {
      list.push(...p.objetivos)
    }
    if (p.objetivo_texto) {
      list.push(p.objetivo_texto)
    }
    return list.length > 0 ? list.join(', ') : 'Não informado'
  }

  return (
    <div>
      {/* Cabeçalho da Listagem */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
            Meus Pacientes
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Consulte a ficha dos seus pacientes e agende retornos.
          </p>
        </div>
        
        {/* Botão Novo Paciente */}
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/pacientes/novo')}
          style={{ padding: '12px 20px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Novo Paciente
        </button>
      </div>

      {/* Caixa de Busca */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar paciente por nome..." 
            style={{ 
              paddingLeft: '48px', 
              fontSize: '1rem', 
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              width: '100%',
              backgroundColor: '#fff'
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontWeight: '600'
              }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Corpo da Tela */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando pacientes...</p>
        </div>
      ) : pacientes.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
          </svg>
          <p style={{ fontWeight: '600' }}>Nenhum paciente cadastrado ainda</p>
          <p>Clique em "Novo Paciente" acima para realizar o primeiro cadastro.</p>
        </div>
      ) : pacientesFiltrados.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <p style={{ fontWeight: '600' }}>Nenhum resultado encontrado</p>
          <p>Não encontramos pacientes correspondentes a "{searchQuery}".</p>
        </div>
      ) : (
        <div className="patient-list">
          {pacientesFiltrados.map((paciente) => (
            <div 
              key={paciente.id} 
              className="patient-card"
              onClick={() => navigate(`/pacientes/${paciente.id}`)}
            >
              <h3>{paciente.nome}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <p>
                  <span>Objetivo:</span>
                  <strong style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formatarObjetivos(paciente)}
                  </strong>
                </p>
                <p>
                  <span>Última Consulta:</span>
                  <strong>
                    {obterUltimaConsultaStr(paciente.consultas)}
                  </strong>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
