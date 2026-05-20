import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type TabType = 'pessoal' | 'clinico' | 'habitos'

export default function PacienteCadastro() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('pessoal')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // --- ABA 1: PESSOAL ---
  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [idade, setIdade] = useState<number | null>(null)
  const [sexo, setSexo] = useState('')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')

  // --- ABA 2: CLÍNICO ---
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')
  const [imc, setImc] = useState('')
  const [imcClassificacao, setImcClassificacao] = useState('')
  
  // Objetivos (múltipla escolha)
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>([])
  const [objetivoLivre, setObjetivoLivre] = useState('')

  // Nível de atividade
  const [nivelAtividade, setNivelAtividade] = useState('')

  // Patologias
  const [patologiasSelecionadas, setPatologiasSelecionadas] = useState<string[]>([])
  const [patologiaNenhum, setPatologiaNenhum] = useState(false)
  const [patologiaLivre, setPatologiaLivre] = useState('')

  // Restrições alimentares
  const [restricoesSelecionadas, setRestricoesSelecionadas] = useState<string[]>([])
  const [restricaoNenhum, setRestricaoNenhum] = useState(false)
  const [restricaoLivre, setRestricaoLivre] = useState('')

  // Alergias alimentares
  const [alergiasSelecionadas, setAlergiasSelecionadas] = useState<string[]>([])
  const [alergiaNenhum, setAlergiaNenhum] = useState(false)
  const [alergiaLivre, setAlergiaLivre] = useState('')

  const [medicamentos, setMedicamentos] = useState('')
  const [suplementos, setSuplementos] = useState('')

  // --- ABA 3: HÁBITOS ---
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('')
  const [horarioAcorda, setHorarioAcorda] = useState('')
  const [horarioDorme, setHorarioDorme] = useState('')
  const [litrosAgua, setLitrosAgua] = useState('')
  const [praticaAtividadeFisica, setPraticaAtividadeFisica] = useState('nao')
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Pegar id da nutricionista logada
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id)
      } else {
        navigate('/login')
      }
    })
  }, [navigate])

  // Calcular Idade automaticamente
  useEffect(() => {
    if (dataNascimento) {
      const nasc = new Date(dataNascimento + 'T00:00:00')
      const hoje = new Date()
      let i = hoje.getFullYear() - nasc.getFullYear()
      const m = hoje.getMonth() - nasc.getMonth()
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
        i--
      }
      setIdade(i >= 0 ? i : 0)
    } else {
      setIdade(null)
    }
  }, [dataNascimento])

  // Calcular IMC automaticamente
  useEffect(() => {
    const p = parseFloat(peso)
    const a = parseFloat(altura) / 100 // cm para metros
    if (isNaN(p) || isNaN(a) || a <= 0) {
      setImc('')
      setImcClassificacao('')
      return
    }

    const valorImc = p / (a * a)
    setImc(valorImc.toFixed(1))

    // Classificação
    if (valorImc < 18.5) {
      setImcClassificacao('Abaixo do Peso')
    } else if (valorImc >= 18.5 && valorImc < 25) {
      setImcClassificacao('Peso Normal')
    } else if (valorImc >= 25 && valorImc < 30) {
      setImcClassificacao('Sobrepeso')
    } else {
      setImcClassificacao('Obesidade')
    }
  }, [peso, altura])

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

  // --- LÓGICA DE SELEÇÃO CHECKBOX (MUTUAMENTE EXCLUSIVO COM NENHUM) ---
  const handleCheckboxChange = (
    item: string,
    lista: string[],
    setLista: (l: string[]) => void,
    nenhumState: boolean,
    setNenhumState: (b: boolean) => void
  ) => {
    if (nenhumState) {
      // Se 'Nenhum' está ativo, desativa 'Nenhum' ao clicar em outro item
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
      setLista([]) // Limpa os outros
      setLivreState('') // Limpa campo livre
    }
  }

  const handleObjetivoCheckbox = (item: string) => {
    if (objetivosSelecionados.includes(item)) {
      setObjetivosSelecionados(objetivosSelecionados.filter(i => i !== item))
    } else {
      setObjetivosSelecionados([...objetivosSelecionados, item])
    }
  }

  // --- SALVAR PACIENTE ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome) {
      alert('O campo Nome Completo é obrigatório!')
      setActiveTab('pessoal')
      return
    }

    if (!userId) {
      alert('Você não está autenticado.')
      navigate('/login')
      return
    }

    try {
      setLoading(true)

      // Montar arrays finais mesclando checkboxes com campo livre
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
        nutricionista_id: userId,
        nome,
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        whatsapp: whatsapp || null,
        email: email || null,
        peso_inicial: peso ? parseFloat(peso) : null,
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
        observacoes: observacoes.trim() || null
      }

      const { data, error } = await supabase
        .from('pacientes')
        .insert([payload])
        .select('id')
        .single()

      if (error) throw error

      alert('Paciente cadastrado com sucesso!')
      
      if (data) {
        navigate(`/pacientes/${data.id}`)
      } else {
        navigate('/pacientes')
      }

    } catch (err: any) {
      console.error('Erro ao salvar paciente:', err)
      alert('Erro ao salvar paciente: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Cores de fundo do IMC
  const getImcColor = () => {
    if (imcClassificacao === 'Peso Normal') return { bg: '#e6f4ea', text: '#137333' }
    if (imcClassificacao === 'Sobrepeso' || imcClassificacao === 'Abaixo do Peso') return { bg: '#fef7e0', text: '#b06000' }
    if (imcClassificacao === 'Obesidade') return { bg: '#fce8e6', text: '#c5221f' }
    return { bg: 'var(--bg-main)', text: 'var(--text-dark)' }
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
            Novo Paciente
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Preencha a ficha do paciente nas abas abaixo para cadastrá-lo.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/pacientes')}>
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Controle das Abas */}
        <div className="form-tabs">
          <button 
            type="button" 
            className={`form-tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`}
            onClick={() => setActiveTab('pessoal')}
          >
            Pessoal
          </button>
          <button 
            type="button" 
            className={`form-tab-btn ${activeTab === 'clinico' ? 'active' : ''}`}
            onClick={() => setActiveTab('clinico')}
          >
            Clínico
          </button>
          <button 
            type="button" 
            className={`form-tab-btn ${activeTab === 'habitos' ? 'active' : ''}`}
            onClick={() => setActiveTab('habitos')}
          >
            Hábitos
          </button>
        </div>

        {/* --- ABA 1: PESSOAL --- */}
        {activeTab === 'pessoal' && (
          <div className="card">
            <h2>Dados Pessoais</h2>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Nome Completo *</label>
                <input 
                  type="text" 
                  value={nome} 
                  onChange={(e) => setNome(e.target.value)} 
                  placeholder="Nome completo do paciente"
                  required
                />
              </div>

              <div className="form-group">
                <label>Data de Nascimento</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="date" 
                    value={dataNascimento} 
                    onChange={(e) => setDataNascimento(e.target.value)} 
                    style={{ flex: 1 }}
                  />
                  {idade !== null && (
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {idade} anos
                    </span>
                  )}
                </div>
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
                <label>Telefone</label>
                <input 
                  type="text" 
                  value={telefone} 
                  onChange={(e) => setTelefone(aplicarMascaraTelefone(e.target.value))} 
                  placeholder="(00) 0000-0000"
                />
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
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setActiveTab('clinico')}
              >
                Próximo: Clínico
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* --- ABA 2: CLÍNICO --- */}
        {activeTab === 'clinico' && (
          <div className="card">
            <h2>Avaliação Clínica</h2>
            <div className="form-grid">
              
              <div className="form-group">
                <label>Peso Atual</label>
                <div className="input-suffix-wrapper">
                  <input 
                    type="number" 
                    step="0.1" 
                    value={peso} 
                    onChange={(e) => setPeso(e.target.value)} 
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

              <div className="form-group" style={{ display: 'flex', justifyContent: 'flex-end', flexDirection: 'column' }}>
                <label>IMC Calculado (Somente Leitura)</label>
                <div className="imc-indicator">
                  <span>IMC:</span>
                  <span className="imc-value">{imc || '-'}</span>
                  {imcClassificacao && (
                    <span 
                      className="imc-tag" 
                      style={{ 
                        backgroundColor: getImcColor().bg, 
                        color: getImcColor().text 
                      }}
                    >
                      {imcClassificacao}
                    </span>
                  )}
                </div>
              </div>

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
                <label>Objetivo - Detalhamento ou Texto Adicional</label>
                <textarea 
                  value={objetivoLivre} 
                  onChange={(e) => setObjetivoLivre(e.target.value)} 
                  rows={2}
                  placeholder="Observações adicionais sobre o objetivo do paciente"
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
                  placeholder="Adicionar patologia customizada... (escreva e salve)"
                  style={{ marginTop: '12px' }}
                />
              </div>

              {/* Restrições Alimentares */}
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
                  placeholder="Adicionar restrição customizada... (escreva e salve)"
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
                  placeholder="Adicionar alergia customizada... (escreva e salve)"
                  style={{ marginTop: '12px' }}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 3', marginTop: '12px' }}>
                <label>Medicamentos Contínuos</label>
                <textarea 
                  value={medicamentos} 
                  onChange={(e) => setMedicamentos(e.target.value)} 
                  rows={2}
                  placeholder="Descreva medicamentos de uso contínuo"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label>Suplementos em Uso</label>
                <textarea 
                  value={suplementos} 
                  onChange={(e) => setSuplementos(e.target.value)} 
                  rows={2}
                  placeholder="Descreva suplementos e vitaminas em uso"
                />
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setActiveTab('pessoal')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Anterior: Pessoal
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setActiveTab('habitos')}
              >
                Próximo: Hábitos
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* --- ABA 3: HÁBITOS --- */}
        {activeTab === 'habitos' && (
          <div className="card">
            <h2>Hábitos & Estilo de Vida</h2>
            <div className="form-grid">
              
              <div className="form-group">
                <label>Número de Refeições/Dia</label>
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
                  placeholder="Ex: 630 (→ 06:30)"
                />
              </div>

              <div className="form-group">
                <label>Horário que Dorme</label>
                <input 
                  type="text" 
                  value={horarioDorme} 
                  onChange={(e) => setHorarioDorme(e.target.value)}
                  onBlur={(e) => handleBlurHora(e.target.value, setHorarioDorme)}
                  placeholder="Ex: 2230 (→ 22:30)"
                />
              </div>

              <div className="form-group">
                <label>Quantidade de Água/Dia</label>
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
                  <label>Qual Atividade & Frequência Semanal</label>
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
                  value={observacoes} 
                  onChange={(e) => setObservacoes(e.target.value)} 
                  rows={4}
                  placeholder="Observações complementares importantes"
                />
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setActiveTab('clinico')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Anterior: Clínico
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
                style={{ minWidth: '180px' }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span>
                    Salvando...
                  </span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Salvar Paciente
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
