import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topicDescription } = await req.json();

    if (!topicDescription) {
      return NextResponse.json(
        { error: 'topicDescription is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is missing in environment variables' },
        { status: 500 }
      );
    }

    const systemInstruction = `You are an expert academic researcher. 
Based on the user's natural language research topic description, generate exactly 10 highly optimized, professional English academic keywords for searching academic papers (e.g. arXiv, Semantic Scholar). 
Return ONLY a valid JSON array of 10 string items, and absolutely no markdown or surrounding text.`;

    const payload = {
      contents: [{ parts: [{ text: `Input: ${topicDescription}` }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Gemini API error: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      return NextResponse.json(
        { error: 'Failed to generate keywords from AI response' },
        { status: 500 }
      );
    }

    const keywords = JSON.parse(resultText);
    return NextResponse.json({ keywords });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
