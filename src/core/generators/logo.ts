/**
 * Logo Concept Generator
 *
 * Generates logo concepts using AI image models via OpenRouter.
 * Uses the brand kit's creative context (basePrompt, avoid) as constraints.
 * Saves outputs to disk. Human approval required before adding to kit.
 */

import fs from 'node:fs';
import path from 'node:path';
import { nonClobberingPath, slug } from './paths.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LogoGeneratorOptions {
  /** Brand name */
  name: string;
  /** Brand personality traits */
  personality: string[];
  /** Creative base prompt from brand kit */
  basePrompt?: string;
  /** Things to avoid in generation */
  avoid?: string[];
  /** Visual keywords */
  visualKeywords?: string[];
  /** Number of concepts to generate */
  count?: number;
  /** Output directory */
  outputDir?: string;
  /** Image model to use (OpenRouter model ID) */
  model?: string;
  /**
   * Recorded creative state for the gate being generated at, from
   * `checkGenerationReadiness`. Without it a generator has no idea which
   * directions were already rejected and will happily re-propose them.
   */
  anchor?: string;
  /** Recorded rejections in scope for this gate */
  rejected?: string[];
  /** Evaluation criteria in scope for this gate */
  criteria?: string[];
}

export interface LogoConcept {
  /** Path to saved image file */
  path: string;
  /** The prompt used to generate this concept */
  prompt: string;
  /** Model used */
  model: string;
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

export function buildLogoPrompt(options: LogoGeneratorOptions, variation: number): string {
  const { name, personality, basePrompt, avoid, visualKeywords } = options;

  const variationHints = [
    'minimal geometric mark — simple shapes, one or two colors, works at any size',
    'wordmark with custom letterforms — the brand name styled as the logo itself',
    'icon + wordmark lockup — a distinct symbol paired with the brand name',
    'abstract mark — non-literal, captures the brand feeling through shape and movement',
    'monogram — first letter or initials of the brand, stylized as a mark',
  ];

  const hint = variationHints[variation % variationHints.length];

  let prompt = '';

  if (basePrompt) {
    prompt += `${basePrompt}\n\n`;
  }

  prompt += `Generate a logo concept for "${name}".
${options.anchor ? `\nCONCEPTUAL ANCHOR — everything must express this idea, not a set of props:\n${options.anchor}\n` : ''}
DIRECTION: ${hint}

BRAND PERSONALITY: ${personality.join(', ')}
${visualKeywords?.length ? `VISUAL KEYWORDS: ${visualKeywords.join(', ')}` : ''}
${
  options.criteria?.length
    ? `\nJUDGED AGAINST:\n${options.criteria.map((c) => `- ${c}`).join('\n')}`
    : ''
}
${
  options.rejected?.length
    ? `\nALREADY REJECTED — do not re-propose any of these:\n${options.rejected.map((r) => `- ${r}`).join('\n')}`
    : ''
}

REQUIREMENTS:
- Clean, professional logo design
- Must work on both light and dark backgrounds
- Must be recognizable at small sizes (32px favicon)
- Vector-quality: clean edges, solid shapes, no gradients unless intentional
- NO photographic elements — this is a logo, not an illustration

CRITICAL:
- NO text, words, letters, or typography in the image
- Generate ONLY the graphic mark / symbol / icon
- Typography will be composited separately
- Output on a transparent or solid neutral background
${avoid?.length ? `\nAVOID:\n${avoid.map((a) => `- ${a}`).join('\n')}` : ''}`;

  return prompt;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/**
 * Generate logo concepts via OpenRouter image models.
 * Requires OPENROUTER_API_KEY in environment.
 */
export async function generateLogos(
  options: LogoGeneratorOptions,
): Promise<LogoConcept[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY required for logo generation');
  }

  const count = options.count || 3;
  const model = options.model || 'google/gemini-2.5-flash-image';
  const outputDir = path.resolve(options.outputDir || './output/logos');
  fs.mkdirSync(outputDir, { recursive: true });

  const concepts: LogoConcept[] = [];

  for (let i = 0; i < count; i++) {
    const prompt = buildLogoPrompt(options, i);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/nino-chavez/brand-forge',
        'X-Title': 'brand-forge',
      },
      body: JSON.stringify({
        model,
        modalities: ['text', 'image'],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter error (${response.status}): ${err}`);
    }

    const data = await response.json() as any;
    const message = data.choices?.[0]?.message;

    // Extract image from response (same patterns as image-gen)
    const imageBuffer = extractImage(message);
    if (!imageBuffer) {
      console.error(`Concept ${i + 1}: no image in response — skipping`);
      continue;
    }

    const filePath = nonClobberingPath(outputDir, `${slug(options.name)}-concept-${i + 1}`);
    fs.writeFileSync(filePath, imageBuffer);

    concepts.push({ path: filePath, prompt, model });
  }

  return concepts;
}

// ---------------------------------------------------------------------------
// Image Extraction (adapted from image-gen)
// ---------------------------------------------------------------------------

function extractImage(message: any): Buffer | null {
  if (!message) return null;

  // Format 1: message.images array
  if (message.images && Array.isArray(message.images) && message.images.length > 0) {
    const img = message.images[0];
    if (img?.image_url?.url) return decodeBase64Url(img.image_url.url);
    if (typeof img === 'string') return decodeBase64Url(img);
    if (img?.url) return decodeBase64Url(img.url);
    if (img?.b64_json) return Buffer.from(img.b64_json, 'base64');
  }

  // Format 2: message.content array with image parts
  if (message.content && Array.isArray(message.content)) {
    for (const part of message.content) {
      if (part.type === 'image_url' && part.image_url?.url) {
        return decodeBase64Url(part.image_url.url);
      }
      if (part.inline_data?.data) {
        return Buffer.from(part.inline_data.data, 'base64');
      }
    }
  }

  return null;
}

function decodeBase64Url(url: string): Buffer {
  const base64 = url.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64, 'base64');
}
