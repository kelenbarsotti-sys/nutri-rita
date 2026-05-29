import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Consulta {
  data_consulta: string
  peso: number | null
  cintura: number | null
  quadril: number | null
  percentual_gordura: number | null
}

interface Paciente {
  id: string
  nome: string
  objetivos: string[] | null
  objetivo_texto: string | null
  altura: number | null
  peso_inicial: number | null
  consultas: Consulta[]
  
  // Novos campos para a ficha clínica detalhada
  idade?: number | null
  serie?: string | null
  alergias_escolares?: string[] | null
  restricoes_escolares?: string[] | null
  conduta_nutricional?: string | null
}

interface HistoricoConsulta {
  data: string
  tipo: string
  evolucao: string
  notas: string
}

interface Meta {
  id: string
  texto: string
  concluida: boolean
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>('')
  const [activeMetric, setActiveMetric] = useState<'peso' | 'imc'>('peso')
  const [metas, setMetas] = useState<Record<string, Meta[]>>({})
  
  // Novos estados para navegação de visualização
  const [activeView, setActiveView] = useState<'lista_pacientes' | 'ficha_detalhada'>('lista_pacientes')
  
  const navigate = useNavigate()

  // Dados fictícios de histórico clínico por paciente
  const historicoFake: Record<string, HistoricoConsulta[]> = {
    'fake-p1': [
      { data: '10/01/2026', tipo: 'Avaliação Inicial', evolucao: 'Peso inicial: 85 kg | IMC: 31.2', notas: 'Anamnese completa realizada. Início de protocolo hipocalórico com exclusão de lactose. Solicitado exames de rotina.' },
      { data: '10/02/2026', tipo: 'Retorno', evolucao: 'Perda de 2.5 kg | IMC: 30.3', notas: 'Boa adesão ao plano. Paciente relatou melhora da disposição. Ajuste na ceia com inclusão de caseína vegetal.' },
      { data: '12/03/2026', tipo: 'Retorno', evolucao: 'Perda de 2.7 kg | IMC: 29.3', notas: 'Exames dentro da normalidade. Introduzido treino de caminhada 3x/semana. Ajuste nos lanchs.' },
      { data: '15/04/2026', tipo: 'Ajuste de Plano', evolucao: 'Perda de 2.6 kg | IMC: 28.4', notas: 'Estabilização do peso por 1 semana — ajustado déficit calórico. Adicionado protocolo cíclico de carboidratos.' },
      { data: '18/05/2026', tipo: 'Retorno', evolucao: 'Perda de 2.7 kg | IMC: 27.4', notas: 'Evolução excelente. Redução de 10.5 kg em 4 meses. Revisão do plano para próxima fase de manutenção.' },
    ],
    'fake-p2': [
      { data: '05/02/2026', tipo: 'Avaliação Inicial', evolucao: 'Peso inicial: 74 kg | IMC: 22.8', notas: 'Objetivo de hipertrofia. Dieta hipercalórica e hiperproteica iniciada. Distribuição de 5 refeições/dia.' },
      { data: '05/03/2026', tipo: 'Retorno', evolucao: 'Ganho de 1.8 kg | IMC: 23.4', notas: 'Boa evolução. Ganho muscular confirmado por bioimpedância. Ajuste pré e pós-treino.' },
      { data: '08/04/2026', tipo: 'Retorno', evolucao: 'Ganho de 1.7 kg | IMC: 23.9', notas: 'Redução do percentual de gordura de 14.5% para 13%. Aumentado aporte proteico para 2.5g/kg.' },
      { data: '10/05/2026', tipo: 'Ajuste de Plano', evolucao: 'Ganho de 1.7 kg | IMC: 24.4', notas: 'Paciente evoluindo muito bem. Revisão do treino com personal. Estratégia de ciclagem calórica implementada.' },
    ],
    'fake-p3': [
      { data: '01/03/2026', tipo: 'Avaliação Inicial', evolucao: 'Peso: 62 kg | IMC: 24.2', notas: 'Queixa de distensão abdominal e constipação crônica. Protocolo FODMAP iniciado e diário de sintomas entregue.' },
      { data: '01/04/2026', tipo: 'Retorno', evolucao: 'Perda de 1.5 kg | IMC: 23.6', notas: 'Redução de episódios de distensão. Adesão ao protocolo alta. Introdução gradual de alimentos FODMAP.' },
      { data: '01/05/2026', tipo: 'Retorno', evolucao: 'Perda de 1.3 kg | IMC: 23.1', notas: 'Intestino normalizado. Energia melhorou. Fase de reintrodução de alimentos iniciada com cautela.' },
    ],
  }

  // Metas padrão por paciente
  const metasDefault: Record<string, Meta[]> = {
    'fake-p1': [
      { id: 'm1', texto: '💧 Ingerir mínimo 2L de água por dia', concluida: true },
      { id: 'm2', texto: '🥦 Incluir 3 porções de vegetais nas refeições', concluida: true },
      { id: 'm3', texto: '🚫 Reduzir ultraprocessados (máx. 1x/semana)', concluida: false },
      { id: 'm4', texto: '🏃 Praticar caminhada 3x por semana', concluida: false },
      { id: 'm5', texto: '🩺 Realizar exames de rotina solicitados', concluida: true },
      { id: 'm6', texto: '😴 Melhorar qualidade do sono (7-8h/noite)', concluida: false },
    ],
    'fake-p2': [
      { id: 'm1', texto: '🥩 Atingir meta proteica diária (2.5g/kg)', concluida: true },
      { id: 'm2', texto: '🏋️ Manter rotina de treinos 4x/semana', concluida: true },
      { id: 'm3', texto: '🌾 Consumir carboidratos pré-treino conforme plano', concluida: true },
      { id: 'm4', texto: '💊 Usar suplementação (Whey + Creatina) conforme orientado', concluida: false },
      { id: 'm5', texto: '🧪 Realizar bioimpedância a cada 30 dias', concluida: false },
    ],
    'fake-p3': [
      { id: 'm1', texto: '📓 Preencher diário alimentar diariamente', concluida: true },
      { id: 'm2', texto: '🌿 Evitar glúten e açúcar refinado', concluida: true },
      { id: 'm3', texto: '💧 Tomar 2L de água fora das refeições', concluida: false },
      { id: 'm4', texto: '🥑 Incluir fonte de fibra solúvel em cada refeição', concluida: false },
      { id: 'm5', texto: '🧘 Praticar meditação/relaxamento 15min/dia (cortisol)', concluida: false },
    ],
  }

  // Calcular idade a partir da data de nascimento
  const calcIdade = (dataNasc: string | null) => {
    if (!dataNasc) return null
    const nasc = new Date(dataNasc + 'T00:00:00')
    const hoje = new Date()
    let i = hoje.getFullYear() - nasc.getFullYear()
    const m = hoje.getMonth() - nasc.getMonth()
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      i--
    }
    return i >= 0 ? i : 0
  }

  // Dados Fictícios (Mock Data) ricos em detalhes clínicos
  const fakePacientes: Paciente[] = [
    {
      id: 'fake-p1',
      nome: 'Maria Silva Oliveira',
      objetivos: ['Emagrecimento', 'Reeducação Alimentar'],
      objetivo_texto: 'Foco em perder gordura mantendo massa magra.',
      altura: 165,
      peso_inicial: 85,
      idade: 12,
      serie: '7º ano A (Fundamental II)',
      alergias_escolares: ['Lactose / Proteína do Leite de Vaca'],
      restricoes_escolares: ['Evitar achocolatado e bolachas doces da merenda escolar'],
      conduta_nutricional: 'Plano com foco em controle de carga glicêmica. Estimular o consumo de frutas frescas enviadas de casa e substituir o leite por opções vegetais enriquecidas com cálcio. Acompanhar a aceitação do lanche escolar e orientar a equipe escolar.',
      consultas: [
        { data_consulta: '2026-01-10', peso: 85.0, cintura: 98, quadril: 110, percentual_gordura: 35.0 },
        { data_consulta: '2026-02-10', peso: 82.5, cintura: 94, quadril: 106, percentual_gordura: 33.2 },
        { data_consulta: '2026-03-12', peso: 79.8, cintura: 91, quadril: 103, percentual_gordura: 31.0 },
        { data_consulta: '2026-04-15', peso: 77.2, cintura: 88, quadril: 100, percentual_gordura: 29.5 },
        { data_consulta: '2026-05-18', peso: 74.5, cintura: 85, quadril: 97, percentual_gordura: 27.2 }
      ]
    },
    {
      id: 'fake-p2',
      nome: 'João Pedro Santos',
      objetivos: ['Hipertrofia Muscular', 'Desempenho Esportivo'],
      objetivo_texto: 'Foco em aumento de massa e força.',
      altura: 180,
      peso_inicial: 74,
      idade: 15,
      serie: '1º ano B (Ensino Médio)',
      alergias_escolares: ['Amendoim e nozes no geral'],
      restricoes_escolares: ['Lanches que contenham traços de oleaginosas na cantina'],
      conduta_nutricional: 'Dieta hipercalórica e hiperproteica com divisão de macros adequada aos treinos da tarde. Orientado a levar lanches reforçados (sanduíche natural, frutas e aveia) e evitar compras na cantina devido à alergia severa a amendoim.',
      consultas: [
        { data_consulta: '2026-02-05', peso: 74.0, cintura: 82, quadril: 95, percentual_gordura: 16.0 },
        { data_consulta: '2026-03-05', peso: 75.8, cintura: 81, quadril: 95, percentual_gordura: 14.5 },
        { data_consulta: '2026-04-08', peso: 77.5, cintura: 80, quadril: 96, percentual_gordura: 13.0 },
        { data_consulta: '2026-05-10', peso: 79.2, cintura: 80, quadril: 97, percentual_gordura: 12.2 }
      ]
    },
    {
      id: 'fake-p3',
      nome: 'Ana Beatriz Souza',
      objetivos: ['Melhora da Disbiose', 'Disposição'],
      objetivo_texto: 'Foco em saúde do intestino e fadiga crônica.',
      altura: 160,
      peso_inicial: 62,
      idade: 9,
      serie: '4º ano C (Fundamental I)',
      alergias_escolares: [],
      restricoes_escolares: ['Açúcar refinado, corantes artificiais e glúten'],
      conduta_nutricional: 'Protocolo FODMAP adaptado para melhora de distensão abdominal e quadro de constipação crônica. Indicado o consumo de fibras solúveis (aveia sem glúten, chia, linhaça) e acompanhamento do diário de sintomas durante o período letivo.',
      consultas: [
        { data_consulta: '2026-03-01', peso: 62.0, cintura: 76, quadril: 98, percentual_gordura: 26.0 },
        { data_consulta: '2026-04-01', peso: 60.5, cintura: 74, quadril: 96, percentual_gordura: 24.8 },
        { data_consulta: '2026-05-01', peso: 59.2, cintura: 72, quadril: 95, percentual_gordura: 23.5 }
      ]
    }
  ]

  useEffect(() => {
    // Inicializar metas com os dados fictícios
    setMetas(metasDefault)
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchPacientes(session.user.id)
      } else {
        navigate('/login')
      }
    })
  }, [navigate])

  const toggleMeta = (pacienteId: string, metaId: string) => {
    setMetas(prev => ({
      ...prev,
      [pacienteId]: (prev[pacienteId] || []).map(m =>
        m.id === metaId ? { ...m, concluida: !m.concluida } : m
      )
    }))
  }

  async function fetchPacientes(userId: string) {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('pacientes')
        .select('id, nome, objetivos, objetivo_texto, altura, peso_inicial, data_nascimento, alergias, restricoes_alimentares, observacoes, consultas(data_consulta, peso, cintura, quadril, percentual_gordura)')
        .eq('nutricionista_id', userId)
        .order('nome', { ascending: true })

      if (error) throw error
      
      const formatados = (data || []).map((p: any) => ({
        id: p.id,
        nome: p.nome,
        objetivos: p.objetivos,
        objetivo_texto: p.objetivo_texto,
        altura: p.altura,
        peso_inicial: p.peso_inicial,
        idade: calcIdade(p.data_nascimento),
        serie: 'Ensino Regular', // Fallback
        alergias_escolares: p.alergias || [],
        restricoes_escolares: p.restricoes_alimentares || [],
        conduta_nutricional: p.observacoes || 'Conduta em avaliação inicial.',
        consultas: (p.consultas || []).sort((a: any, b: any) => a.data_consulta.localeCompare(b.data_consulta))
      }))

      setPacientes(formatados)
      
      // Selecionar primeiro paciente da lista
      if (formatados.length > 0) {
        setSelectedPacienteId(formatados[0].id)
      } else if (fakePacientes.length > 0) {
        setSelectedPacienteId(fakePacientes[0].id)
      }
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err)
    } finally {
      setLoading(false)
    }
  }

  // Mesclar dados do banco com mock fakes
  const getTodosPacientes = () => {
    const reaisComFakes = [...pacientes]
    
    // Adicionar fakes apenas se eles não existirem (evitar duplicar id)
    fakePacientes.forEach(f => {
      if (!reaisComFakes.some(r => r.id === f.id)) {
        reaisComFakes.push(f)
      }
    })

    return reaisComFakes
  }

  const todosPacientes = getTodosPacientes()

  // Filtrar
  const pacientesFiltrados = todosPacientes.filter(p => 
    p.nome.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedPaciente = todosPacientes.find(p => p.id === selectedPacienteId) || todosPacientes[0]

  // Formatar objetivos
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

  // Obter peso e data mais recentes
  const getInfoAtual = (p: Paciente) => {
    if (!p) return { peso: 0, imc: '0', data: '-' }
    
    const h = (p.altura || 170) / 100
    let pesoVal = p.peso_inicial || 0
    let dataVal = 'Inicial'

    if (p.consultas && p.consultas.length > 0) {
      const ultima = p.consultas[p.consultas.length - 1]
      if (ultima.peso) {
        pesoVal = ultima.peso
        dataVal = new Date(ultima.data_consulta + 'T00:00:00').toLocaleDateString('pt-BR')
      }
    }

    const imcVal = h > 0 ? (pesoVal / (h * h)).toFixed(1) : '0'
    return { peso: pesoVal, imc: imcVal, data: dataVal }
  }

  // IMC Classificação e cores
  const getImcClassificacao = (imcVal: string | null) => {
    if (!imcVal) return ''
    const val = parseFloat(imcVal)
    if (val < 18.5) return 'Abaixo do Peso'
    if (val >= 18.5 && val < 25) return 'Peso Normal'
    if (val >= 25 && val < 30) return 'Sobrepeso'
    return 'Obesidade'
  }

  const getImcColor = (classif: string) => {
    if (classif === 'Peso Normal') return { bg: '#e6f4ea', text: '#137333' }
    if (classif === 'Sobrepeso' || classif === 'Abaixo do Peso') return { bg: '#fef7e0', text: '#b06000' }
    if (classif === 'Obesidade') return { bg: '#fce8e6', text: '#c5221f' }
    return { bg: 'var(--bg-main)', text: 'var(--text-dark)' }
  }

  // Lógica de Render do Gráfico SVG
  const renderEvolutionChart = () => {
    if (!selectedPaciente) return null

    const h = (selectedPaciente.altura || 170) / 100
    const points: Array<{ label: string; val: number }> = []

    // Adiciona peso inicial se houver consultas para termos a evolução
    if (selectedPaciente.peso_inicial) {
      const imcInicial = h > 0 ? parseFloat((selectedPaciente.peso_inicial / (h * h)).toFixed(1)) : 0
      points.push({
        label: 'Inicial',
        val: activeMetric === 'peso' ? selectedPaciente.peso_inicial : imcInicial
      })
    }

    selectedPaciente.consultas.forEach(c => {
      if (c.peso) {
        const imcVal = h > 0 ? parseFloat((c.peso / (h * h)).toFixed(1)) : 0
        const dateParts = c.data_consulta.split('-')
        const label = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : c.data_consulta
        points.push({
          label,
          val: activeMetric === 'peso' ? c.peso : imcVal
        })
      }
    })

    if (points.length === 0) {
      return (
        <div className="empty-state" style={{ padding: '24px' }}>
          Sem dados históricos suficientes para gerar gráficos.
        </div>
      )
    }

    // Configuração do Gráfico
    const svgW = 550
    const svgH = 220
    const padL = 50
    const padR = 20
    const padT = 30
    const padB = 40
    
    const chartW = svgW - padL - padR
    const chartH = svgH - padT - padB

    const values = points.map(p => p.val)
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const delta = maxVal - minVal
    const paddingVal = delta === 0 ? 5 : delta * 0.15
    const yMin = Math.max(0, minVal - paddingVal)
    const yMax = maxVal + paddingVal

    // Coordenadas
    const coords = points.map((p, i) => {
      const x = padL + (points.length > 1 ? (i / (points.length - 1)) * chartW : chartW / 2)
      const y = padT + (1 - (p.val - yMin) / (yMax - yMin)) * chartH
      return { x, y, val: p.val, label: p.label }
    })

    let linePath = ''
    let areaPath = ''

    if (coords.length > 0) {
      linePath = `M ${coords[0].x} ${coords[0].y} `
      for (let i = 1; i < coords.length; i++) {
        linePath += `L ${coords[i].x} ${coords[i].y} `
      }

      areaPath = `M ${coords[0].x} ${svgH - padB} `
      for (let i = 0; i < coords.length; i++) {
        areaPath += `L ${coords[i].x} ${coords[i].y} `
      }
      areaPath += `L ${coords[coords.length - 1].x} ${svgH - padB} Z`
    }

    // Gridlines horizontais
    const gridCount = 4
    const gridlines = Array.from({ length: gridCount }, (_, i) => {
      const gridVal = yMin + (i / (gridCount - 1)) * (yMax - yMin)
      const y = padT + (1 - (gridVal - yMin) / (yMax - yMin)) * chartH
      return { y, val: gridVal }
    })

    return (
      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="chartLineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--secondary)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
        </defs>

        {/* Gridlines horizontais */}
        {gridlines.map((gl, i) => (
          <g key={i}>
            <line 
              x1={padL} 
              y1={gl.y} 
              x2={svgW - padR} 
              y2={gl.y} 
              stroke="var(--border-color)" 
              strokeWidth="1" 
              strokeDasharray="4 4"
            />
            <text x={padL - 10} y={gl.y + 4} textAnchor="end" fill="var(--text-muted)" fontSize="10" fontWeight="bold">
              {gl.val.toFixed(1)} {activeMetric === 'peso' ? 'kg' : ''}
            </text>
          </g>
        ))}

        {/* Área Sombreada */}
        {areaPath && <path d={areaPath} fill="url(#chartAreaGradient)" />}

        {/* Linha do Gráfico */}
        {linePath && (
          <path 
            d={linePath} 
            fill="none" 
            stroke="url(#chartLineGradient)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        )}

        {/* Pontos de dados */}
        {coords.map((pt, i) => (
          <g key={i} className="graph-dot-group">
            <circle 
              cx={pt.x} 
              cy={pt.y} 
              r="6" 
              fill="#ffffff" 
              stroke="var(--primary)" 
              strokeWidth="3" 
              className="graph-dot"
            />
            {/* Rótulo de Valor */}
            <text x={pt.x} y={pt.y - 12} textAnchor="middle" fill="var(--text-dark)" fontSize="11" fontWeight="800">
              {pt.val.toFixed(1)}
            </text>
            {/* Rótulo de Eixo X */}
            <text x={pt.x} y={svgH - padB + 20} textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontWeight="600">
              {pt.label}
            </text>
          </g>
        ))}

        {/* Linha Base do Eixo X */}
        <line x1={padL} y1={svgH - padB} x2={svgW - padR} y2={svgH - padB} stroke="var(--border-color)" strokeWidth="1.5" />
      </svg>
    )
  }

  // --- RENDERIZAR TELA DE FICHA DETALHADA ---
  if (activeView === 'ficha_detalhada' && selectedPaciente) {
    const info = getInfoAtual(selectedPaciente)
    return (
      <div className="animate-fade-in">
        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button 
            onClick={() => setActiveView('lista_pacientes')} 
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            &larr; Voltar para a Lista
          </button>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--primary)', margin: 0 }}>
            Ficha Clínica Detalhada
          </h1>
        </div>

        {/* Ficha Card */}
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '2px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px' }}>
            <div className="avatar-placeholder" style={{ width: '80px', height: '80px', fontSize: '2.5rem', margin: 0 }}>
              {selectedPaciente.nome.charAt(0)}
            </div>
            <div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '1.8rem', color: 'var(--text-dark)' }}>{selectedPaciente.nome}</h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            
            {/* Bloco 1: Dados Pessoais */}
            <div className="card" style={{ backgroundColor: '#fafbfa', margin: 0 }}>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--primary)', marginTop: 0, fontSize: '1.15rem' }}>
                📋 Dados Pessoais
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', fontSize: '0.95rem' }}>
                <p style={{ margin: 0 }}>Nome Completo: <strong style={{ color: 'var(--text-dark)' }}>{selectedPaciente.nome}</strong></p>
                <p style={{ margin: 0 }}>Idade: <strong style={{ color: 'var(--text-dark)' }}>{selectedPaciente.idade ? `${selectedPaciente.idade} anos` : 'Não informada'}</strong></p>
              </div>
            </div>

            {/* Bloco 2: Avaliação Nutricional */}
            <div className="card" style={{ backgroundColor: '#fafbfa', margin: 0 }}>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--primary)', marginTop: 0, fontSize: '1.15rem' }}>
                ⚖️ Avaliação Nutricional
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', fontSize: '0.95rem' }}>
                <p style={{ margin: 0 }}>Peso Atual: <strong style={{ color: 'var(--text-dark)' }}>{info.peso.toFixed(1)} kg</strong></p>
                <p style={{ margin: 0 }}>Altura: <strong style={{ color: 'var(--text-dark)' }}>{selectedPaciente.altura || 170} cm</strong></p>
                <p style={{ margin: 0 }}>IMC: <strong style={{ color: 'var(--text-dark)' }}>{info.imc} kg/m²</strong></p>
                <p style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                  Classificação: 
                  <span className="imc-tag" style={{
                    backgroundColor: getImcColor(getImcClassificacao(info.imc)).bg,
                    color: getImcColor(getImcClassificacao(info.imc)).text,
                    marginLeft: '8px'
                  }}>{getImcClassificacao(info.imc)}</span>
                </p>
              </div>
            </div>

            {/* Bloco 3: Alergias e Restrições */}
            <div className="card" style={{ backgroundColor: '#fafbfa', margin: 0, gridColumn: 'span 2' }}>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--danger)', marginTop: 0, fontSize: '1.15rem' }}>
                ⚠️ Alergias e Restrições Alimentares
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', fontSize: '0.95rem' }}>
                <div>
                  <strong>Alergias Alimentares:</strong>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {selectedPaciente.alergias_escolares && selectedPaciente.alergias_escolares.length > 0 ? (
                      selectedPaciente.alergias_escolares.map((a, i) => (
                        <span key={i} className="badge-meta" style={{ backgroundColor: '#fce8e6', color: '#c5221f', border: '1px solid #fad2cf', fontWeight: '600' }}>
                          {a}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Nenhuma alergia relatada</span>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <strong>Restrições de Consumo / Observações:</strong>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {selectedPaciente.restricoes_escolares && selectedPaciente.restricoes_escolares.length > 0 ? (
                      selectedPaciente.restricoes_escolares.map((r, i) => (
                        <span key={i} className="badge-meta" style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', fontWeight: '600' }}>
                          {r}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Nenhuma restrição alimentar cadastrada</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 4: Conduta Nutricional */}
            <div className="card" style={{ backgroundColor: '#fafbfa', margin: 0, gridColumn: 'span 2' }}>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--primary)', marginTop: 0, fontSize: '1.15rem' }}>
                🥦 Histórico e Conduta Nutricional
              </h3>
              <div style={{ marginTop: '12px', lineHeight: '1.6', color: 'var(--text-dark)', fontSize: '0.95rem' }}>
                <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{selectedPaciente.conduta_nutricional || 'Conduta nutricional em andamento.'}</p>
              </div>
            </div>

          </div>
        </div>

        {/* ===== SEÇÃO: HISTÓRICO DE CONSULTAS (TIMELINE) ===== */}
        <div className="card" style={{ padding: '32px', marginTop: '24px' }}>
          <h2 style={{ margin: '0 0 28px 0', fontSize: '1.4rem', color: 'var(--primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🗓️ Histórico de Consultas
          </h2>
          <div style={{ position: 'relative', paddingLeft: '32px' }}>
            {/* Linha vertical da timeline */}
            <div style={{ position: 'absolute', left: '10px', top: '8px', bottom: '8px', width: '3px', background: 'linear-gradient(to bottom, var(--primary), var(--secondary))', borderRadius: '4px' }} />

            {(historicoFake[selectedPaciente.id] || []).map((entry, idx) => {
              const tipoColors: Record<string, { bg: string; text: string }> = {
                'Avaliação Inicial': { bg: '#e8f4fd', text: '#1565c0' },
                'Retorno': { bg: '#e6f4ea', text: '#2e7d32' },
                'Ajuste de Plano': { bg: '#fff3e0', text: '#e65100' },
              }
              const color = tipoColors[entry.tipo] || { bg: 'var(--bg-main)', text: 'var(--text-dark)' }
              const isLast = idx === (historicoFake[selectedPaciente.id] || []).length - 1

              return (
                <div key={idx} style={{ position: 'relative', marginBottom: isLast ? 0 : '28px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Bolinha da timeline */}
                  <div style={{
                    position: 'absolute',
                    left: '-27px',
                    top: '6px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    border: '3px solid white',
                    boxShadow: '0 0 0 2px var(--primary)',
                    zIndex: 1
                  }} />

                  {/* Cabeçalho do item */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-dark)' }}>📅 {entry.data}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', backgroundColor: color.bg, color: color.text }}>
                      {entry.tipo}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#2e7d32', fontWeight: '600', backgroundColor: '#e6f4ea', padding: '3px 10px', borderRadius: '20px' }}>
                      📊 {entry.evolucao}
                    </span>
                  </div>

                  {/* Notas */}
                  <div style={{ backgroundColor: '#fafbfa', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px 16px', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    {entry.notas}
                  </div>
                </div>
              )
            })}

            {!(historicoFake[selectedPaciente.id]?.length) && (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '24px' }}>
                Nenhum histórico de consultas registrado ainda.
              </div>
            )}
          </div>
        </div>

        {/* ===== SEÇÃO: CHECKLIST DE METAS/CONDUTA ===== */}
        <div className="card" style={{ padding: '32px', marginTop: '24px', marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--primary)', fontWeight: '700' }}>
              ✅ Checklist de Metas / Conduta
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', backgroundColor: 'var(--bg-main)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
              {(metas[selectedPaciente.id] || []).filter(m => m.concluida).length} / {(metas[selectedPaciente.id] || []).length} concluídas
            </div>
          </div>

          {/* Barra de progresso */}
          {(metas[selectedPaciente.id] || []).length > 0 && (() => {
            const total = (metas[selectedPaciente.id] || []).length
            const done = (metas[selectedPaciente.id] || []).filter(m => m.concluida).length
            const pct = Math.round((done / total) * 100)
            return (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Progresso Geral</span>
                  <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{pct}%</span>
                </div>
                <div style={{ height: '10px', backgroundColor: 'var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, var(--secondary), var(--primary))',
                    borderRadius: '8px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            )
          })()}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(metas[selectedPaciente.id] || [
              { id: 'default-1', texto: '💧 Ingerir mínimo 2L de água por dia', concluida: false },
              { id: 'default-2', texto: '🥦 Incluir vegetais coloridos nas refeições', concluida: false },
              { id: 'default-3', texto: '🚫 Reduzir ultraprocessados', concluida: false },
              { id: 'default-4', texto: '🏃 Praticar atividade física regularmente', concluida: false },
            ]).map((meta) => (
              <div
                key={meta.id}
                onClick={() => toggleMeta(selectedPaciente.id, meta.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  border: `1px solid ${meta.concluida ? 'var(--primary)' : 'var(--border-color)'}`,
                  backgroundColor: meta.concluida ? 'var(--primary-light)' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
              >
                {/* Checkbox customizado */}
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  border: `2px solid ${meta.concluida ? 'var(--primary)' : 'var(--border-color)'}`,
                  backgroundColor: meta.concluida ? 'var(--primary)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}>
                  {meta.concluida && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span style={{
                  fontSize: '0.95rem',
                  color: meta.concluida ? 'var(--primary)' : 'var(--text-dark)',
                  fontWeight: meta.concluida ? '600' : '400',
                  textDecoration: meta.concluida ? 'line-through' : 'none',
                  opacity: meta.concluida ? 0.75 : 1,
                  transition: 'all 0.2s ease'
                }}>
                  {meta.texto}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    )
  }

  // --- RENDERIZAR TELA DA LISTAGEM E DASHBOARD ---
  return (
    <div className="animate-fade-in">
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--primary)', margin: 0 }}>
            Gerenciamento de Pacientes
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Consulte a ficha dos seus pacientes e visualize a evolução das métricas corporais em gráficos de linha dinâmicos.
          </p>
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/pacientes/novo')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Cadastrar Paciente
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
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              width: '100%',
              backgroundColor: '#fff'
            }}
          />
        </div>
      </div>

      {/* Layout Split: Lista e Dashboard de Evolução */}
      {loading && pacientes.length === 0 ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando dados dos pacientes...</p>
        </div>
      ) : pacientesFiltrados.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontWeight: '600' }}>Nenhum paciente encontrado</p>
          <p>Experimente pesquisar outro nome.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Coluna 1: Lista de Pacientes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
            {pacientesFiltrados.map((paciente) => {
              const info = getInfoAtual(paciente)
              const isSelected = paciente.id === selectedPacienteId
              
              return (
                <div 
                  key={paciente.id} 
                  className="patient-card"
                  onClick={() => setSelectedPacienteId(paciente.id)}
                  style={{
                    borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                    backgroundColor: isSelected ? 'var(--primary-light)' : '#ffffff',
                    transform: isSelected ? 'scale(1.01)' : 'none',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)'
                  }}
                >
                  <h3>{paciente.nome}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <div><strong>Objetivo:</strong> {formatarObjetivos(paciente)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                      <span>Peso: <strong>{info.peso.toFixed(1)} kg</strong></span>
                      <span>IMC: <strong>{info.imc}</strong></span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Coluna 2: Dashboard de Evolução do Paciente Selecionado */}
          {selectedPaciente && (
            <div className="card" style={{ margin: 0, padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: 'var(--primary)' }}>
                    {selectedPaciente.nome}
                  </h2>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Altura: <strong>{selectedPaciente.altura || 170} cm</strong> | 
                    Objetivo: <strong>{selectedPaciente.objetivo_texto || 'Não informado'}</strong>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    // Ativa a tela detalhada e define o paciente no estado
                    setActiveView('ficha_detalhada')
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                >
                  Ver Ficha Completa
                </button>
              </div>

              {/* Seção Gráfica */}
              <div className="evolucao-container">
                <div className="evolucao-header">
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-dark)' }}>Curva de Evolução</h3>
                  <div className="metricas-toggle">
                    <button 
                      type="button" 
                      className={`metrica-btn ${activeMetric === 'peso' ? 'active' : ''}`}
                      onClick={() => setActiveMetric('peso')}
                    >
                      Peso (kg)
                    </button>
                    <button 
                      type="button" 
                      className={`metrica-btn ${activeMetric === 'imc' ? 'active' : ''}`}
                      onClick={() => setActiveMetric('imc')}
                    >
                      IMC
                    </button>
                  </div>
                </div>

                <div style={{ backgroundColor: '#fafbfa', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  {renderEvolutionChart()}
                </div>
              </div>

              {/* Tabela de Consultas */}
              <div style={{ marginTop: '28px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: 'var(--text-dark)' }}>Histórico de Consultas</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px 12px' }}>Data</th>
                        <th style={{ padding: '8px 12px' }}>Peso</th>
                        <th style={{ padding: '8px 12px' }}>Cintura</th>
                        <th style={{ padding: '8px 12px' }}>Quadril</th>
                        <th style={{ padding: '8px 12px' }}>% Gordura</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Caso de paciente com peso inicial mas nenhuma consulta ainda */}
                      {selectedPaciente.consultas.length === 0 ? (
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>Cadastro</td>
                          <td style={{ padding: '10px 12px' }}>{selectedPaciente.peso_inicial?.toFixed(1)} kg</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>-</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>-</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>-</td>
                        </tr>
                      ) : (
                        selectedPaciente.consultas.map((c, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '10px 12px', fontWeight: '600' }}>
                              {new Date(c.data_consulta + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </td>
                            <td style={{ padding: '10px 12px' }}>{c.peso?.toFixed(1)} kg</td>
                            <td style={{ padding: '10px 12px' }}>{c.cintura ? `${c.cintura} cm` : '-'}</td>
                            <td style={{ padding: '10px 12px' }}>{c.quadril ? `${c.quadril} cm` : '-'}</td>
                            <td style={{ padding: '10px 12px' }}>{c.percentual_gordura ? `${c.percentual_gordura}%` : '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  )
}
