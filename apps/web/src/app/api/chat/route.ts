import { NextRequest, NextResponse } from 'next/server';
import { createRouter, ProviderName } from '@codestrike/ai';

export async function POST(req: NextRequest) {
  try {
    const { messages, model, provider, useMcp } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const router = createRouter({
      primaryProvider: (provider as ProviderName) || 'openrouter',
    });

    const mappedMessages = messages.map((m: { role: string; content: string; toolCallId?: string }) => ({
      role: m.role as 'system' | 'user' | 'assistant' | 'tool',
      content: m.content,
      ...(m.toolCallId ? { toolCallId: m.toolCallId } : {}),
    }));

    const selectedModel = model || 'mistralai/mixtral-8x7b-instruct';

    const streamGen = useMcp
      ? router.streamWithTools({
          messages: mappedMessages,
          model: selectedModel,
          provider: (provider as ProviderName) || 'openrouter',
          stream: true,
          useMcp: true,
        })
      : router.stream({
          messages: mappedMessages,
          model: selectedModel,
          provider: (provider as ProviderName) || 'openrouter',
          stream: true,
        });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamGen) {
            const payload: Record<string, unknown> = {};
            if (chunk.content) payload.content = chunk.content;
            if (chunk.done) payload.done = true;
            if (chunk.toolCalls) payload.toolCalls = chunk.toolCalls;
            if (chunk.model) payload.model = chunk.model;
            controller.enqueue(encoder.encode(JSON.stringify(payload) + '\n'));
          }
        } catch (error) {
          controller.enqueue(encoder.encode(JSON.stringify({
            content: `Error: ${error instanceof Error ? error.message : 'Unable to get AI response. Check your API keys.'}`,
            done: true,
          }) + '\n'));
          controller.close();
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 },
    );
  }
}
