import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Paciente {
  id: string;
  nome: string;
}

interface PlanoAlimentar {
  id: string;
  paciente_id: string;
  conteudo: any;
  created_at: string;
  pacientes: Paciente | null;
}

export default function PlanosAlimentares() {
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [selectedPlano, setSelectedPlano] = useState<PlanoAlimentar | null>(null)
  const [planoVisualizarDiaAtivo, setPlanoVisualizarDiaAtivo] = useState<'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo'>('segunda')
  const navigate = useNavigate()

  // Novo estado para controlar a aba ativa na tela de planos alimentares
  const [activeTab, setActiveTab] = useState<'por_paciente' | 'por_necessidade'>('por_paciente')

  // Modelos de Dieta por Necessidade (Templates Fictícios)
  const modelosNecessidade = [
    {
      id: 'template-mediterranea',
      paciente_id: 'temp-1',
      created_at: new Date().toISOString(),
      pacientes: { id: 'temp-1', nome: 'Dieta Mediterrânea' },
      titulo: 'Dieta Mediterrânea',
      descricao: 'Rica em gorduras monoinsaturadas (azeite de oliva, nozes), peixes, vegetais frescos e grãos integrais. Excelente para a saúde cardiovascular e longevidade.',
      conteudo: {
        dias: {
          segunda: {
            cafe_manha: ['Iogurte grego natural com nozes picadas e mel', '1 fatia de pão de fermentação natural com azeite', 'Chá de hibisco'],
            lanche_manha: ['1 maçã verde cozida com canela'],
            almoco: ['Filé de salmão assado com ervas', 'Salada de folhas verdes, tomate cereja, pepino e azeitonas pretas', 'Arroz integral cozido'],
            lanche_tarde: ['Mix de sementes (girassol e abóbora) e amêndoas (30g)'],
            jantar: ['Omelete de 2 ovos com espinafre e queijo cottage', 'Salada de rúcula regada com limão e azeite extra virgem']
          },
          terca: {
            cafe_manha: ['Crepioca integral com creme de ricota', 'Café preto sem açúcar', '1/2 abacate picado'],
            lanche_manha: ['Pera fresca com casca'],
            almoco: ['Sobrecoxa de frango grelhada sem pele', 'Legumes assados no azeite (abobrinha, cenoura, berinjela)', 'Quinoa cozida'],
            lanche_tarde: ['Iogurte natural integral com chia'],
            jantar: ['Atum grelhado', 'Couve refogada no alho', 'Salada de grão-de-bico com pimentões']
          },
          quarta: {
            cafe_manha: ['Aveia amanhecida (overnight oats) no leite de amêndoas', 'Morangos frescos picados'],
            lanche_manha: ['Mix de castanhas do pará e caju (30g)'],
            almoco: ['Sardinha fresca assada', 'Brócolis e vagem cozidos no vapor', 'Batata doce assada no azeite'],
            lanche_tarde: ['1 banana prata amassada com linhaça dourada'],
            jantar: ['Sopa caseira de lentilha com cenoura e chuchu']
          },
          quinta: {
            cafe_manha: ['Ovos mexidos com tomate e orégano', '1 torrada de pão integral'],
            lanche_manha: ['1 copo pequeno de água de coco fresca'],
            almoco: ['Tiras de peito de frango refogadas', 'Salada grega (tomate, pepino, cebola roxa e queijo feta)'],
            lanche_tarde: ['Iogurte desnatado com lascas de amêndoas'],
            jantar: ['Espaguete de abobrinha ao pesto com tomates cereja grelhados']
          },
          sexta: {
            cafe_manha: ['Salada de frutas frescas com sementes de chia', 'Café coado'],
            lanche_manha: ['Damascos secos (2 unidades) e 3 nozes'],
            almoco: ['Lombo de bacalhau assado com batatas inglesas picadas e pimentões coloridos no azeite'],
            lanche_tarde: ['Coco seco em lascas'],
            jantar: ['Sopa creme de abóbora cabotiá com frango desfiado']
          },
          sabado: {
            cafe_manha: ['2 ovos cozidos com azeite e pimenta preta', 'Mamão formosa com linhaça'],
            lanche_manha: ['Nozes chilenas (3 unidades)'],
            almoco: ['Risoto integral de cogumelos frescos', 'Salada de rúcula e tomate'],
            lanche_tarde: ['1 pera assada com canela'],
            jantar: ['Wrap de pão folha integral com homus (pasta de grão-de-bico) e folhas verdes']
          },
          domingo: {
            cafe_manha: ['Panqueca funcional de banana e farelo de aveia', 'Chá verde'],
            lanche_manha: ['Morangos inteiros frescos'],
            almoco: ['Sobrecoxa de frango grelhada com alecrim', 'Pure de batata baroa cozido com azeite'],
            lanche_tarde: ['Iogurte grego natural com mel'],
            jantar: ['Caldinho leve de legumes com pedaços de frango desfiado']
          }
        }
      }
    },
    {
      id: 'template-lowcarb',
      paciente_id: 'temp-2',
      created_at: new Date().toISOString(),
      pacientes: { id: 'temp-2', nome: 'Restrição de Carboidratos' },
      titulo: 'Dietas com Restrição de Carboidratos',
      descricao: 'Menu com foco em baixo teor de carboidratos líquidos. Prioriza gorduras saudáveis, proteínas de alta qualidade e vegetais de baixo índice glicêmico para cetose leve ou emagrecimento.',
      conteudo: {
        dias: {
          segunda: {
            cafe_manha: ['3 ovos mexidos na manteiga de garrafa', 'Café preto com nata ou manteiga ghee (bulletproof)', 'Morangos frescos (4 unidades)'],
            lanche_manha: ['Castanhas de caju sem sal (25g)'],
            almoco: ['Patinho moído refogado', 'Espaguete de abobrinha na manteiga de alho', 'Salada de folhas verdes com azeite extra virgem'],
            lanche_tarde: ['1 fatia média de queijo de coalho grelhado'],
            jantar: ['Filé de peito de frango grelhado', 'Brócolis refogado com alho', 'Salada de rúcula com abacate fatiado']
          },
          terca: {
            cafe_manha: ['Omelete recheado com queijo muçarela e espinafre', 'Chá verde'],
            lanche_manha: ['1/2 abacate amassado com gotas de limão e adoçante eritritol'],
            almoco: ['Contrafilé grelhado na chapa', 'Couve-flor assada com queijo parmesão ralado', 'Salada de tomate'],
            lanche_tarde: ['Mix de castanhas e nozes (30g)'],
            jantar: ['Sobrecoxa de frango assada com pele', 'Couve refogada', 'Abobrinha grelhada']
          },
          quarta: {
            cafe_manha: ['Ovos cozidos salpicados com páprica', 'Café preto sem açúcar'],
            lanche_manha: ['Morangos picados com creme de leite fresco gelado'],
            almoco: ['Atum sólido em óleo (escorrido)', 'Repolho refogado com bacon picado', 'Salada de rúcula'],
            lanche_tarde: ['Queijo minas padrão grelhado (1 fatia)'],
            jantar: ['Sopa cremosa low-carb de chuchu e abobrinha com carne moída']
          },
          quinta: {
            cafe_manha: ['Panqueca low-carb (ovo, farinha de amêndoas e queijo ralado)', 'Chá de hibisco'],
            lanche_manha: ['Nozes (4 unidades)'],
            almoco: ['Peito de frango assado', 'Couve-flor gratinada com creme de leite', 'Salada verde'],
            lanche_tarde: ['Iogurte natural integral sem açúcar'],
            jantar: ['Omelete simples de 2 ovos', 'Tomates cereja grelhados', 'Abacate picado']
          },
          sexta: {
            cafe_manha: ['Ovos mexidos com cubos de bacon artesanal', 'Chá de gengibre'],
            lanche_manha: ['Castanhas do pará (3 unidades)'],
            almoco: ['Costelinha de porco assada no forno', 'Brócolis refogado na manteiga', 'Alface e pepino'],
            lanche_tarde: ['Rolinhos de presunto de peru e queijo prato'],
            jantar: ['Filé de tilápia grelhado', 'Couve refogada no alho e azeite']
          },
          sabado: {
            cafe_manha: ['Ovos cozidos', '1/2 abacate picado'],
            lanche_manha: ['Lascas de coco seco tostadas'],
            almoco: ['Bife de alcatra na chapa', 'Salada de folhas verdes com palmito picado'],
            lanche_tarde: ['Gelatina diet sem açúcar'],
            jantar: ['Frango desfiado cremoso refogado com requeijão e espinafre']
          },
          domingo: {
            cafe_manha: ['Omelete simples de queijo muçarela', 'Chá verde'],
            lanche_manha: ['Morangos inteiros (5 unidades)'],
            almoco: ['Salmão grelhado na manteiga', 'Aspargos grelhados', 'Salada de rúcula'],
            lanche_tarde: ['Mix de sementes tostadas (chia, girassol)'],
            jantar: ['Caldinho de frango desfiado com chuchu picado']
          }
        }
      }
    },
    {
      id: 'template-hospitalar',
      paciente_id: 'temp-3',
      created_at: new Date().toISOString(),
      pacientes: { id: 'temp-3', nome: 'Dietas Hospitalares / Modificadas' },
      titulo: 'Dietas Hospitalares / Modificadas',
      descricao: 'Menu focado em consistência pastosa ou líquida de fácil digestão e deglutição. Ideal para pós-operatórios, disfagia ou restrições mecânicas da mastigação.',
      conteudo: {
        dias: {
          segunda: {
            cafe_manha: ['Mingau de aveia bem cozido e ralo', 'Banana prata amassada com canela', 'Chá de erva-doce morno'],
            lanche_manha: ['Purê de pera cozida ou maçã raspada sem casca'],
            almoco: ['Purê de batata baroa bem liso', 'Frango cozido e desfiado ao molho de tomate (textura úmida e macia)', 'Caldo de feijão carioca coado'],
            lanche_tarde: ['Iogurte natural batido sem pedaços ou flan de baunilha'],
            jantar: ['Sopa creme batida de cenoura, batata e abobrinha com frango desfiado líquido']
          },
          terca: {
            cafe_manha: ['Mingau de amido de milho (maizena)', 'Suco de laranja lima coado'],
            lanche_manha: ['Gelatina de morango gelada'],
            almoco: ['Purê de abóbora cabotiá bem cremoso', 'Patinho moído refogado com molho de tomate abundante (sem grumos)', 'Polenta cremosa rala'],
            lanche_tarde: ['Papinha de maçã cozida'],
            jantar: ['Sopa creme batida de mandioquinha com carne cozida']
          },
          quarta: {
            cafe_manha: ['Iogurte natural desnatado batido com mel', 'Chá de camomila'],
            lanche_manha: ['Purê de pêssego em calda caseiro batido'],
            almoco: ['Purê de batata inglesa com azeite de oliva', 'Filé de peixe cozido desfiado finamente (sem espinhos)', 'Caldinho de feijão preto coado'],
            lanche_tarde: ['Mingau de maizena ralo com canela'],
            jantar: ['Creme de abobrinha com peito de frango cozido e desintegrado']
          },
          quinta: {
            cafe_manha: ['Mingau de aveia batido no liquidificador', 'Suco de melão coado'],
            lanche_manha: ['Flan de leite com calda rala de caramelo'],
            almoco: ['Purê de cenoura cozida e passada na peneira', 'Carne moída úmida no molho de tomate', 'Polenta lisa cremosa'],
            lanche_tarde: ['Iogurte de morango batido homogêneo'],
            jantar: ['Sopa de legumes batida com peito de frango cozido']
          },
          sexta: {
            cafe_manha: ['Mingau de creme de arroz ralo', 'Mamão papaia amassado e coado'],
            lanche_manha: ['Gelatina de abacaxi'],
            almoco: ['Purê de mandioca bem cremoso (sem fibras)', 'Filé de peixe cozido úmido desfiado', 'Caldinho de feijão carioca coado'],
            lanche_tarde: ['Papinha de pera cozida lisa'],
            jantar: ['Sopa cremosa de abóbora cozida com caldo de frango batido']
          },
          sabado: {
            cafe_manha: ['Mingau de aveia ralo', 'Banana amassada e aquecida no microondas'],
            lanche_manha: ['Suco de uva integral coado'],
            almoco: ['Purê de batata baroa cremoso', 'Patinho moído cozido e liquidificado no caldo'],
            lanche_tarde: ['Flan de coco ralo'],
            jantar: ['Sopa creme de mandioquinha batida no caldo de carne']
          },
          domingo: {
            cafe_manha: ['Iogurte batido', 'Chá de ervas morno'],
            lanche_manha: ['Purê de maçã cozida lisa'],
            almoco: ['Polenta bem mole', 'Frango desfiado com molho cremoso', 'Purê de cenoura e chuchu'],
            lanche_tarde: ['Mingau de amido de milho com canela'],
            jantar: ['Sopa de legumes leve bem batida no liquidificador']
          }
        }
      }
    },
    {
      id: 'template-patologias',
      paciente_id: 'temp-4',
      created_at: new Date().toISOString(),
      pacientes: { id: 'temp-4', nome: 'Dietas Baseadas em Patologias' },
      titulo: 'Dietas Baseadas em Patologias',
      descricao: 'Plano com restrição rigorosa de sódio, açúcares simples e gorduras saturadas. Foco em controle glicêmico (Diabetes Mellitus) e regulação de pressão arterial (Hipertensão).',
      conteudo: {
        dias: {
          segunda: {
            cafe_manha: ['1 fatia de pão de forma 100% integral', 'Queijo minas frescal sem sal (1 fatia)', 'Café com leite desnatado sem açúcar'],
            lanche_manha: ['1 laranja lima com bagaço', '4 amêndoas ou castanhas do pará sem sal'],
            almoco: ['Salada de alface e pepino temperada com limão e 1 fio de azeite', 'Arroz integral', 'Filé de frango grelhado com ervas finas'],
            lanche_tarde: ['Iogurte natural desnatado com chia e farelo de aveia'],
            jantar: ['Sopa caseira de legumes com baixo sódio e frango desfiado', 'Salada verde de rúcula']
          },
          terca: {
            cafe_manha: ['Mingau de aveia com leite desnatado e canela', '1/2 banana nanica picada'],
            lanche_manha: ['1 maçã vermelha com casca'],
            almoco: ['Filé de tilápia grelhado', 'Brócolis cozido ao vapor temperado com alho roxo', 'Arroz integral'],
            lanche_tarde: ['Biscoito de arroz integral com creme de ricota light'],
            jantar: ['Omelete de forno com tomate, cebola e manjericão', 'Salada de repolho roxo']
          },
          quarta: {
            cafe_manha: ['Tapioca com chia e 1 ovo mexido', 'Café descafeinado preto'],
            lanche_manha: ['1 fatia fina de melão'],
            almoco: ['Patinho moído refogado com alho', 'Abobrinha grelhada', 'Feijão preto cozido sem embutidos'],
            lanche_tarde: ['Iogurte natural desnatado com sementes de linhaça'],
            jantar: ['Peito de frango grelhado', 'Purê de abóbora', 'Salada de alface']
          },
          quinta: {
            cafe_manha: ['Torradas integrais com creme de ricota sem sal', 'Chá verde morno'],
            lanche_manha: ['Uvas roxas com casca (porção pequena com moderação)'],
            almoco: ['Lombo de peixe assado com azeite e batata doce cozida', 'Salada verde'],
            lanche_tarde: ['Suco verde de couve e limão sem adoçar'],
            jantar: ['Sopa creme de legumes caseira com pouquíssimo sódio']
          },
          sexta: {
            cafe_manha: ['1 fatia de pão integral com 1 ovo mexido sem óleo', 'Café preto'],
            lanche_manha: ['1 pera fresca com casca'],
            almoco: ['Peito de frango cozido', 'Couve refogada no alho', 'Arroz integral'],
            lanche_tarde: ['Mix de castanhas e nozes sem sal (30g)'],
            jantar: ['Omelete de claras com espinafre fresco e queijo ricota']
          },
          sabado: {
            cafe_manha: ['Farelo de aveia com iogurte desnatado', 'Mamão papaia picado'],
            lanche_manha: ['Biscoito de arroz com pasta de amendoim sem açúcar'],
            almoco: ['Atum fresco selado', 'Purê de batata baroa leve', 'Cenoura cozida no vapor'],
            lanche_tarde: ['1 maçã picada com canela em pó'],
            jantar: ['Caldo leve de frango com chuchu e cenoura (baixo sal)']
          },
          domingo: {
            cafe_manha: ['Crepioca de chia com queijo minas frescal sem sal', 'Chá de capim cidreira'],
            lanche_manha: ['Melão picado (1 fatia grande)'],
            almoco: ['Sobrecoxa de frango assada sem pele', 'Arroz integral', 'Salada de rúcula'],
            lanche_tarde: ['Iogurte natural desnatado sem açúcar'],
            jantar: ['Omelete de espinafre, tomate cereja e salsinha']
          }
        }
      }
    },
    {
      id: 'template-flexivel',
      paciente_id: 'temp-5',
      created_at: new Date().toISOString(),
      pacientes: { id: 'temp-5', nome: 'Dietas Flexíveis' },
      titulo: 'Dietas Flexíveis',
      descricao: 'Menu baseado na contagem de macronutrientes (Proteínas, Carboidratos e Gorduras). Permite a substituição livre de alimentos equivalentes, facilitando a adesão social e sustentabilidade do plano.',
      conteudo: {
        dias: {
          segunda: {
            cafe_manha: ['Pão francês (1 unidade) com 2 ovos mexidos e 1 fatia de queijo muçarela', 'Café com leite semi-desnatado', '1 banana prata'],
            lanche_manha: ['Iogurte de morango com aveia em flocos (2 colheres de sopa)'],
            almoco: ['Arroz branco (120g)', 'Feijão carioca (80g)', 'Filé de peito de frango grelhado (150g)', 'Legumes grelhados diversos', 'Opção flexível: 1 quadradinho de chocolate amargo (10g) de sobremesa'],
            lanche_tarde: ['Whey protein concentrado batido com leite desnatado e morangos frescos'],
            jantar: ['Hambúrguer caseiro (pão de hambúrguer, hambúrguer de patinho 150g, queijo prato, alface e tomate)', 'Salada verde de folhas']
          },
          terca: {
            cafe_manha: ['Tapioca com queijo muçarela e peito de peru', 'Suco de laranja natural coado'],
            lanche_manha: ['1 banana com 1 colher de sopa de pasta de amendoim'],
            almoco: ['Macarrão penne ao molho vermelho com patinho moído (150g)', 'Salada completa'],
            lanche_tarde: ['Sanduíche de pão de forma com pasta de atum e requeijão cremoso'],
            jantar: ['Arroz branco cozido', 'Frango assado', 'Purê de batata inglesa cozida', 'Brócolis']
          },
          quarta: {
            cafe_manha: ['Ovos fritos na manteiga (2 unidades) com torrada de pão integral', 'Mamão com aveia'],
            lanche_manha: ['Barra de proteína de qualidade (mínimo 15g de proteína)'],
            almoco: ['Risoto de frango cremoso caseiro', 'Cenoura cozida cortada em rodelas', 'Mix de folhas verdes'],
            lanche_tarde: ['Whey protein batido com 1 banana e cacau em pó (1 colher de chá)'],
            jantar: ['Pizza wrap (rap10 integral com molho de tomate, frango desfiado e queijo muçarela grelhado)']
          },
          quinta: {
            cafe_manha: ['Cuscuz nordestino com queijo coalho e ovo frito', 'Café com leite integral'],
            lanche_manha: ['Iogurte grego natural com 1 colher de mel'],
            almoco: ['Arroz branco', 'Feijão carioca', 'Bife de alcatra grelhado', 'Salada de tomate'],
            lanche_tarde: ['1 banana fatiada com aveia e chocolate amargo picado (10g)'],
            jantar: ['Wrap de frango desfiado com creme de ricota e alface crespa']
          },
          sexta: {
            cafe_manha: ['Crepioca de queijo muçarela', 'Suco de uva integral (sem açúcar)'],
            lanche_manha: ['Mix de castanhas e uvas passas pretas (30g)'],
            almoco: ['Escondidinho de mandioca cozida com carne moída de patinho', 'Espinafre refogado'],
            lanche_tarde: ['Whey protein batido com leite semi-desnatado e cacau em pó'],
            jantar: ['Hambúrguer de frango grelhado no pão integral com salada de rúcula e azeite']
          },
          sabado: {
            cafe_manha: ['Panqueca doce de whey protein com mel e morangos frescos', 'Café preto coado'],
            lanche_manha: ['Castanhas do pará inteiras (4 unidades)'],
            almoco: ['Nhoque de batata ao molho de tomate com carne assada desfiada', 'Salada verde'],
            lanche_tarde: ['Açaí natural com whey protein e granola (sem xarope de guaraná)'],
            jantar: ['Omelete caprese de 2 ovos cozidos com wrap integral']
          },
          domingo: {
            cafe_manha: ['Ovos mexidos com torradas e manteiga ghee', 'Mamão com chia'],
            lanche_manha: ['1 maçã cozida salpicada com canela'],
            almoco: ['Frango grelhado', 'Arroz integral', 'Legumes assados no forno'],
            lanche_tarde: ['Iogurte natural integral com farelo de aveia'],
            jantar: ['Sopa leve de legumes com frango cozido desfiado']
          }
        }
      }
    },
    {
      id: 'template-reeducacao',
      paciente_id: 'temp-6',
      created_at: new Date().toISOString(),
      pacientes: { id: 'temp-6', nome: 'Reeducação Alimentar' },
      titulo: 'Reeducação Alimentar',
      descricao: 'Cardápio focado em comida de verdade, equilíbrio de porções e sustentabilidade a longo prazo. Indicado para readequação de hábitos e perda de peso saudável.',
      conteudo: {
        dias: {
          segunda: {
            cafe_manha: ['1 copo de leite semi-desnatado com café (sem açúcar)', '2 fatias de pão integral com creme de ricota', '1/2 mamão papaia'],
            lanche_manha: ['1 maçã com casca', '2 nozes chilenas'],
            almoco: ['Arroz integral (2 colheres de servir)', 'Feijão carioca (1 concha média)', 'Filé de peito de frango grelhado', 'Salada de alface, cenoura ralada e beterraba cozida'],
            lanche_tarde: ['1 pote de iogurte natural com aveia em flocos e sementes de girassol'],
            jantar: ['Filé de peixe assado no forno', 'Couve-flor e brócolis cozidos ao vapor', 'Salada verde regada com azeite de oliva']
          },
          terca: {
            cafe_manha: ['Tapioca com queijo branco grelhado', 'Suco verde de couve e limão sem adoçar'],
            lanche_manha: ['Pera fresca com sementes de abóbora'],
            almoco: ['Sobrecoxa de frango assada sem pele', 'Abóbora cabotiá cozida', 'Arroz integral', 'Salada'],
            lanche_tarde: ['Salada de frutas caseira com sementes de linhaça dourada'],
            jantar: ['Omelete de 2 ovos com cebola picada, tomate e salsinha', 'Mix de folhas verdes']
          },
          quarta: {
            cafe_manha: ['Ovos mexidos', '1 torrada integral', 'Melão picado'],
            lanche_manha: ['Mix de castanhas e damasco seco (1 unidade)'],
            almoco: ['Patinho moído refogado com alho', 'Abobrinha grelhada', 'Feijão preto cozido'],
            lanche_tarde: ['Iogurte natural integral com morangos frescos picados'],
            jantar: ['Sopa leve de legumes com peito de frango desfiado']
          },
          quinta: {
            cafe_manha: ['Pancake de banana com aveia em flocos finos', 'Chá de hortelã'],
            lanche_manha: ['1 banana-da-terra cozida pequena'],
            almoco: ['Filé de tilápia grelhado', 'Arroz integral', 'Brócolis e cenoura cozidos no vapor'],
            lanche_tarde: ['Coalhada seca com torradas integrais'],
            jantar: ['Salada completa de atum sólido, ovo cozido e folhas verdes regada com azeite']
          },
          sexta: {
            cafe_manha: ['Crepioca de chia e queijo branco grelhado', 'Café com leite semi-desnatado'],
            lanche_manha: ['Uvas frescas com casca (pequeno cacho)'],
            almoco: ['Frango assado com ervas', 'Batata doce grelhada', 'Couve refogada no azeite'],
            lanche_tarde: ['Iogurte natural desnatado com sementes de abóbora'],
            jantar: ['Caldo leve de mandioca cozida com frango desfiado e agrião fresco']
          },
          sabado: {
            cafe_manha: ['Ovos cozidos com orégano', 'Mamão picado com sementes de chia'],
            lanche_manha: ['1 maçã cozida com canela em pó'],
            almoco: ['Carne bovina magra assada no forno', 'Arroz integral', 'Salada de rúcula com tomate cereja'],
            lanche_tarde: ['Abacate batido com limão e leite vegetal'],
            jantar: ['Omelete caprese de forno servido com wrap integral']
          },
          domingo: {
            cafe_manha: ['Ovos mexidos simples na manteiga ghee', 'Chá verde', '1 fatia de melão'],
            lanche_manha: ['Damasco seco (2 unidades) e 3 nozes'],
            almoco: ['Frango grelhado com ervas', 'Legumes assados no forno', 'Arroz integral'],
            lanche_tarde: ['Iogurte natural desnatado com granola integral sem açúcar'],
            jantar: ['Sopa leve de legumes com peito de frango desfiado']
          }
        }
      }
    }
  ]

  const fakePlanos: PlanoAlimentar[] = [
    {
      id: 'fake-pl1',
      paciente_id: 'fake-p1',
      created_at: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
      pacientes: { id: 'fake-p1', nome: 'Maria Silva Oliveira' },
      conteudo: modelosNecessidade[5].conteudo
    },
    {
      id: 'fake-pl2',
      paciente_id: 'fake-p2',
      created_at: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
      pacientes: { id: 'fake-p2', nome: 'João Pedro Santos' },
      conteudo: modelosNecessidade[4].conteudo
    },
    {
      id: 'fake-pl3',
      paciente_id: 'fake-p3',
      created_at: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
      pacientes: { id: 'fake-p3', nome: 'Ana Beatriz Souza' },
      conteudo: modelosNecessidade[3].conteudo
    }
  ]

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchPlanos()
      } else {
        navigate('/login')
      }
    })
  }, [navigate])

  async function fetchPlanos() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('planos_alimentares')
        .select('*, pacientes(id, nome)')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const planosFormatados = (data || []).map((item: any) => ({
        id: item.id,
        paciente_id: item.paciente_id,
        conteudo: item.conteudo,
        created_at: item.created_at,
        pacientes: Array.isArray(item.pacientes) ? item.pacientes[0] : item.pacientes
      }))

      setPlanos(planosFormatados)
    } catch (err) {
      console.error('Erro ao buscar planos alimentares:', err)
    } finally {
      setLoading(false)
    }
  }

  // Mesclar dados do Supabase com os dados fakes
  const getTodosPlanos = () => {
    const reaisComFakes = [...planos]
    fakePlanos.forEach(fp => {
      if (!reaisComFakes.some(rp => rp.id === fp.id)) {
        reaisComFakes.push(fp)
      }
    })
    return reaisComFakes
  }

  const todosPlanos = getTodosPlanos()

  // Filtrar planos por nome do paciente e data de criação
  const planosFiltrados = todosPlanos.filter(plano => {
    const nomePaciente = plano.pacientes?.nome || 'Paciente Desconhecido'
    const matchesSearch = nomePaciente.toLowerCase().includes(searchQuery.toLowerCase())
    
    let matchesDate = true
    if (filterDate) {
      const planoDataStr = plano.created_at.split('T')[0]
      matchesDate = planoDataStr === filterDate
    }

    return matchesSearch && matchesDate
  })

  // --- RENDERIZAR DETALHE DO PLANO ALIMENTAR (MODAL) ---
  const renderPlanoConteudoFormatado = (conteudo: any) => {
    if (!conteudo) return <p>Nenhum conteúdo no plano alimentar.</p>

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

  return (
    <div className="animate-fade-in">
      {/* Cabeçalho da Listagem */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--primary)', margin: 0 }}>
            Planos Alimentares
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Consulte, busque e filtre o histórico global de dietas e planos alimentares dos seus clientes.
          </p>
        </div>
      </div>

      {/* Seletor de Abas Principais (Por Paciente vs Por Necessidade) */}
      <div className="form-tabs" style={{ marginBottom: '24px', borderBottom: '2px solid var(--border-color)' }}>
        <button
          type="button"
          className={`tab-navegacao-btn ${activeTab === 'por_paciente' ? 'active' : ''}`}
          onClick={() => setActiveTab('por_paciente')}
          style={{ padding: '14px 24px', fontSize: '1rem', fontWeight: 'bold' }}
        >
          Planos por Paciente
        </button>
        <button
          type="button"
          className={`tab-navegacao-btn ${activeTab === 'por_necessidade' ? 'active' : ''}`}
          onClick={() => setActiveTab('por_necessidade')}
          style={{ padding: '14px 24px', fontSize: '1rem', fontWeight: 'bold' }}
        >
          Planos por Necessidade (Modelos)
        </button>
      </div>

      {/* ABA 1: PLANOS POR PACIENTE */}
      {activeTab === 'por_paciente' && (
        <>
          {/* Seção de Filtros */}
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              
              {/* Busca por Nome */}
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
                  placeholder="Buscar por nome do cliente..." 
                  style={{ 
                    paddingLeft: '48px', 
                    fontSize: '0.95rem', 
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    width: '100%',
                    backgroundColor: '#fff'
                  }}
                />
              </div>

              {/* Filtro por Data */}
              <div className="form-group" style={{ margin: 0 }}>
                <input 
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  style={{
                    fontSize: '0.95rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#fff'
                  }}
                  title="Filtrar por data de criação"
                />
              </div>

              {/* Limpar Filtros */}
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setSearchQuery('')
                  setFilterDate('')
                }}
                style={{ width: '100%', padding: '12px', fontSize: '0.9rem', borderRadius: '12px' }}
                title="Limpar Filtros"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Grid de Planos */}
          {loading && planos.length === 0 ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Carregando planos alimentares...</p>
            </div>
          ) : planosFiltrados.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontWeight: '600' }}>Nenhum plano alimentar encontrado</p>
              <p>Não encontramos registros correspondentes aos filtros aplicados.</p>
            </div>
          ) : (
            <div className="planos-list-grid">
              {planosFiltrados.map((plano) => (
                <div key={plano.id} className="plano-card-item">
                  <div className="plano-card-header">
                    <div className="plano-icon-badge">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    </div>
                    <div>
                      <span 
                        className="plano-titulo" 
                        onClick={() => plano.pacientes && navigate(`/pacientes/${plano.pacientes.id}`)}
                        style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                      >
                        Plano Alimentar - {plano.pacientes?.nome || 'Paciente Desconhecido'}
                      </span>
                      <span className="plano-data">
                        Criado em {new Date(plano.created_at).toLocaleDateString('pt-BR')} às {new Date(plano.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => {
                        setPlanoVisualizarDiaAtivo('segunda')
                        setSelectedPlano(plano)
                      }}
                      style={{ flex: 1, padding: '10px 12px', fontSize: '0.85rem' }}
                    >
                      Visualizar Cardápio
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => plano.pacientes && navigate(`/pacientes/${plano.pacientes.id}`)}
                      style={{ flex: 1, padding: '10px 12px', fontSize: '0.85rem' }}
                    >
                      Ver Perfil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ABA 2: PLANOS POR NECESSIDADE (MODELOS) */}
      {activeTab === 'por_necessidade' && (
        <div className="planos-list-grid" style={{ marginTop: '8px' }}>
          {modelosNecessidade.map((modelo) => (
            <div key={modelo.id} className="plano-card-item" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="plano-card-header" style={{ marginBottom: '14px' }}>
                  <div className="plano-icon-badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="plano-titulo" style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>
                      {modelo.titulo}
                    </span>
                    <span className="plano-data">Modelo de Referência Clínica</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                  {modelo.descricao}
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setPlanoVisualizarDiaAtivo('segunda')
                  setSelectedPlano(modelo)
                }}
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
              >
                Visualizar Modelo Completo
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL DE VISUALIZAÇÃO DE PLANO --- */}
      {selectedPlano && (
        <div className="modal-overlay">
          <div className="modal-card modal-large animate-scale-in">
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>
                  {selectedPlano.id.startsWith('template') 
                    ? `Modelo: ${selectedPlano.pacientes?.nome}` 
                    : `Plano Alimentar de ${selectedPlano.pacientes?.nome || 'Paciente'}`}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  {selectedPlano.id.startsWith('template') 
                    ? 'Cardápio modelo para apoio à conduta clínica' 
                    : `Criado em ${new Date(selectedPlano.created_at).toLocaleDateString('pt-BR')} às ${new Date(selectedPlano.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
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
