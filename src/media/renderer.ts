/**
 * Media Renderer
 *
 * Satori (JSX → SVG) + Resvg (SVG → PNG/PDF) pipeline.
 * All templates receive the full BrandKit + template-specific data.
 * Templates are pure functions — deterministic, no AI.
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import type { BrandKit } from '../core/schema/brand-kit.js';
import type { FontStack } from '../core/schema/typography.js';

// ---------------------------------------------------------------------------
// Font Cache
// ---------------------------------------------------------------------------

/** Cache fetched font buffers by "family:weight" key to avoid re-downloading */
const fontCache = new Map<string, Buffer>();

/**
 * Fetch a single font weight from Google Fonts as TTF.
 * Satori requires TTF/OTF — woff2 is not supported.
 */
async function fetchGoogleFont(family: string, weight: number): Promise<Buffer> {
  const cacheKey = `${family}:${weight}`;
  const cached = fontCache.get(cacheKey);
  if (cached) return cached;

  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`;
  // User-agent that returns TTF (not woff2)
  const cssResp = await fetch(cssUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; brand-forge/0.1)' },
  });
  const css = await cssResp.text();
  const match = css.match(/src:\s*url\(([^)]+)\)/);
  if (!match) throw new Error(`No font URL found for ${family} @ ${weight}`);

  const fontResp = await fetch(match[1]);
  const buffer = Buffer.from(await fontResp.arrayBuffer());
  fontCache.set(cacheKey, buffer);
  return buffer;
}

// ---------------------------------------------------------------------------
// Font Loading — Per-Kit
// ---------------------------------------------------------------------------

interface SatoriFont {
  name: string;
  data: Buffer;
  weight: number;
  style: 'normal';
}

/**
 * Load the actual fonts defined in the brand kit.
 * For each font stack (display, body, mono):
 * - If it has a googleFonts ID, fetch the specific weights from Google Fonts.
 * - If not on Google Fonts (e.g. Adobe Typekit), fall back to Inter for that slot.
 *
 * This means Bebas Neue, Playfair Display, Space Grotesk etc. render correctly
 * instead of everything falling back to Inter.
 */
async function loadFonts(kit: BrandKit): Promise<SatoriFont[]> {
  const fonts: SatoriFont[] = [];
  const stacks: Array<{ role: string; stack: FontStack }> = [
    { role: 'display', stack: kit.typography.display },
    { role: 'body', stack: kit.typography.body },
    { role: 'mono', stack: kit.typography.mono },
  ];

  // Pre-fetch Inter as the universal fallback
  let interRegular: Buffer | null = null;
  let interBold: Buffer | null = null;

  async function getInterFallback(weight: number): Promise<Buffer> {
    if (weight >= 600) {
      if (!interBold) interBold = await fetchGoogleFont('Inter', 700);
      return interBold;
    }
    if (!interRegular) interRegular = await fetchGoogleFont('Inter', 400);
    return interRegular;
  }

  async function fetchGoogleFontSafe(
    googleFonts: string,
    weight: number,
    fallback: (w: number) => Promise<Buffer>,
  ): Promise<Buffer> {
    const familyName = googleFonts.split(':')[0].replace(/\+/g, ' ');
    try {
      return await fetchGoogleFont(familyName, weight);
    } catch {
      return fallback(weight);
    }
  }

  for (const { stack } of stacks) {
    // Determine which weights to load — pick representative weights
    // that cover the range used in templates (typically 400 and 700)
    const weightsToLoad = pickWeights(stack.weights);

    for (const weight of weightsToLoad) {
      let buffer: Buffer;

      if (stack.localPath) {
        // Local TTF/OTF file — load from disk
        try {
          buffer = fs.readFileSync(path.resolve(stack.localPath));
        } catch {
          // Local file not found — try Google Fonts or Inter fallback
          buffer = stack.googleFonts
            ? await fetchGoogleFontSafe(stack.googleFonts, weight, getInterFallback)
            : await getInterFallback(weight);
        }
      } else if (stack.googleFonts) {
        buffer = await fetchGoogleFontSafe(stack.googleFonts, weight, getInterFallback);
      } else {
        // No font source (e.g. Adobe Typekit without local file) — use Inter fallback
        buffer = await getInterFallback(weight);
      }

      fonts.push({
        name: stack.family,
        data: buffer,
        weight,
        style: 'normal',
      });
    }
  }

  return fonts;
}

/**
 * Pick representative weights to load. Templates typically use 400 and 600-700.
 * Don't load every weight — just the ones Satori needs.
 */
function pickWeights(available: number[]): number[] {
  const weights = new Set<number>();

  // Always try to get a regular weight
  const regular = available.find((w) => w === 400) ?? available[0];
  weights.add(regular);

  // And a bold weight
  const bold = available.find((w) => w === 700) ?? available.find((w) => w >= 600) ?? available[available.length - 1];
  weights.add(bold);

  // And a medium if available (used for subtitles/labels)
  const medium = available.find((w) => w === 500);
  if (medium) weights.add(medium);

  return Array.from(weights);
}

// ---------------------------------------------------------------------------
// Render Pipeline
// ---------------------------------------------------------------------------

export interface RenderOptions {
  width: number;
  height: number;
  format?: 'png' | 'svg';
  /** DPI multiplier for print output. 1 = 72dpi (web), ~4.17 = 300dpi */
  dpiScale?: number;
}

/**
 * Render a Satori JSX element to PNG or SVG.
 */
export async function renderToBuffer(
  element: any,
  kit: BrandKit,
  options: RenderOptions,
): Promise<Buffer> {
  const fonts = await loadFonts(kit);
  const scale = options.dpiScale ?? 1;
  const renderWidth = Math.round(options.width * scale);
  const renderHeight = Math.round(options.height * scale);

  const svg = await satori(element as any, {
    width: renderWidth,
    height: renderHeight,
    fonts: fonts.map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900,
      style: 'normal' as const,
    })),
  });

  if (options.format === 'svg') {
    return Buffer.from(svg, 'utf-8');
  }

  // SVG → PNG via Resvg
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: renderWidth },
  });
  return resvg.render().asPng();
}

/**
 * Render and save to file.
 */
export async function renderToFile(
  element: any,
  kit: BrandKit,
  options: RenderOptions & { outputPath: string },
): Promise<string> {
  const buffer = await renderToBuffer(element, kit, options);
  const dir = path.dirname(options.outputPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(options.outputPath, buffer);
  return options.outputPath;
}
