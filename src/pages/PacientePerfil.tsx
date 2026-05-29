import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Consulta {
  id: string;
  paciente_id: string;
  data_consulta: string;
  peso: number | null;
  cintura: number | null;
  quadril: number | null;
  percentual_gordura: number | null;
  observacoes: string | null;
  proximo_retorno: string | null;
  created_at: string;
}

interface Paciente {
  id: string;
  nutricionista_id: string;
  nome: string;
  data_nascimento: string | null;
  sexo: string | null;
  whatsapp: string | null;
  email: string | null;
  peso_inicial: number | null;
  altura: number | null;
  objetivos: string[] | null;
  objetivo_texto: string | null;
  nivel_atividade: string | null;
  patologias: string[] | null;
  restricoes_alimentares: string[] | null;
  alergias: string[] | null;
  medicamentos: string | null;
  suplementos: string | null;
  refeicoes_por_dia: number | null;
  horario_acorda: string | null;
  horario_dorme: string | null;
  litros_agua: number | null;
  atividade_fisica: boolean | null;
  atividade_fisica_descricao: string | null;
  observacoes: string | null;
  created_at: string;
}

interface PlanoAlimentar {
  id: string;
  paciente_id: string;
  conteudo: any;
  created_at: string;
}

interface RefeicoesDia {
  cafe_manha: string[];
  lanche_manha: string[];
  almoco: string[];
  lanche_tarde: string[];
  jantar: string[];
}

interface PlanoManualConteudo {
  dias: {
    segunda: RefeicoesDia;
    terca: RefeicoesDia;
    quarta: RefeicoesDia;
    quinta: RefeicoesDia;
    sexta: RefeicoesDia;
    sabado: RefeicoesDia;
    domingo: RefeicoesDia;
  };
}

const criarPlanoLimpo = (): PlanoManualConteudo => ({
  dias: {
    segunda: { cafe_manha: ["", "", "", "", ""], lanche_manha: ["", "", "", "", ""], almoco: ["", "", "", "", ""], lanche_tarde: ["", "", "", "", ""], jantar: ["", "", "", "", ""] },
    terca: { cafe_manha: ["", "", "", "", ""], lanche_manha: ["", "", "", "", ""], almoco: ["", "", "", "", ""], lanche_tarde: ["", "", "", "", ""], jantar: ["", "", "", "", ""] },
    quarta: { cafe_manha: ["", "", "", "", ""], lanche_manha: ["", "", "", "", ""], almoco: ["", "", "", "", ""], lanche_tarde: ["", "", "", "", ""], jantar: ["", "", "", "", ""] },
    quinta: { cafe_manha: ["", "", "", "", ""], lanche_manha: ["", "", "", "", ""], almoco: ["", "", "", "", ""], lanche_tarde: ["", "", "", "", ""], jantar: ["", "", "", "", ""] },
    sexta: { cafe_manha: ["", "", "", "", ""], lanche_manha: ["", "", "", "", ""], almoco: ["", "", "", "", ""], lanche_tarde: ["", "", "", "", ""], jantar: ["", "", "", "", ""] },
    sabado: { cafe_manha: ["", "", "", "", ""], lanche_manha: ["", "", "", "", ""], almoco: ["", "", "", "", ""], lanche_tarde: ["", "", "", "", ""], jantar: ["", "", "", "", ""] },
    domingo: { cafe_manha: ["", "", "", "", ""], lanche_manha: ["", "", "", "", ""], almoco: ["", "", "", "", ""], lanche_tarde: ["", "", "", "", ""], jantar: ["", "", "", "", ""] }
  }
});

const sanitizarPlano = (conteudo: any): PlanoManualConteudo => {
  const limpo = criarPlanoLimpo()
  if (!conteudo || !conteudo.dias) return limpo

  const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'] as const
  const refeicoes = ['cafe_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'] as const

  dias.forEach(dia => {
    if (conteudo.dias[dia]) {
      refeicoes.forEach(ref => {
        if (Array.isArray(conteudo.dias[dia][ref])) {
          for (let i = 0; i < 5; i++) {
            limpo.dias[dia][ref][i] = conteudo.dias[dia][ref][i] || ""
          }
        }
      })
    }
  })

  return limpo
}

export default function PacientePerfil() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([])

  // Abas principais do perfil
  const [activeMainTab, setActiveMainTab] = useState<'ficha' | 'consultas' | 'planos'>('ficha')
  
  // Sub-abas da ficha do paciente
  const [activeFichaTab, setActiveFichaTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal')

  // --- ESTADOS DO PLANO ALIMENTAR MANUAL ---
  const [isPlanoFormOpen, setIsPlanoFormOpen] = useState(false)
  const [editingPlanoId, setEditingPlanoId] = useState<string | null>(null)
  const [planoFormDiaAtivo, setPlanoFormDiaAtivo] = useState<keyof PlanoManualConteudo['dias']>('segunda')
  const [planoFormConteudo, setPlanoFormConteudo] = useState<PlanoManualConteudo>(criarPlanoLimpo())
  const [salvandoPlano, setSalvandoPlano] = useState(false)
  
  // Para visualização de abas no modal
  const [planoVisualizarDiaAtivo, setPlanoVisualizarDiaAtivo] = useState<keyof PlanoManualConteudo['dias']>('segunda')

  // --- ESTADOS DO PLANO ALIMENTAR VIA IA ---
  const [gerandoPlanoIA, setGerandoPlanoIA] = useState(false)
  const [iaLoadingMsg, setIaLoadingMsg] = useState('')

  // --- ESTADOS DE EDIÇÃO DA FICHA ---
  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [sexo, setSexo] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  
  const [pesoInicial, setPesoInicial] = useState('')
  const [altura, setAltura] = useState('')
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>([])
  const [objetivoLivre, setObjetivoLivre] = useState('')
  const [nivelAtividade, setNivelAtividade] = useState('')

  const [patologiasSelecionadas, setPatologiasSelecionadas] = useState<string[]>([])
  const [patologiaNenhum, setPatologiaNenhum] = useState(false)
  const [patologiaLivre, setPatologiaLivre] = useState('')

  const [restricoesSelecionadas, setRestricoesSelecionadas] = useState<string[]>([])
  const [restricaoNenhum, setRestricaoNenhum] = useState(false)
  const [restricaoLivre, setRestricaoLivre] = useState('')

  const [alergiasSelecionadas, setAlergiasSelecionadas] = useState<string[]>([])
  const [alergiaNenhum, setAlergiaNenhum] = useState(false)
  const [alergiaLivre, setAlergiaLivre] = useState('')

  const [medicamentos, setMedicamentos] = useState('')
  const [suplementos, setSuplementos] = useState('')

  const [refeicoesPorDia, setRefeicoesPorDia] = useState('')
  const [horarioAcorda, setHorarioAcorda] = useState('')
  const [horarioDorme, setHorarioDorme] = useState('')
  const [litrosAgua, setLitrosAgua] = useState('')
  const [praticaAtividadeFisica, setPraticaAtividadeFisica] = useState('nao')
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState('')
  const [observacoesPaciente, setObservacoesPaciente] = useState('')

  // Estados de controle de ações
  const [salvandoPaciente, setSalvandoPaciente] = useState(false)
  const [showFeedbackPaciente, setShowFeedbackPaciente] = useState(false)

  // --- ESTADOS DO MODAL DE NOVA CONSULTA ---
  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false)
  const [salvandoConsulta, setSalvandoConsulta] = useState(false)
  const [cDataConsulta, setCDataConsulta] = useState('')
  const [cPeso, setCPeso] = useState('')
  const [cCintura, setCCintura] = useState('')
  const [cQuadril, setCQuadril] = useState('')
  const [cPercentualGordura, setCPercentualGordura] = useState('')
  const [cObservacoes, setCObservacoes] = useState('')
  const [cProximoRetorno, setCProximoRetorno] = useState('')

  // --- ESTADOS DO MODAL DE VISUALIZAÇÃO DE PLANO ---
  const [selectedPlano, setSelectedPlano] = useState<PlanoAlimentar | null>(null)

  useEffect(() => {
    if (id) {
      fetchPerfilCompleto(id)
    }
  }, [id])

  async function fetchPerfilCompleto(pacienteId: string) {
    try {
      setLoading(true)

      // 1. Buscar dados do paciente
      const { data: pacienteData, error: pacienteError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', pacienteId)
        .single()

      if (pacienteError) throw pacienteError
      setPaciente(pacienteData)

      // Inicializar campos de edição
      setNome(pacienteData.nome || '')
      setDataNascimento(pacienteData.data_nascimento || '')
      setSexo(pacienteData.sexo || '')
      setWhatsapp(pacienteData.whatsapp || '')
      setEmail(pacienteData.email || '')
      setPesoInicial(pacienteData.peso_inicial ? String(pacienteData.peso_inicial) : '')
      setAltura(pacienteData.altura ? String(pacienteData.altura) : '')
      setObjetivosSelecionados(pacienteData.objetivos || [])
      setObjetivoLivre(pacienteData.objetivo_texto || '')
      setNivelAtividade(pacienteData.nivel_atividade || '')

      // Patologias
      const patologiasList = pacienteData.patologias || []
      if (patologiasList.includes('Nenhum')) {
        setPatologiaNenhum(true)
        setPatologiasSelecionadas([])
        setPatologiaLivre('')
      } else {
        setPatologiaNenhum(false)
        const fixas = ['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto']
        const sel = patologiasList.filter((p: string) => fixas.includes(p))
        const custom = patologiasList.find((p: string) => !fixas.includes(p))
        setPatologiasSelecionadas(sel)
        setPatologiaLivre(custom || '')
      }

      // Restrições
      const restricoesList = pacienteData.restricoes_alimentares || []
      if (restricoesList.includes('Nenhum')) {
        setRestricaoNenhum(true)
        setRestricoesSelecionadas([])
        setRestricaoLivre('')
      } else {
        setRestricaoNenhum(false)
        const fixas = ['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar']
        const sel = restricoesList.filter((r: string) => fixas.includes(r))
        const custom = restricoesList.find((r: string) => !fixas.includes(r))
        setRestricoesSelecionadas(sel)
        setRestricaoLivre(custom || '')
      }

      // Alergias
      const alergiasList = pacienteData.alergias || []
      if (alergiasList.includes('Nenhum')) {
        setAlergiaNenhum(true)
        setAlergiasSelecionadas([])
        setAlergiaLivre('')
      } else {
        setAlergiaNenhum(false)
        const fixas = ['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar']
        const sel = alergiasList.filter((a: string) => fixas.includes(a))
        const custom = alergiasList.find((a: string) => !fixas.includes(a))
        setAlergiasSelecionadas(sel)
        setAlergiaLivre(custom || '')
      }

      setMedicamentos(pacienteData.medicamentos || '')
      setSuplementos(pacienteData.suplementos || '')

      setRefeicoesPorDia(pacienteData.refeicoes_por_dia ? String(pacienteData.refeicoes_por_dia) : '')
      setHorarioAcorda(pacienteData.horario_acorda || '')
      setHorarioDorme(pacienteData.horario_dorme || '')
      setLitrosAgua(pacienteData.litros_agua ? String(pacienteData.litros_agua) : '')
      setPraticaAtividadeFisica(pacienteData.atividade_fisica ? 'sim' : 'nao')
      setAtividadeFisicaDescricao(pacienteData.atividade_fisica_descricao || '')
      setObservacoesPaciente(pacienteData.observacoes || '')

      // 2. Buscar consultas
      const { data: consultasData, error: consultasError } = await supabase
        .from('consultas')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('data_consulta', { ascending: false })

      if (consultasError) throw consultasError
      setConsultas(consultasData || [])

      // 3. Buscar planos alimentares
      const { data: planosData, error: planosError } = await supabase
        .from('planos_alimentares')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false })

      if (planosError) throw planosError
      setPlanos(planosData || [])

    } catch (err) {
      console.error('Erro ao buscar dados do paciente:', err)
      alert('Erro ao carregar perfil do paciente.')
      navigate('/pacientes')
    } finally {
      setLoading(false)
    }
  }

  // --- MÁSCARAS E CONVERSÕES ---
  const aplicarMascaraTelefone = (valor: string) => {
    const limpo = valor.replace(/\D/g, '')
    if (limpo.length === 0) return ''
    if (limpo.length <= 2) return `(${limpo}`
    if (limpo.length <= 6) return `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`
    if (limpo.length <= 10) return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7, 11)}`
  }

  const handleBlurHora = (valor: string, setValor: (v: string) => void) => {
    const limpo = valor.replace(/\D/g, '')
    if (!limpo) return
    
    let h = 0
    let m = 0
    
    if (limpo.length <= 2) {
      h = parseInt(limpo)
    } else if (limpo.length === 3) {
      h = parseInt(limpo.slice(0, 1))
      m = parseInt(limpo.slice(1))
    } else {
      h = parseInt(limpo.slice(0, 2))
      m = parseInt(limpo.slice(2, 4))
    }
    
    h = Math.min(23, Math.max(0, h))
    m = Math.min(59, Math.max(0, m))
    
    const horasStr = String(h).padStart(2, '0')
    const minutosStr = String(m).padStart(2, '0')
    
    setValor(`${horasStr}:${minutosStr}`)
  }

  // --- SELEÇÃO DE CHECKBOXES ---
  const handleCheckboxChange = (
    item: string,
    lista: string[],
    setLista: (l: string[]) => void,
    nenhumState: boolean,
    setNenhumState: (b: boolean) => void
  ) => {
    if (nenhumState) {
      setNenhumState(false)
    }
    if (lista.includes(item)) {
      setLista(lista.filter(i => i !== item))
    } else {
      setLista([...lista, item])
    }
  }

  const handleNenhumChange = (
    setNenhumState: (b: boolean) => void,
    setLista: (l: string[]) => void,
    setLivreState: (s: string) => void,
    checked: boolean
  ) => {
    setNenhumState(checked)
    if (checked) {
      setLista([])
      setLivreState('')
    }
  }

  const handleObjetivoCheckbox = (item: string) => {
    if (objetivosSelecionados.includes(item)) {
      setObjetivosSelecionados(objetivosSelecionados.filter(i => i !== item))
    } else {
      setObjetivosSelecionados([...objetivosSelecionados, item])
    }
  }

  // Calcular idade dinâmica
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

  // Pegar peso mais recente
  const getPesoAtual = () => {
    if (consultas.length > 0) {
      for (const c of consultas) {
        if (c.peso !== null) return c.peso
      }
    }
    return paciente?.peso_inicial || null
  }

  // Calcular IMC dinâmico
  const calcImc = () => {
    const p = getPesoAtual()
    const a = paciente?.altura ? paciente.altura / 100 : null
    if (!p || !a || a <= 0) return null
    return (p / (a * a)).toFixed(1)
  }

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

  // --- SALVAR ALTERAÇÕES DOS DADOS DO PACIENTE ---
  async function handleSalvarFicha(e: React.FormEvent) {
    e.preventDefault()
    if (!paciente) return

    if (!nome.trim()) {
      alert('O campo Nome Completo é obrigatório!')
      setActiveFichaTab('pessoal')
      return
    }

    try {
      setSalvandoPaciente(true)

      const patologiasFinais = patologiaNenhum 
        ? ['Nenhum'] 
        : [...patologiasSelecionadas, ...(patologiaLivre.trim() ? [patologiaLivre.trim()] : [])]

      const restricoesFinais = restricaoNenhum 
        ? ['Nenhum'] 
        : [...restricoesSelecionadas, ...(restricaoLivre.trim() ? [restricaoLivre.trim()] : [])]

      const alergiasFinais = alergiaNenhum 
        ? ['Nenhum'] 
        : [...alergiasSelecionadas, ...(alergiaLivre.trim() ? [alergiaLivre.trim()] : [])]

      const payload = {
        nome: nome.trim(),
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        whatsapp: whatsapp || null,
        email: email || null,
        peso_inicial: pesoInicial ? parseFloat(pesoInicial) : null,
        altura: altura ? parseFloat(altura) : null,
        objetivos: objetivosSelecionados,
        objetivo_texto: objetivoLivre.trim() || null,
        nivel_atividade: nivelAtividade || null,
        patologias: patologiasFinais,
        restricoes_alimentares: restricoesFinais,
        alergias: alergiasFinais,
        medicamentos: medicamentos.trim() || null,
        suplementos: suplementos.trim() || null,
        refeicoes_por_dia: refeicoesPorDia ? parseInt(refeicoesPorDia) : null,
        horario_acorda: horarioAcorda || null,
        horario_dorme: horarioDorme || null,
        litros_agua: litrosAgua ? parseFloat(litrosAgua) : null,
        atividade_fisica: praticaAtividadeFisica === 'sim',
        atividade_fisica_descricao: praticaAtividadeFisica === 'sim' ? atividadeFisicaDescricao.trim() : null,
        observacoes: observacoesPaciente.trim() || null
      }

      const { error } = await supabase
        .from('pacientes')
        .update(payload)
        .eq('id', paciente.id)

      if (error) throw error

      // Atualizar o objeto do paciente local
      setPaciente(prev => prev ? { ...prev, ...payload } : null)

      // Exibir feedback de sucesso
      setShowFeedbackPaciente(true)
      setTimeout(() => setShowFeedbackPaciente(false), 4000)

    } catch (err: any) {
      console.error('Erro ao salvar paciente:', err)
      alert('Erro ao salvar alterações: ' + err.message)
    } finally {
      setSalvandoPaciente(false)
    }
  }

  // --- SALVAR CONSULTA ---
  async function handleSalvarConsulta(e: React.FormEvent) {
    e.preventDefault()
    if (!paciente) return

    if (!cDataConsulta) {
      alert('A data da consulta é obrigatória!')
      return
    }

    if (!cPeso) {
      alert('O peso atual é obrigatório!')
      return
    }

    try {
      setSalvandoConsulta(true)

      const payload = {
        paciente_id: paciente.id,
        data_consulta: cDataConsulta,
        peso: parseFloat(cPeso),
        cintura: cCintura ? parseFloat(cCintura) : null,
        quadril: cQuadril ? parseFloat(cQuadril) : null,
        percentual_gordura: cPercentualGordura ? parseFloat(cPercentualGordura) : null,
        observacoes: cObservacoes.trim() || null,
        proximo_retorno: cProximoRetorno || null
      }

      const { error } = await supabase
        .from('consultas')
        .insert([payload])

      if (error) throw error

      // Resetar form do modal
      setCPeso('')
      setCCintura('')
      setCQuadril('')
      setCPercentualGordura('')
      setCObservacoes('')
      setCProximoRetorno('')
      setIsConsultaModalOpen(false)

      // Atualizar perfil
      await fetchPerfilCompleto(paciente.id)

    } catch (err: any) {
      console.error('Erro ao cadastrar consulta:', err)
      alert('Erro ao salvar consulta: ' + err.message)
    } finally {
      setSalvandoConsulta(false)
    }
  }

  // Abrir modal de consulta pré-preenchendo a data
  const handleOpenNovaConsultaModal = () => {
    const hoje = new Date()
    const tzOffset = hoje.getTimezoneOffset() * 60000
    const localISODate = new Date(hoje.getTime() - tzOffset).toISOString().split('T')[0]
    setCDataConsulta(localISODate)
    setIsConsultaModalOpen(true)
  }

  // --- GERAÇÃO DE PLANO ALIMENTAR VIA IA ---
  const handleGerarPlanoIA = async () => {
    if (!paciente) return;

    const msgs = [
      "Buscando dados do paciente...",
      "Analisando metas, restrições e alergias...",
      "IA calculando o cardápio ideal...",
      "Estruturando refeições brasileiras...",
      "Diversificando opções alimentares...",
      "Finalizando formatação do plano..."
    ];

    setGerandoPlanoIA(true);
    let msgIdx = 0;
    setIaLoadingMsg(msgs[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % msgs.length;
      setIaLoadingMsg(msgs[msgIdx]);
    }, 1500);

    try {
      const pIdade = calcIdade(paciente.data_nascimento);
      const pPeso = getPesoAtual();
      
      const promptDados = `
Nome: ${paciente.nome}
Idade: ${pIdade !== null ? `${pIdade} anos` : 'Não informada'}
Sexo: ${paciente.sexo || 'Não informado'}
Peso Atual: ${pPeso ? `${pPeso} kg` : 'Não informado'}
Altura: ${paciente.altura ? `${paciente.altura} cm` : 'Não informada'}
Objetivos: ${Array.isArray(paciente.objetivos) && paciente.objetivos.length > 0 ? paciente.objetivos.join(', ') : ''} ${paciente.objetivo_texto ? `(Detalhe: ${paciente.objetivo_texto})` : ''}
Nível de Atividade: ${paciente.nivel_atividade || 'Não informado'}
Patologias/Condições de Saúde: ${Array.isArray(paciente.patologias) && paciente.patologias.length > 0 ? paciente.patologias.join(', ') : 'Nenhuma'}
Restrições Alimentares: ${Array.isArray(paciente.restricoes_alimentares) && paciente.restricoes_alimentares.length > 0 ? paciente.restricoes_alimentares.join(', ') : 'Nenhuma'}
Alergias Alimentares: ${Array.isArray(paciente.alergias) && paciente.alergias.length > 0 ? paciente.alergias.join(', ') : 'Nenhuma'}
Medicamentos: ${paciente.medicamentos || 'Nenhum'}
Suplementos: ${paciente.suplementos || 'Nenhum'}
Refeições por Dia: ${paciente.refeicoes_por_dia || 'Não informado'}
Rotina: Horário que acorda: ${paciente.horario_acorda || 'Não informado'}, Horário que dorme: ${paciente.horario_dorme || 'Não informado'}
Ingestão de Água Recomendada: ${paciente.litros_agua ? `${paciente.litros_agua} litros` : 'Não informado'}
Atividade Física: ${paciente.atividade_fisica ? `Sim (${paciente.atividade_fisica_descricao || ''})` : 'Não'}
Observações Gerais: ${paciente.observacoes || 'Nenhuma'}
      `;

      const res = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dados_do_paciente: promptDados })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro na resposta do servidor.');
      }

      const iaResponse = await res.json();
      const planoManual = converterIAParaManual(iaResponse);
      
      setPlanoFormConteudo(planoManual);
      setEditingPlanoId(null);
      setPlanoFormDiaAtivo('segunda');
      setIsPlanoFormOpen(true);
      alert('Plano alimentar gerado pela IA com sucesso! Revise as refeições de cada dia antes de salvar.');

    } catch (err: any) {
      console.error('Erro ao gerar plano com IA:', err);
      alert('Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?');
    } finally {
      clearInterval(interval);
      setGerandoPlanoIA(false);
    }
  };

  const converterIAParaManual = (iaPlan: any): PlanoManualConteudo => {
    const limpo = criarPlanoLimpo();
    if (!iaPlan || !Array.isArray(iaPlan.plano_semanal)) return limpo;

    const mapeamentoDias: Record<string, keyof PlanoManualConteudo['dias']> = {
      'segunda-feira': 'segunda', 'segunda': 'segunda',
      'terca-feira': 'terca', 'terca': 'terca', 'terça-feira': 'terca', 'terça': 'terca',
      'quarta-feira': 'quarta', 'quarta': 'quarta',
      'quinta-feira': 'quinta', 'quinta': 'quinta',
      'sexta-feira': 'sexta', 'sexta': 'sexta',
      'sabado': 'sabado', 'sábado': 'sabado',
      'domingo': 'domingo'
    };

    const mapRef: Record<string, keyof RefeicoesDia> = {
      'cafe_da_manha': 'cafe_manha', 'cafe_manha': 'cafe_manha',
      'lanche_manha': 'lanche_manha', 'lanche_da_manha': 'lanche_manha',
      'almoco': 'almoco',
      'lanche_tarde': 'lanche_tarde', 'lanche_da_tarde': 'lanche_tarde',
      'jantar': 'jantar'
    };

    iaPlan.plano_semanal.forEach((diaData: any) => {
      if (!diaData || !diaData.dia) return;
      const diaNome = diaData.dia.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .trim();
      
      const diaKey = mapeamentoDias[diaNome];
      if (!diaKey) return;

      const refeicoesIA = diaData.refeicoes || {};

      Object.keys(refeicoesIA).forEach((refIAKey) => {
        const refKey = mapRef[refIAKey];
        if (!refKey) return;

        const itens = refeicoesIA[refIAKey];
        if (Array.isArray(itens)) {
          for (let i = 0; i < 5; i++) {
            limpo.dias[diaKey][refKey][i] = itens[i] || "";
          }
        }
      });
    });

    return limpo;
  };

  // --- CONTROLES E SALVAMENTO DO PLANO ALIMENTAR MANUAL ---
  const handleNovoPlano = () => {
    setEditingPlanoId(null)
    setPlanoFormConteudo(criarPlanoLimpo())
    setPlanoFormDiaAtivo('segunda')
    setIsPlanoFormOpen(true)
  }

  const handleEditarPlano = (plano: PlanoAlimentar) => {
    setEditingPlanoId(plano.id)
    setPlanoFormConteudo(sanitizarPlano(plano.conteudo))
    setPlanoFormDiaAtivo('segunda')
    setIsPlanoFormOpen(true)
  }

  const handleInputChange = (dia: keyof PlanoManualConteudo['dias'], refeicao: keyof RefeicoesDia, index: number, value: string) => {
    setPlanoFormConteudo(prev => {
      const copy = JSON.parse(JSON.stringify(prev))
      copy.dias[dia][refeicao][index] = value
      return copy
    })
  }

  async function handleSalvarPlanoAlimentar(e: React.FormEvent) {
    e.preventDefault()
    if (!paciente) return

    try {
      setSalvandoPlano(true)

      if (editingPlanoId) {
        // Modo Edição (UPDATE)
        const { error } = await supabase
          .from('planos_alimentares')
          .update({ conteudo: planoFormConteudo })
          .eq('id', editingPlanoId)
        
        if (error) throw error
        alert('Plano alimentar atualizado com sucesso!')
      } else {
        // Modo Criação (INSERT)
        const { error } = await supabase
          .from('planos_alimentares')
          .insert([{ paciente_id: paciente.id, conteudo: planoFormConteudo }])

        if (error) throw error
        alert('Plano alimentar cadastrado com sucesso!')
      }

      // Resetar estados e recarregar
      setIsPlanoFormOpen(false)
      setEditingPlanoId(null)
      setPlanoFormConteudo(criarPlanoLimpo())
      setPlanoFormDiaAtivo('segunda')
      await fetchPerfilCompleto(paciente.id)

    } catch (err: any) {
      console.error('Erro ao salvar plano alimentar:', err)
      alert('Erro ao salvar plano alimentar: ' + err.message)
    } finally {
      setSalvandoPlano(false)
    }
  }

  // --- DESENHAR GRÁFICO SVG ---
  const renderGraficoPeso = () => {
    // 1. Filtrar consultas que tenham peso e ordenar cronologicamente crescente
    const consultasComPeso = [...consultas]
      .filter(c => c.peso !== null)
      .reverse() // consultas está decrescente (mais recente primeiro), então invertemos

    // 2. Se o paciente não tiver consultas registradas, ou nenhuma tiver peso
    if (consultasComPeso.length === 0) {
      return (
        <div className="grafico-placeholder">
          <svg className="grafico-placeholder-svg" viewBox="0 0 600 200">
            <rect x="10" y="10" width="580" height="180" rx="8" fill="none" stroke="var(--border-color)" strokeWidth="2" strokeDasharray="6 6" />
            <text x="300" y="105" textAnchor="middle" fill="var(--text-muted)" fontSize="15" fontWeight="500">
              Nenhuma consulta registrada ainda
            </text>
          </svg>
        </div>
      )
    }

    // Configurações do viewport
    const width = 600
    const height = 240
    const paddingLeft = 55
    const paddingRight = 30
    const paddingTop = 30
    const paddingBottom = 40

    const graphWidth = width - paddingLeft - paddingRight
    const graphHeight = height - paddingTop - paddingBottom

    // 3. Determinar escalas
    const pesos = consultasComPeso.map(c => c.peso as number)
    const pMin = Math.min(...pesos)
    const pMax = Math.max(...pesos)

    const delta = pMax - pMin
    const marginY = delta === 0 ? 10 : delta * 0.2 // margem de segurança no topo e base
    const yMin = Math.max(0, pMin - marginY)
    const yMax = pMax + marginY

    const nPoints = consultasComPeso.length

    // Gerar pontos (x, y)
    const points = consultasComPeso.map((c, i) => {
      const x = paddingLeft + (nPoints > 1 ? (i / (nPoints - 1)) * graphWidth : graphWidth / 2)
      const y = paddingTop + (1 - ((c.peso as number) - yMin) / (yMax - yMin)) * graphHeight
      return { x, y, val: c.peso, data: c.data_consulta }
    })

    // Construir caminhos SVG
    let pathD = ''
    let areaD = ''

    if (points.length > 0) {
      // Linha do gráfico
      pathD = `M ${points[0].x} ${points[0].y} `
      for (let i = 1; i < points.length; i++) {
        pathD += `L ${points[i].x} ${points[i].y} `
      }

      // Área sombreada sob a linha
      areaD = `M ${points[0].x} ${height - paddingBottom} `
      for (let i = 0; i < points.length; i++) {
        areaD += `L ${points[i].x} ${points[i].y} `
      }
      areaD += `L ${points[points.length - 1].x} ${height - paddingBottom} Z`
    }

    // Gridlines horizontais (4 linhas)
    const nGridlines = 4
    const gridlines = Array.from({ length: nGridlines }, (_, i) => {
      const yVal = yMin + (i / (nGridlines - 1)) * (yMax - yMin)
      const y = paddingTop + (1 - (yVal - yMin) / (yMax - yMin)) * graphHeight
      return { y, label: yVal.toFixed(1) }
    })

    return (
      <div className="grafico-card-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="grafico-svg">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--secondary)" />
              <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
          </defs>

          {/* Gridlines horizontais */}
          {gridlines.map((line, idx) => (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={line.y} 
                x2={width - paddingRight} 
                y2={line.y} 
                stroke="var(--border-color)" 
                strokeWidth="1" 
                strokeDasharray="4 4"
                opacity="0.6"
              />
              <text 
                x={paddingLeft - 8} 
                y={line.y + 4} 
                textAnchor="end" 
                fill="var(--text-muted)" 
                fontSize="11" 
                fontWeight="600"
              >
                {line.label} kg
              </text>
            </g>
          ))}

          {/* Área sombreada */}
          {areaD && <path d={areaD} fill="url(#areaGradient)" />}

          {/* Linha de evolução */}
          {pathD && (
            <path 
              d={pathD} 
              fill="none" 
              stroke="url(#lineGradient)" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* Pontos de dados e rótulos */}
          {points.map((pt, idx) => {
            const dateObj = new Date(pt.data + 'T00:00:00')
            const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`
            
            return (
              <g key={idx} className="graph-dot-group">
                {/* Efeito hover no círculo */}
                <circle 
                  cx={pt.x} 
                  cy={pt.y} 
                  r="7" 
                  fill="#ffffff" 
                  stroke="var(--primary)" 
                  strokeWidth="3.5" 
                  className="graph-dot"
                />
                
                {/* Valor do peso no topo do ponto */}
                <text 
                  x={pt.x} 
                  y={pt.y - 12} 
                  textAnchor="middle" 
                  fill="var(--text-dark)" 
                  fontSize="11" 
                  fontWeight="700"
                >
                  {pt.val}
                </text>

                {/* Eixo X: Data da consulta */}
                <text 
                  x={pt.x} 
                  y={height - paddingBottom + 20} 
                  textAnchor="middle" 
                  fill="var(--text-muted)" 
                  fontSize="10" 
                  fontWeight="600"
                >
                  {dateStr}
                </text>
              </g>
            )
          })}

          {/* Eixo X base line */}
          <line 
            x1={paddingLeft} 
            y1={height - paddingBottom} 
            x2={width - paddingRight} 
            y2={height - paddingBottom} 
            stroke="var(--border-color)" 
            strokeWidth="1.5" 
          />
        </svg>
      </div>
    )
  }

  // --- RENDERIZAR DETALHE DO PLANO ALIMENTAR ---
  const renderPlanoConteudoFormatado = (conteudo: any) => {
    if (!conteudo) return <p>Nenhum conteúdo no plano alimentar.</p>

    // Se o plano tiver a estrutura manual de dias
    if (conteudo.dias) {
      const diasSemana = [
        { key: 'segunda', label: 'Segunda-Feira' },
        { key: 'terca', label: 'Terça-Feira' },
        { key: 'quarta', label: 'Quarta-Feira' },
        { key: 'quinta', label: 'Quinta-Feira' },
        { key: 'sexta', label: 'Sexta-Feira' },
        { key: 'sabado', label: 'Sábado' },
        { key: 'domingo', label: 'Domingo' }
      ] as const;

      const refeicoesDef = [
        { key: 'cafe_manha', label: 'Café da Manhã', icon: '☀️' },
        { key: 'lanche_manha', label: 'Lanche da Manhã', icon: '🍎' },
        { key: 'almoco', label: 'Almoço', icon: '🍲' },
        { key: 'lanche_tarde', label: 'Lanche da Tarde', icon: '🥛' },
        { key: 'jantar', label: 'Jantar', icon: '🥗' }
      ] as const;

      const diaData = conteudo.dias[planoVisualizarDiaAtivo] || {};

      return (
        <div className="plano-detalhe-manual">
          {/* Abas de dias dentro do modal */}
          <div className="form-tabs" style={{ marginBottom: '20px', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {diasSemana.map((d) => (
              <button
                key={d.key}
                type="button"
                className={`form-tab-btn ${planoVisualizarDiaAtivo === d.key ? 'active' : ''}`}
                onClick={() => setPlanoVisualizarDiaAtivo(d.key)}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {refeicoesDef.map((ref) => {
              const itensRaw = diaData[ref.key] || [];
              const itensValidos = Array.isArray(itensRaw) 
                ? itensRaw.filter((i: any) => typeof i === 'string' && i.trim() !== '')
                : [];

              return (
                <div key={ref.key} className="card-refeicao-detalhe">
                  <div className="refeicao-header-detalhe">
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.2rem' }}>{ref.icon}</span>
                      <span className="refeicao-nome-detalhe">{ref.label}</span>
                    </div>
                  </div>
                  {itensValidos.length > 0 ? (
                    <ul className="refeicao-itens-detalhe">
                      {itensValidos.map((item: string, itemIdx: number) => (
                        <li key={itemIdx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                      Nenhuma opção cadastrada para esta refeição.
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Se o plano tiver refeições estruturadas (formato antigo/outros)
    if (conteudo.refeicoes && Array.isArray(conteudo.refeicoes)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {conteudo.refeicoes.map((ref: any, idx: number) => (
            <div key={idx} className="card-refeicao-detalhe">
              <div className="refeicao-header-detalhe">
                <span className="refeicao-nome-detalhe">{ref.nome || `Refeição ${idx + 1}`}</span>
                {ref.horario && <span className="refeicao-hora-detalhe">{ref.horario}</span>}
              </div>
              <ul className="refeicao-itens-detalhe">
                {Array.isArray(ref.itens) && ref.itens.map((item: any, itemIdx: number) => (
                  <li key={itemIdx}>{typeof item === 'string' ? item : `${item.alimento} - ${item.porcao || ''}`}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )
    }

    // Se for um JSON genérico ou string
    if (typeof conteudo === 'object') {
      return (
        <pre className="json-render-plano">
          {JSON.stringify(conteudo, null, 2)}
        </pre>
      )
    }

    return (
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-dark)' }}>
        {String(conteudo)}
      </div>
    )
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

  const idadeCalculada = calcIdade(paciente.data_nascimento)
  const imcCalculado = calcImc()
  const imcClassif = getImcClassificacao(imcCalculado)
  const imcColors = getImcColor(imcClassif)

  return (
    <div className="perfil-page">
      {/* Botão Voltar */}
      <button 
        className="btn btn-secondary" 
        onClick={() => navigate('/pacientes')} 
        style={{ marginBottom: '24px', padding: '8px 16px', fontSize: '0.875rem' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Voltar para a Lista
      </button>

      {/* Cabeçalho do Perfil (Banner Premium) */}
      <div className="profile-header-banner">
        <div className="profile-banner-left">
          <div className="avatar-placeholder">
            {paciente.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1>{paciente.nome}</h1>
            <div className="profile-badges-row">
              {idadeCalculada !== null && (
                <span className="badge-meta">{idadeCalculada} anos</span>
              )}
              {paciente.sexo && <span className="badge-meta">{paciente.sexo}</span>}
              {paciente.whatsapp && (
                <a 
                  href={`https://wa.me/${paciente.whatsapp.replace(/\D/g, '')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="badge-meta whatsapp-badge"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.453L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.49 1.967 14.03 .942 11.996.942c-5.445 0-9.87 4.373-9.875 9.805-.002 1.794.494 3.542 1.439 5.093l-1.008 3.682 3.823-.988c1.558.835 3.087 1.24 4.692 1.24zm10.74-7.447c-.297-.148-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  </svg>
                  {paciente.whatsapp}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="profile-banner-right">
          {imcCalculado && (
            <div className="quick-imc-box" style={{ borderColor: imcColors.text }}>
              <span className="quick-imc-label">IMC Atual</span>
              <span className="quick-imc-value" style={{ color: imcColors.text }}>{imcCalculado}</span>
              <span className="quick-imc-tag" style={{ backgroundColor: imcColors.bg, color: imcColors.text }}>
                {imcClassif}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navegação entre as 3 Seções Principais */}
      <div className="tabs-navegacao-principal">
        <button 
          className={`tab-navegacao-btn ${activeMainTab === 'ficha' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('ficha')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Dados do Paciente
        </button>
        <button 
          className={`tab-navegacao-btn ${activeMainTab === 'consultas' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('consultas')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
            <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
          </svg>
          Consultas & Evolução
        </button>
        <button 
          className={`tab-navegacao-btn ${activeMainTab === 'planos' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('planos')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Planos Alimentares
        </button>
      </div>

      {/* Banner de Feedback de Sucesso Temporário */}
      {showFeedbackPaciente && (
        <div className="banner-sucesso-flutuante">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Alterações salvas com sucesso no Supabase!
        </div>
      )}

      {/* --- ABA 1: DADOS DO PACIENTE --- */}
      {activeMainTab === 'ficha' && (
        <div>
          {/* Sub-Abas do Cadastro */}
          <div className="form-tabs" style={{ marginBottom: '24px' }}>
            <button 
              type="button" 
              className={`form-tab-btn ${activeFichaTab === 'pessoal' ? 'active' : ''}`}
              onClick={() => setActiveFichaTab('pessoal')}
            >
              Pessoal
            </button>
            <button 
              type="button" 
              className={`form-tab-btn ${activeFichaTab === 'clinico' ? 'active' : ''}`}
              onClick={() => setActiveFichaTab('clinico')}
            >
              Clínico
            </button>
            <button 
              type="button" 
              className={`form-tab-btn ${activeFichaTab === 'habitos' ? 'active' : ''}`}
              onClick={() => setActiveFichaTab('habitos')}
            >
              Hábitos
            </button>
          </div>

          <form onSubmit={handleSalvarFicha}>
            {/* SUB-ABA: PESSOAL */}
            {activeFichaTab === 'pessoal' && (
              <div className="card animate-fade-in">
                <h2>Informações Pessoais & Contato</h2>
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Nome Completo *</label>
                    <input 
                      type="text" 
                      value={nome} 
                      onChange={(e) => setNome(e.target.value)} 
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Data de Nascimento</label>
                    <input 
                      type="date" 
                      value={dataNascimento} 
                      onChange={(e) => setDataNascimento(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label>Sexo</label>
                    <select value={sexo} onChange={(e) => setSexo(e.target.value)}>
                      <option value="">Selecione...</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>WhatsApp</label>
                    <input 
                      type="text" 
                      value={whatsapp} 
                      onChange={(e) => setWhatsapp(aplicarMascaraTelefone(e.target.value))} 
                      placeholder="(00) 90000-0000"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>E-mail</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="paciente@exemplo.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-ABA: CLÍNICO */}
            {activeFichaTab === 'clinico' && (
              <div className="card animate-fade-in">
                <h2>Dados Clínicos & Histórico</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Peso Inicial</label>
                    <div className="input-suffix-wrapper">
                      <input 
                        type="number" 
                        step="0.1" 
                        value={pesoInicial} 
                        onChange={(e) => setPesoInicial(e.target.value)} 
                        placeholder="75.5"
                      />
                      <span className="input-suffix">kg</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Altura</label>
                    <div className="input-suffix-wrapper">
                      <input 
                        type="number" 
                        value={altura} 
                        onChange={(e) => setAltura(e.target.value)} 
                        placeholder="172"
                      />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>

                  {/* Objetivos */}
                  <div className="form-group" style={{ gridColumn: 'span 3', marginTop: '12px' }}>
                    <label>Objetivo Principal (Selecione vários se desejar)</label>
                    <div className="checkbox-grid">
                      {['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'].map(obj => (
                        <label key={obj} className={`checkbox-label ${objetivosSelecionados.includes(obj) ? 'checked' : ''}`}>
                          <input 
                            type="checkbox" 
                            checked={objetivosSelecionados.includes(obj)} 
                            onChange={() => handleObjetivoCheckbox(obj)}
                          />
                          {obj}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Detalhamento do Objetivo</label>
                    <textarea 
                      value={objetivoLivre} 
                      onChange={(e) => setObjetivoLivre(e.target.value)} 
                      rows={2}
                      placeholder="Observações complementares sobre o objetivo"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Nível de Atividade Física</label>
                    <select value={nivelAtividade} onChange={(e) => setNivelAtividade(e.target.value)}>
                      <option value="">Selecione...</option>
                      <option value="Sedentário">Sedentário (Pouco ou nenhum exercício)</option>
                      <option value="Levemente ativo">Levemente ativo (Exercício leve 1-3 dias/semana)</option>
                      <option value="Moderadamente ativo">Moderadamente ativo (Exercício moderado 3-5 dias/semana)</option>
                      <option value="Muito ativo">Muito ativo (Exercício pesado 6-7 dias/semana)</option>
                      <option value="Extremamente ativo">Extremamente ativo (Trabalho físico pesado ou treino diário intenso)</option>
                    </select>
                  </div>

                  {/* Patologias */}
                  <div className="form-group" style={{ gridColumn: 'span 3', marginTop: '12px' }}>
                    <label>Patologias ou Condições de Saúde</label>
                    <div className="checkbox-grid">
                      <label className={`checkbox-label ${patologiaNenhum ? 'checked' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={patologiaNenhum} 
                          onChange={(e) => handleNenhumChange(setPatologiaNenhum, setPatologiasSelecionadas, setPatologiaLivre, e.target.checked)}
                        />
                        <strong>Nenhum</strong>
                      </label>
                      {['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'].map(pat => (
                        <label 
                          key={pat} 
                          className={`checkbox-label ${patologiasSelecionadas.includes(pat) ? 'checked' : ''} ${patologiaNenhum ? 'disabled' : ''}`}
                        >
                          <input 
                            type="checkbox" 
                            disabled={patologiaNenhum}
                            checked={patologiasSelecionadas.includes(pat)} 
                            onChange={() => handleCheckboxChange(pat, patologiasSelecionadas, setPatologiasSelecionadas, patologiaNenhum, setPatologiaNenhum)}
                          />
                          {pat}
                        </label>
                      ))}
                    </div>
                    <input 
                      type="text" 
                      value={patologiaLivre}
                      disabled={patologiaNenhum}
                      onChange={(e) => setPatologiaLivre(e.target.value)}
                      placeholder="Outra patologia..."
                      style={{ marginTop: '12px' }}
                    />
                  </div>

                  {/* Restrições */}
                  <div className="form-group" style={{ gridColumn: 'span 3', marginTop: '12px' }}>
                    <label>Restrições Alimentares</label>
                    <div className="checkbox-grid">
                      <label className={`checkbox-label ${restricaoNenhum ? 'checked' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={restricaoNenhum} 
                          onChange={(e) => handleNenhumChange(setRestricaoNenhum, setRestricoesSelecionadas, setRestricaoLivre, e.target.checked)}
                        />
                        <strong>Nenhum</strong>
                      </label>
                      {['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'].map(res => (
                        <label 
                          key={res} 
                          className={`checkbox-label ${restricoesSelecionadas.includes(res) ? 'checked' : ''} ${restricaoNenhum ? 'disabled' : ''}`}
                        >
                          <input 
                            type="checkbox" 
                            disabled={restricaoNenhum}
                            checked={restricoesSelecionadas.includes(res)} 
                            onChange={() => handleCheckboxChange(res, restricoesSelecionadas, setRestricoesSelecionadas, restricaoNenhum, setRestricaoNenhum)}
                          />
                          {res}
                        </label>
                      ))}
                    </div>
                    <input 
                      type="text" 
                      value={restricaoLivre}
                      disabled={restricaoNenhum}
                      onChange={(e) => setRestricaoLivre(e.target.value)}
                      placeholder="Outra restrição..."
                      style={{ marginTop: '12px' }}
                    />
                  </div>

                  {/* Alergias */}
                  <div className="form-group" style={{ gridColumn: 'span 3', marginTop: '12px' }}>
                    <label>Alergias Alimentares</label>
                    <div className="checkbox-grid">
                      <label className={`checkbox-label ${alergiaNenhum ? 'checked' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={alergiaNenhum} 
                          onChange={(e) => handleNenhumChange(setAlergiaNenhum, setAlergiasSelecionadas, setAlergiaLivre, e.target.checked)}
                        />
                        <strong>Nenhum</strong>
                      </label>
                      {['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'].map(al => (
                        <label 
                          key={al} 
                          className={`checkbox-label ${alergiasSelecionadas.includes(al) ? 'checked' : ''} ${alergiaNenhum ? 'disabled' : ''}`}
                        >
                          <input 
                            type="checkbox" 
                            disabled={alergiaNenhum}
                            checked={alergiasSelecionadas.includes(al)} 
                            onChange={() => handleCheckboxChange(al, alergiasSelecionadas, setAlergiasSelecionadas, alergiaNenhum, setAlergiaNenhum)}
                          />
                          {al}
                        </label>
                      ))}
                    </div>
                    <input 
                      type="text" 
                      value={alergiaLivre}
                      disabled={alergiaNenhum}
                      onChange={(e) => setAlergiaLivre(e.target.value)}
                      placeholder="Outra alergia..."
                      style={{ marginTop: '12px' }}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 3', marginTop: '12px' }}>
                    <label>Medicamentos de Uso Contínuo</label>
                    <textarea 
                      value={medicamentos} 
                      onChange={(e) => setMedicamentos(e.target.value)} 
                      rows={2}
                      placeholder="Escreva os medicamentos utilizados"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Suplementos em Uso</label>
                    <textarea 
                      value={suplementos} 
                      onChange={(e) => setSuplementos(e.target.value)} 
                      rows={2}
                      placeholder="Escreva suplementações e vitaminas utilizadas"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-ABA: HÁBITOS */}
            {activeFichaTab === 'habitos' && (
              <div className="card animate-fade-in">
                <h2>Hábitos & Estilo de Vida</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Refeições por Dia</label>
                    <input 
                      type="number" 
                      value={refeicoesPorDia} 
                      onChange={(e) => setRefeicoesPorDia(e.target.value)} 
                      placeholder="Ex: 5"
                    />
                  </div>

                  <div className="form-group">
                    <label>Horário que Acorda</label>
                    <input 
                      type="text" 
                      value={horarioAcorda} 
                      onChange={(e) => setHorarioAcorda(e.target.value)}
                      onBlur={(e) => handleBlurHora(e.target.value, setHorarioAcorda)}
                      placeholder="Ex: 06:30"
                    />
                  </div>

                  <div className="form-group">
                    <label>Horário que Dorme</label>
                    <input 
                      type="text" 
                      value={horarioDorme} 
                      onChange={(e) => setHorarioDorme(e.target.value)}
                      onBlur={(e) => handleBlurHora(e.target.value, setHorarioDorme)}
                      placeholder="Ex: 22:30"
                    />
                  </div>

                  <div className="form-group">
                    <label>Litros de Água/Dia</label>
                    <div className="input-suffix-wrapper">
                      <input 
                        type="number" 
                        step="0.1" 
                        value={litrosAgua} 
                        onChange={(e) => setLitrosAgua(e.target.value)} 
                        placeholder="2.5"
                      />
                      <span className="input-suffix">litros</span>
                    </div>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Pratica Atividade Física?</label>
                    <select 
                      value={praticaAtividadeFisica} 
                      onChange={(e) => setPraticaAtividadeFisica(e.target.value)}
                    >
                      <option value="nao">Não</option>
                      <option value="sim">Sim</option>
                    </select>
                  </div>

                  {praticaAtividadeFisica === 'sim' && (
                    <div className="form-group" style={{ gridColumn: 'span 3' }}>
                      <label>Descrição da Atividade Física & Frequência</label>
                      <input 
                        type="text" 
                        value={atividadeFisicaDescricao} 
                        onChange={(e) => setAtividadeFisicaDescricao(e.target.value)}
                        placeholder="Ex: Musculação 4x na semana, Corrida 2x"
                      />
                    </div>
                  )}

                  <div className="form-group" style={{ gridColumn: 'span 3', marginTop: '12px' }}>
                    <label>Observações Gerais</label>
                    <textarea 
                      value={observacoesPaciente} 
                      onChange={(e) => setObservacoesPaciente(e.target.value)} 
                      rows={3}
                      placeholder="Observações complementares sobre a rotina e hábitos do paciente"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Ações da Ficha */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={salvandoPaciente}
                style={{ minWidth: '180px' }}
              >
                {salvandoPaciente ? (
                  <>
                    <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
                    Salvando alterações...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- ABA 2: CONSULTAS & EVOLUÇÃO --- */}
      {activeMainTab === 'consultas' && (
        <div className="animate-fade-in">
          {/* Gráfico de Evolução de Peso */}
          <div className="card">
            <h2>Evolução de Peso</h2>
            {renderGraficoPeso()}
          </div>

          {/* Histórico e Ações de Consulta */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2>Histórico de Consultas ({consultas.length})</h2>
              <button className="btn btn-primary" onClick={handleOpenNovaConsultaModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Nova Consulta
              </button>
            </div>

            {consultas.length === 0 ? (
              <div className="empty-state">
                <p>Nenhuma consulta registrada para este paciente ainda.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {consultas.map((consulta) => (
                  <div key={consulta.id} className="consulta-card-item">
                    <div className="consulta-header">
                      <span className="consulta-data">
                        Consulta em {new Date(consulta.data_consulta + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      {consulta.proximo_retorno && (
                        <span className="consulta-retorno">
                          Retorno: <strong>{new Date(consulta.proximo_retorno + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
                        </span>
                      )}
                    </div>

                    <div className="consulta-stats-grid">
                      <div>
                        <div className="info-label">Peso</div>
                        <div className="info-value-highlight">{consulta.peso ? `${consulta.peso} kg` : '-'}</div>
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
                      <div className="consulta-obs">
                        <strong>Observações da consulta:</strong>
                        <p>{consulta.observacoes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ABA 3: PLANOS ALIMENTARES --- */}
      {activeMainTab === 'planos' && (
        <div className="animate-fade-in">
          {/* Overlay de carregamento da IA */}
          {gerandoPlanoIA && (
            <div className="modal-overlay" style={{ zIndex: 1100 }}>
              <div className="modal-card animate-scale-in" style={{ maxWidth: '420px', padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div className="spinner" style={{ width: '50px', height: '50px', borderWidth: '4px' }}></div>
                <h3 style={{ margin: 0, color: 'var(--primary)', fontWeight: '800' }}>Gerando Plano com IA</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', minHeight: '48px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {iaLoadingMsg}
                </p>
              </div>
            </div>
          )}

          {!isPlanoFormOpen ? (
            /* --- TELA 1: LISTAGEM / HISTÓRICO --- */
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2>Histórico de Planos Alimentares ({planos.length})</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                    Acompanhe e visualize os planos alimentares cadastrados para o paciente.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button 
                    type="button"
                    className="btn" 
                    onClick={handleGerarPlanoIA}
                    disabled={gerandoPlanoIA}
                    style={{
                      background: 'linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(170, 59, 255, 0.25)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    ✨ Gerar Plano com IA
                  </button>
                  <button 
                    type="button"
                    className="btn btn-primary" 
                    onClick={handleNovoPlano}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}>
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Novo Plano Alimentar
                  </button>
                </div>
              </div>

              {planos.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhum plano alimentar cadastrado ainda.</p>
                </div>
              ) : (
                <div className="planos-list-grid">
                  {planos.map((plano) => (
                    <div key={plano.id} className="plano-card-item">
                      <div className="plano-card-header">
                        <div className="plano-icon-badge">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                        </div>
                        <div>
                          <span className="plano-titulo">Plano Alimentar</span>
                          <span className="plano-data">
                            Criado em {new Date(plano.created_at).toLocaleDateString('pt-BR')} às {new Date(plano.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => {
                            setPlanoVisualizarDiaAtivo('segunda');
                            setSelectedPlano(plano);
                          }}
                          style={{ flex: 1, padding: '10px 12px', fontSize: '0.85rem' }}
                        >
                          Visualizar
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleEditarPlano(plano)}
                          style={{ flex: 1, padding: '10px 12px', fontSize: '0.85rem' }}
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* --- TELA 2: FORMULÁRIO DE CRIAÇÃO / EDIÇÃO --- */
            <form onSubmit={handleSalvarPlanoAlimentar} className="card animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <h2>{editingPlanoId ? 'Editar Plano Alimentar' : 'Novo Plano Alimentar'}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                    Configure os alimentos para cada dia da semana.
                  </p>
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setIsPlanoFormOpen(false);
                    setEditingPlanoId(null);
                  }}
                  style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                >
                  Cancelar
                </button>
              </div>

              {/* Abas de Dias da Semana */}
              <div className="form-tabs" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '4px' }}>
                {[
                  { key: 'segunda', label: 'Segunda-Feira' },
                  { key: 'terca', label: 'Terça-Feira' },
                  { key: 'quarta', label: 'Quarta-Feira' },
                  { key: 'quinta', label: 'Quinta-Feira' },
                  { key: 'sexta', label: 'Sexta-Feira' },
                  { key: 'sabado', label: 'Sábado' },
                  { key: 'domingo', label: 'Domingo' }
                ].map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    className={`form-tab-btn ${planoFormDiaAtivo === d.key ? 'active' : ''}`}
                    onClick={() => setPlanoFormDiaAtivo(d.key as any)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Grade de Refeições para o Dia Ativo */}
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {[
                  { key: 'cafe_manha', label: 'Café da Manhã', icon: '☀️' },
                  { key: 'lanche_manha', label: 'Lanche da Manhã', icon: '🍎' },
                  { key: 'almoco', label: 'Almoço', icon: '🍲' },
                  { key: 'lanche_tarde', label: 'Lanche da Tarde', icon: '🥛' },
                  { key: 'jantar', label: 'Jantar', icon: '🥗' }
                ].map((ref) => (
                  <div key={ref.key} className="consulta-card-item" style={{ padding: '20px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '1.25rem' }}>{ref.icon}</span>
                      <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>{ref.label}</strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <input
                          key={idx}
                          type="text"
                          placeholder={`Opção de Alimento ${idx + 1}`}
                          value={planoFormConteudo.dias[planoFormDiaAtivo][ref.key as keyof RefeicoesDia][idx] || ''}
                          onChange={(e) => handleInputChange(planoFormDiaAtivo, ref.key as keyof RefeicoesDia, idx, e.target.value)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botões de Ação do Formulário */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsPlanoFormOpen(false);
                    setEditingPlanoId(null);
                  }}
                  disabled={salvandoPlano}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={salvandoPlano}
                  style={{ minWidth: '160px' }}
                >
                  {salvandoPlano ? (
                    <>
                      <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
                      Salvando...
                    </>
                  ) : (
                    editingPlanoId ? 'Atualizar Plano' : 'Salvar Plano'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* --- MODAL DE NOVA CONSULTA --- */}
      {isConsultaModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card animate-scale-in">
            <div className="modal-header">
              <h3>Nova Consulta</h3>
              <button className="btn-close-modal" onClick={() => setIsConsultaModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSalvarConsulta}>
              <div className="modal-body">
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Data da Consulta *</label>
                    <input 
                      type="date" 
                      value={cDataConsulta} 
                      onChange={(e) => setCDataConsulta(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Peso Atual (kg) *</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={cPeso} 
                      onChange={(e) => setCPeso(e.target.value)} 
                      placeholder="Ex: 70.5"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>% de Gordura (opcional)</label>
                    <div className="input-suffix-wrapper">
                      <input 
                        type="number" 
                        step="0.1" 
                        value={cPercentualGordura} 
                        onChange={(e) => setCPercentualGordura(e.target.value)} 
                        placeholder="Ex: 18.5"
                      />
                      <span className="input-suffix">%</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Cintura (cm, opcional)</label>
                    <div className="input-suffix-wrapper">
                      <input 
                        type="number" 
                        step="0.1" 
                        value={cCintura} 
                        onChange={(e) => setCCintura(e.target.value)} 
                        placeholder="Ex: 82"
                      />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Quadril (cm, opcional)</label>
                    <div className="input-suffix-wrapper">
                      <input 
                        type="number" 
                        step="0.1" 
                        value={cQuadril} 
                        onChange={(e) => setCQuadril(e.target.value)} 
                        placeholder="Ex: 98"
                      />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Próximo Retorno (opcional)</label>
                    <input 
                      type="date" 
                      value={cProximoRetorno} 
                      onChange={(e) => setCProximoRetorno(e.target.value)} 
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Observações da Consulta</label>
                    <textarea 
                      value={cObservacoes} 
                      onChange={(e) => setCObservacoes(e.target.value)} 
                      rows={3}
                      placeholder="Descreva queixas, mudanças de hábitos ou impressões desta consulta..."
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsConsultaModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={salvandoConsulta}
                >
                  {salvandoConsulta ? (
                    <>
                      <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
                      Salvando...
                    </>
                  ) : 'Salvar consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE VISUALIZAÇÃO DE PLANO --- */}
      {selectedPlano && (
        <div className="modal-overlay">
          <div className="modal-card modal-large animate-scale-in">
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Plano Alimentar Completo</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  Gerado em {new Date(selectedPlano.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <button className="btn-close-modal" onClick={() => setSelectedPlano(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {renderPlanoConteudoFormatado(selectedPlano.conteudo)}
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setSelectedPlano(null)}
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
