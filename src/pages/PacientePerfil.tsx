import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Consulta {
  id: string;
  data_consulta: string;
  peso: number | null;
  cintura: number | null;
  quadril: number | null;
  percentual_gordura: number | null;
  proximo_retorno: string | null;
  observacoes: string | null;
}

interface Paciente {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  objetivo_texto: string;
  created_at: string;
}

export default function PacientePerfil() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [consultas, setConsultas] = useState<Consulta[]>([])

  useEffect(() => {
    if (id) {
      fetchPacienteDetalhado(id)
    }
  }, [id])

  async function fetchPacienteDetalhado(pacienteId: string) {
    try {
      setLoading(true)
      
      // Buscar dados do paciente
      const { data: pacienteData, error: pacienteError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', pacienteId)
        .single()
      
      if (pacienteError) throw pacienteError
      setPaciente(pacienteData)

      // Buscar histórico de consultas do paciente
      const { data: consultasData, error: consultasError } = await supabase
        .from('consultas')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('data_consulta', { ascending: false })
      
      if (consultasError) throw consultasError
      setConsultas(consultasData || [])

    } catch (err) {
      console.error('Erro ao buscar dados do paciente:', err)
      alert('Erro ao carregar perfil do paciente.')
      navigate('/pacientes')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando perfil do paciente...</p>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="empty-state">
        <p>Paciente não encontrado.</p>
        <button className="btn btn-primary" onClick={() => navigate('/pacientes')}>
          Voltar para Pacientes
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Botão Voltar */}
      <button 
        className="btn btn-secondary" 
        onClick={() => navigate(-1)} 
        style={{ marginBottom: '24px', padding: '8px 16px', fontSize: '0.875rem' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Voltar
      </button>

      {/* Cabeçalho do Perfil */}
      <div className="profile-header">
        <div className="profile-title-container">
          <h1>{paciente.nome}</h1>
          <div className="profile-meta">
            <span><strong>Cadastrado em:</strong> {new Date(paciente.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Grid de Informações */}
      <div className="profile-info-grid">
        {/* Lado Esquerdo: Informações do Paciente */}
        <div>
          <div className="card">
            <h2>Dados Pessoais & Contato</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div className="info-item">
                <div className="info-label">E-mail</div>
                <div className="info-value">{paciente.email || 'Não informado'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">WhatsApp</div>
                <div className="info-value">{paciente.whatsapp || 'Não informado'}</div>
              </div>
            </div>

            <div className="info-item" style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div className="info-label">Objetivo ou Queixa Principal</div>
              <div className="info-value" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                {paciente.objetivo_texto || 'Sem descrição cadastrada.'}
              </div>
            </div>
          </div>

          {/* Histórico de Consultas */}
          <div className="card">
            <h2>Histórico de Consultas ({consultas.length})</h2>
            {consultas.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p>Nenhuma consulta registrada para este paciente ainda.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {consultas.map((consulta) => (
                  <div 
                    key={consulta.id} 
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: 'var(--bg-main)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--primary)' }}>
                        Consulta em {new Date(consulta.data_consulta + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      {consulta.proximo_retorno && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Próximo Retorno: <strong>{new Date(consulta.proximo_retorno + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <div className="info-label">Peso</div>
                        <div className="info-value">{consulta.peso ? `${consulta.peso} kg` : '-'}</div>
                      </div>
                      <div>
                        <div className="info-label">Cintura</div>
                        <div className="info-value">{consulta.cintura ? `${consulta.cintura} cm` : '-'}</div>
                      </div>
                      <div>
                        <div className="info-label">Quadril</div>
                        <div className="info-value">{consulta.quadril ? `${consulta.quadril} cm` : '-'}</div>
                      </div>
                      <div>
                        <div className="info-label">% Gordura</div>
                        <div className="info-value">{consulta.percentual_gordura ? `${consulta.percentual_gordura}%` : '-'}</div>
                      </div>
                    </div>

                    {consulta.observacoes && (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', backgroundColor: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <strong>Observações: </strong> {consulta.observacoes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Ações rápidas */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '24px' }}>
            <h2>Ações Rápidas</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a 
                href={`https://wa.me/${paciente.whatsapp.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary"
                style={{ textDecoration: 'none', backgroundColor: '#25D366', boxShadow: 'none' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.453L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.49 1.967 14.03 .942 11.996.942c-5.445 0-9.87 4.373-9.875 9.805-.002 1.794.494 3.542 1.439 5.093l-1.008 3.682 3.823-.988c1.558.835 3.087 1.24 4.692 1.24zm10.74-7.447c-.297-.148-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
                Enviar WhatsApp
              </a>
              <button className="btn btn-secondary" onClick={() => fetchPacienteDetalhado(paciente.id)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                Atualizar Perfil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
