/**
 * Logo Iteration Generator
 *
 * Takes a chosen direction and generates targeted variations:
 * - Simplified (favicon-ready, 32px legible)
 * - Medium (social card, app icon, 128-512px)
 * - Full detail (merch, print, DTF)
 * - Dark background variant
 * - Light background variant
 */

import fs from 'node:fs';
import path from 'node:path';
import { nonClobberingPath, slug } from './paths.js';

export interface LogoIterationOptions {
  /** Direction description — what to iterate on */
  direction: string;
  /** Brand name */
  name: string;
  /** Creative base prompt from brand kit */
  basePrompt?: string;
  /** Things to avoid */
  avoid?: string[];
  /**
   * The brand's own accent color, `#rrggbb`. Required for the on-black and
   * on-white variants — those constrain the palette, and hardcoding one
   * brand's accent here injected it into every other brand's iterations.
   */
  accentHex: string;
  /** Human-readable accent name for the prompt, e.g. "Flickday Yellow" */
  accentName?: string;
  /** Output directory */
  outputDir?: string;
  /** Model */
  model?: string;
  /** The idea being expressed, from the kit's conceptual anchor */
  anchor?: string;
  /**
   * Recorded rejections in scope for this gate.
   *
   * Iteration is where they matter most: this is the path that takes an
   * existing artifact and refines it, so without them a variant round will
   * happily polish a direction that was already killed.
   */
  rejected?: string[];
  /**
   * Path to the candidate's rendered artifact. Sent to the model alongside
   * the prompt.
   *
   * Without it this command was regeneration from a text description
   * wearing the word "iteration" — the model never saw the mark, so
   * geometry, proportion and weight drifted on every variant while the
   * output claimed to be variants OF something.
   */
  sourceImagePath?: string;
}

export interface LogoVariation {
  path: string;
  variant: string;
  prompt: string;
}

function accentLabel(options: LogoIterationOptions): string {
  return options.accentName
    ? `${options.accentName} (${options.accentHex})`
    : options.accentHex;
}

const VARIANTS: Array<{
  id: string;
  instruction: string | ((o: LogoIterationOptions) => string);
}> = [
  {
    id: 'simplified',
    instruction: 'EXTREME SIMPLIFICATION for favicon/app icon use. Must be recognizable at 32x32 pixels. Maximum 2-3 shapes. No fine detail. Bold, clean, iconic. Single color on transparent background.',
  },
  {
    id: 'standard',
    instruction: 'Standard mark for social cards, headers, and medium-size use (128-512px). Clean vector quality. Solid shapes, consistent stroke weight. On transparent or black background.',
  },
  {
    id: 'detailed',
    instruction: 'Full detail version for merch, print, and large format. Can include finer lines, texture hints, and secondary elements. Still clean enough for DTF printing. On transparent background.',
  },
  {
    id: 'on-black',
    instruction: (o) =>
      `Optimized for dark backgrounds. Use ${accentLabel(o)} and white (#ffffff) only. Bold contrast. No background fill — mark floats on transparency for compositing onto dark surfaces.`,
  },
  {
    id: 'on-white',
    instruction: (o) =>
      `Optimized for light backgrounds. Use black (#000000) and ${accentLabel(o)} only. Clean contrast. No background fill — mark floats on transparency for compositing onto light surfaces.`,
  },
];

/** Exposed so the recorded state reaching the prompt can be asserted directly. */
export function buildIterationPrompt(
  options: LogoIterationOptions,
  variantId: string,
): string {
  const variant = VARIANTS.find((v) => v.id === variantId);
  if (!variant) throw new Error(`Unknown variant: ${variantId}`);
  const instruction =
    typeof variant.instruction === 'function'
      ? variant.instruction(options)
      : variant.instruction;

  return `${options.basePrompt || ''}
${options.anchor ? `\nCONCEPTUAL ANCHOR — the idea this expresses:\n${options.anchor}\n` : ''}${
    options.sourceImagePath
      ? '\nThe attached image IS the mark. Preserve its geometry, proportion and stroke weight — you are producing a variant of it, not a new interpretation of the description below.\n'
      : ''
  }
LOGO DIRECTION TO ITERATE ON:
${options.direction}

VARIANT: ${instruction}

BRAND: ${options.name}

CRITICAL:
- NO text, words, letters, or typography
- Generate ONLY the graphic mark / symbol
- Clean vector-quality edges
${options.avoid?.length ? `\nAVOID:\n${options.avoid.map((a) => `- ${a}`).join('\n')}` : ''}
${
  options.rejected?.length
    ? `\nALREADY REJECTED — refining toward any of these is wasted work:\n${options.rejected.map((r) => `- ${r}`).join('\n')}`
    : ''
}`;
}

export const VARIANT_IDS = VARIANTS.map((v) => v.id);

export async function iterateLogoConcept(
  options: LogoIterationOptions,
): Promise<LogoVariation[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY required');

  const model = options.model || 'google/gemini-2.5-flash-image';
  const outputDir = path.resolve(options.outputDir || './output/logo-iterations');
  fs.mkdirSync(outputDir, { recursive: true });

  const results: LogoVariation[] = [];

  // Read once, not per variant.
  const sourceImage = options.sourceImagePath
    ? encodeImage(options.sourceImagePath)
    : null;

  for (const variant of VARIANTS) {
    const prompt = buildIterationPrompt(options, variant.id);
    const content = sourceImage
      ? [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: sourceImage } },
        ]
      : prompt;

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
        messages: [{ role: 'user', content }],
      }),
    });

    if (!response.ok) {
      console.error(`${variant.id}: API error ${response.status}`);
      continue;
    }

    const data = await response.json() as any;
    const message = data.choices?.[0]?.message;
    const buffer = extractImage(message);

    if (!buffer) {
      console.error(`${variant.id}: no image in response`);
      continue;
    }

    const filePath = nonClobberingPath(outputDir, `${slug(options.name)}-${variant.id}`);
    fs.writeFileSync(filePath, buffer);
    results.push({ path: filePath, variant: variant.id, prompt });
  }

  return results;
}

function extractImage(message: any): Buffer | null {
  if (!message) return null;
  if (message.images?.length > 0) {
    const img = message.images[0];
    if (img?.image_url?.url) return decode(img.image_url.url);
    if (typeof img === 'string') return decode(img);
    if (img?.url) return decode(img.url);
    if (img?.b64_json) return Buffer.from(img.b64_json, 'base64');
  }
  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (part.type === 'image_url' && part.image_url?.url) return decode(part.image_url.url);
      if (part.inline_data?.data) return Buffer.from(part.inline_data.data, 'base64');
    }
  }
  return null;
}

function decode(url: string): Buffer {
  return Buffer.from(url.replace(/^data:image\/\w+;base64,/, ''), 'base64');
}

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

/** Read a local artifact as a data URL for the model to condition on. */
export function encodeImage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext];
  if (!mime) {
    throw new Error(
      `Cannot send ${ext || 'a file with no extension'} to the model. Supported: ${Object.keys(MIME).join(', ')}`,
    );
  }
  return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
}
