/**
 * AI Provider
 *
 * Routes LLM calls through OpenRouter (consistent with image-gen).
 * Falls back to direct Anthropic SDK if ANTHROPIC_API_KEY is set.
 * AI Gateway/OIDC is available as a third option for Vercel-deployed apps.
 *
 * Priority: OPENROUTER_API_KEY → ANTHROPIC_API_KEY → VERCEL_OIDC_TOKEN
 */

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4';

/**
 * Call an LLM. Uses OpenRouter by default (same as image-gen).
 */
export async function callModel(prompt: string, model?: string): Promise<string> {
  const selectedModel = model || DEFAULT_MODEL;

  // 1. OpenRouter (preferred — consistent with image-gen)
  if (process.env.OPENROUTER_API_KEY) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/nino-chavez/brand-forge',
        'X-Title': 'brand-forge',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter error (${response.status}): ${err}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0].message.content;
  }

  // 2. Direct Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic error (${response.status}): ${err}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };
    const textBlock = data.content.find((b) => b.type === 'text');
    if (!textBlock) throw new Error('No text in Anthropic response');
    return textBlock.text;
  }

  // 3. AI Gateway (for Vercel-deployed apps — requires `ai` package installed separately)
  if (process.env.VERCEL_OIDC_TOKEN) {
    try {
      // Dynamic import — ai package is optional, not in dependencies
      const aiModule = await (Function('return import("ai")')() as Promise<any>);
      const result = await aiModule.generateText({
        model: selectedModel,
        prompt,
      });
      return result.text;
    } catch {
      throw new Error(
        'VERCEL_OIDC_TOKEN is set but the `ai` package is not installed.\n' +
        'Run: npm install ai   — or use OPENROUTER_API_KEY instead.',
      );
    }
  }

  throw new Error(
    'No AI provider configured. Set one of:\n' +
    '  OPENROUTER_API_KEY  (recommended — consistent with image-gen)\n' +
    '  ANTHROPIC_API_KEY   (direct Anthropic access)\n' +
    '  VERCEL_OIDC_TOKEN   (run vercel link + vercel env pull)',
  );
}
