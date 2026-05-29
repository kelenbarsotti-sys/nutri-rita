import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    return;
  }

  const apiKey = process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Chave de API do Google Gemini não configurada no servidor.' });
    return;
  }

  try {
    const { dados_do_paciente } = req.body;

    if (!dados_do_paciente) {
      res.status(400).json({ error: 'Dados do paciente são obrigatórios.' });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            plano_semanal: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  dia: { type: SchemaType.STRING },
                  refeicoes: {
                    type: SchemaType.OBJECT,
                    properties: {
                      cafe_da_manha: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                      lanche_manha: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                      almoco: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                      lanche_tarde: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                      jantar: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                    },
                    required: ["cafe_da_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar"]
                  }
                },
                required: ["dia", "refeicoes"]
              }
            }
          },
          required: ["plano_semanal"]
        }
      }
    });

    const prompt = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${typeof dados_do_paciente === 'string' ? dados_do_paciente : JSON.stringify(dados_do_paciente, null, 2)}

⚠️ Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let jsonPlan;
    try {
      jsonPlan = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erro ao analisar resposta JSON do Gemini:", responseText);
      res.status(500).json({ error: 'A IA gerou um formato de plano inválido. Por favor, tente novamente.' });
      return;
    }

    res.status(200).json(jsonPlan);
  } catch (err: any) {
    console.error('Erro na geração do plano alimentar:', err);
    res.status(500).json({ error: err.message || 'Erro interno ao gerar o plano com IA.' });
  }
}
