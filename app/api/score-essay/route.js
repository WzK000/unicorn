import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Initialize OpenAI with configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only if needed for development
});

export async function POST(req) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const { essay, theme } = await req.json();

    if (!essay || !theme) {
      return NextResponse.json(
        { error: 'Redação e tema são obrigatórios' },
        { status: 400 }
      );
    }

    const prompt = `
      Você é um avaliador especialista do ENEM. Avalie a seguinte redação de acordo com as 5 competências do ENEM.
      
      Tema: "${theme.título}"
      
      Redação:
      "${essay}"
      
      Avalie detalhadamente cada competência e forneça uma nota de 0 a 200 para cada uma, considerando:
      
      Competência 1: Domínio da norma culta da língua escrita
      Competência 2: Compreensão da proposta e desenvolvimento do tema
      Competência 3: Capacidade de organizar e relacionar informações e argumentos
      Competência 4: Mecanismos linguísticos necessários para a construção da argumentação
      Competência 5: Proposta de intervenção para o problema abordado
      
      Forneça também:
      - Pontos positivos específicos da redação
      - Pontos a melhorar com sugestões práticas
      - Análise da aderência ao tema
      - Contagem de palavras e parágrafos
      
      Responda em formato JSON com a seguinte estrutura:
      {
        "competenciaScores": {
          "comp1": number,
          "comp2": number,
          "comp3": number,
          "comp4": number,
          "comp5": number
        },
        "suggestions": {
          "comp1": "string",
          "comp2": "string",
          "comp3": "string",
          "comp4": "string",
          "comp5": "string"
        },
        "pontosPositivos": ["string"],
        "pontosAMelhorar": ["string"],
        "aderenciaAoTema": "string",
        "wordCount": number,
        "paragraphCount": number
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Você é um avaliador especializado em redações do ENEM, com profundo conhecimento dos critérios de avaliação."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo", // Using 3.5-turbo for better cost-effectiveness
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content);

    // Validate and normalize scores
    const normalizedScores = Object.entries(result.competenciaScores).reduce((acc, [comp, score]) => ({
      ...acc,
      [comp]: Math.min(Math.max(0, Math.round(score)), 200) // Ensure scores are between 0 and 200
    }), {});

    // Calculate total score
    const totalScore = Object.values(normalizedScores).reduce((sum, score) => sum + score, 0);

    return NextResponse.json({
      score: totalScore,
      feedback: {
        ...result,
        competenciaScores: normalizedScores
      }
    });

  } catch (error) {
    console.error('Erro ao avaliar redação:', error);
    return NextResponse.json(
      { error: 'Falha ao avaliar redação. Por favor, tente novamente.' },
      { status: 500 }
    );
  }
} 