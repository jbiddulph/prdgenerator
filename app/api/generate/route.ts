import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.prdIdeas) {
      // Generate 20 PRD template ideas
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that generates creative app or tool ideas for product requirements documents.'
          },
          {
            role: 'user',
            content:
              'Generate 20 creative, short app or tool ideas suitable for a product requirements document. Return them as a plain numbered or bulleted list, one idea per line.'
          }
        ],
        max_tokens: 256,
      });
      const text = completion.choices[0]?.message?.content || '';
      // Parse the response into an array of ideas
      const ideas = text
        .split(/\n|\r/)
        .map(line => line.replace(/^\d+\.|^[-*]\s*/, '').trim())
        .filter(Boolean);
      return NextResponse.json({ ideas });
    }
    // Default: original prompt-based completion
    const { prompt } = body;
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that writes product requirements documents.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
    });
    const result = completion.choices[0]?.message?.content || '';
    return NextResponse.json({ result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 