import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EXAMPLE_THEMES = [
  "Desafios para a valorização de comunidades e povos tradicionais no Brasil",
  "Invisibilidade e registro civil: garantindo o acesso à cidadania no Brasil",
  "O estigma associado às doenças mentais na sociedade brasileira",
  "Democratização do acesso ao cinema no Brasil",
  "Manipulação do comportamento do usuário pelo controle de dados na internet",
  "Desafios para o desenvolvimento educacional de surdos no Brasil",
  "Caminhos para combater a intolerância religiosa no Brasil",
  "Formas de combate ao racismo no Brasil",
  "A persistência da violência contra a mulher na sociedade brasileira",
  "Publicidade infantil em questão no Brasil",
  "Efeitos da implantação da Lei Seca no Brasil"
];

export async function GET() {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Você é um especialista em criar temas para redações do ENEM. 
          Gere um tema atual e relevante, seguindo o padrão dos temas anteriores do ENEM.
          Os temas devem ser concisos e abordar questões sociais relevantes no Brasil.
          
          Exemplos de temas anteriores:
          ${EXAMPLE_THEMES.join("\n")}`
        },
        {
          role: "user",
          content: `Gere um tema de redação no estilo ENEM, seguindo estas regras:
          1. Deve ser uma única frase concisa
          2. Deve abordar um problema social relevante no Brasil
          3. Deve seguir o padrão dos exemplos fornecidos
          4. Deve ser atual e provocar reflexão
          
          Retorne apenas o JSON com:
          {
            "título": "o tema em uma única frase",
            "textoMotivador": [
              "Texto 1: Um parágrafo com dados estatísticos relevantes sobre o tema",
              "Texto 2: Um parágrafo com contexto histórico ou social do problema",
              "Texto 3: Um parágrafo com perspectivas ou iniciativas relacionadas"
            ]
          }`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const theme = JSON.parse(completion.choices[0].message.content);
    return NextResponse.json(theme);
  } catch (error) {
    console.error('Erro ao gerar tema:', error);
    return NextResponse.json(
      { error: 'Falha ao gerar tema' },
      { status: 500 }
    );
  }
} 