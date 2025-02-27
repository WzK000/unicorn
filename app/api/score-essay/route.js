import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { competencias } from '@/utils/evaluationCriteria';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generatePrompt(competencias, essay, theme) {
  const criteriaList = competencias
    .map(comp => `
Competência ${comp.numero}: ${comp.descricao}
Critérios de avaliação:
${comp.criterios
  .map(criterio => `- ${criterio.pontuacao} pontos: ${criterio.descricao}`)
  .join('\n')}
`).join('\n');

  return `
Você é um avaliador especializado em redações do ENEM. Analise a redação considerando o tema proposto:

TEMA:
${theme.título}

TEXTO MOTIVADOR:
${theme.textoMotivador.join('\n\n')}

INSTRUÇÕES:
${theme.instrucoes}

CRITÉRIOS DE AVALIAÇÃO:
${criteriaList}

Forneça:
1. Uma nota para cada competência (conforme os critérios acima)
2. Feedback detalhado incluindo:
   - Contagem de palavras
   - Contagem de parágrafos
   - Sugestões específicas para melhorar em cada competência
   - Principais pontos positivos
   - Principais pontos a melhorar
   - Aderência ao tema proposto

REDAÇÃO A SER AVALIADA:
${essay}

Retorne a avaliação no seguinte formato JSON:
{
  "score": number (soma total das notas),
  "feedback": {
    "wordCount": number,
    "paragraphCount": number,
    "competenciaScores": {
      "comp1": number,
      "comp2": number,
      "comp3": number,
      "comp4": number,
      "comp5": number
    },
    "suggestions": {
      "comp1": string,
      "comp2": string,
      "comp3": string,
      "comp4": string,
      "comp5": string
    },
    "pontosPositivos": string[],
    "pontosAMelhorar": string[],
    "aderenciaAoTema": string
  }
}`;
}

export async function POST(request) {
  try {
    const { essay, theme } = await request.json();

    if (!theme) {
      return NextResponse.json(
        { error: 'É necessário gerar um tema antes de avaliar a redação' },
        { status: 400 }
      );
    }

    if (!essay || essay.trim().length < 50) {
      return NextResponse.json(
        { error: 'A redação deve ter no mínimo 50 caracteres' },
        { status: 400 }
      );
    }

    const prompt = await generatePrompt(competencias, essay, theme);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Você é um avaliador especializado em redações do ENEM, com profundo conhecimento dos critérios de avaliação."
        },
        {
          role: "user",
          content: prompt + "\n\nRedação para avaliar:\n" + essay
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);

    if (!aiResponse.score || !aiResponse.feedback) {
      throw new Error('Formato de resposta inválido');
    }

    return NextResponse.json(aiResponse);

  } catch (error) {
    console.error('Erro ao avaliar redação:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao avaliar redação' },
      { status: 500 }
    );
  }
} 