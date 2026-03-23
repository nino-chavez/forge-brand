/**
 * AI Provider — Gateway Only
 *
 * All AI calls go through the Vercel AI Gateway with OIDC auth.
 * Run `vercel link` + `vercel env pull` to provision credentials.
 * No direct provider SDKs (@anthropic-ai/sdk, @ai-sdk/openai, etc.).
 */

/**
 * Call an LLM via AI Gateway. Requires `ai` package and OIDC credentials.
 */
export async function callModel(prompt: string): Promise<string> {
  const { generateText } = await import('ai');
  const result = await generateText({
    model: 'anthropic/claude-sonnet-4.6',
    prompt,
  });
  return result.text;
}
