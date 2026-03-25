/**
 * Typography Extractor
 *
 * Parses font families and weights from source files.
 * Classifies fonts and assigns to display/body/mono roles.
 */

import type { FontClassification } from '../schema/typography.js';
import { classifyFont, deduplicateByFrequency } from './utils.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExtractedFont {
  family: string;
  classification: FontClassification;
  weights?: number[];
  googleFonts?: string;
}

export interface ExtractedTypography {
  display?: ExtractedFont;
  body?: ExtractedFont;
  mono?: ExtractedFont;
}

interface FontOccurrence {
  family: string;
  context: 'heading' | 'body' | 'code' | 'general';
}

// ---------------------------------------------------------------------------
// Regex Patterns
// ---------------------------------------------------------------------------

/**
 * Extract font names from various source patterns.
 * Each pattern returns { family, context }.
 */
function extractFontOccurrences(contents: string[]): FontOccurrence[] {
  const occurrences: FontOccurrence[] = [];

  for (const content of contents) {
    // next/font/google imports: import { Inter } from 'next/font/google'
    // The import name IS the font (PascalCase → spaces)
    const nextFontImports = content.matchAll(
      /import\s*\{\s*(\w+)\s*\}\s*from\s*['"]next\/font\/google['"]/g,
    );
    for (const match of nextFontImports) {
      const fontName = pascalToSpaces(match[1]);
      occurrences.push({ family: fontName, context: 'general' });
    }

    // next/font variable assignments with subsets/weights
    // const inter = Inter({ subsets: ['latin'], weight: ['400', '500'] })
    const nextFontConfigs = content.matchAll(
      /const\s+\w+\s*=\s*(\w+)\(\s*\{[^}]*weight:\s*\[([^\]]+)\]/g,
    );
    for (const match of nextFontConfigs) {
      const fontName = pascalToSpaces(match[1]);
      const weights = match[2].match(/['"](\d{3})['"]/g)?.map((w) =>
        parseInt(w.replace(/['"]/g, ''), 10),
      );
      occurrences.push({ family: fontName, context: 'general' });
      // Store weights — handled in classification phase
      if (weights) {
        for (const w of weights) {
          occurrences.push({ family: `${fontName}:${w}`, context: 'general' });
        }
      }
    }

    // Google Fonts link tags: fonts.googleapis.com/css2?family=Inter:wght@400;700
    const googleFontsLinks = content.matchAll(
      /fonts\.googleapis\.com\/css2?\?family=([^&"'>\s]+)/g,
    );
    for (const match of googleFontsLinks) {
      const families = decodeURIComponent(match[1]).split('|');
      for (const fam of families) {
        const name = fam.split(':')[0].replace(/\+/g, ' ');
        occurrences.push({ family: name, context: 'general' });
      }
    }

    // @font-face declarations: font-family: 'Rival Sans'
    const fontFaceDecls = content.matchAll(
      /@font-face\s*\{[^}]*font-family:\s*['"]([^'"]+)['"]/gs,
    );
    for (const match of fontFaceDecls) {
      occurrences.push({ family: match[1], context: 'general' });
    }

    // CSS font-family in heading contexts (h1-h6)
    const headingFonts = content.matchAll(
      /h[1-6][^{]*\{[^}]*font-family:\s*['"]?([^'",;\n}]+)/gs,
    );
    for (const match of headingFonts) {
      occurrences.push({ family: match[1].trim(), context: 'heading' });
    }

    // CSS font-family in body/p contexts
    const bodyFonts = content.matchAll(
      /(?:body|\.body|p\b)[^{]*\{[^}]*font-family:\s*['"]?([^'",;\n}]+)/gs,
    );
    for (const match of bodyFonts) {
      occurrences.push({ family: match[1].trim(), context: 'body' });
    }

    // CSS font-family in code/pre contexts
    const codeFonts = content.matchAll(
      /(?:code|pre|\.mono|\.code)[^{]*\{[^}]*font-family:\s*['"]?([^'",;\n}]+)/gs,
    );
    for (const match of codeFonts) {
      occurrences.push({ family: match[1].trim(), context: 'code' });
    }

    // Tailwind fontFamily config: display: ['Space Grotesk', ...]
    const twFontConfigs = content.matchAll(
      /fontFamily:\s*\{([^}]+)\}/gs,
    );
    for (const match of twFontConfigs) {
      const block = match[1];
      const entries = block.matchAll(
        /(display|body|sans|serif|mono):\s*\[['"]([^'"]+)['"]/g,
      );
      for (const entry of entries) {
        const role = entry[1];
        const family = entry[2];
        const context: FontOccurrence['context'] =
          role === 'display' ? 'heading' :
          role === 'mono' ? 'code' :
          role === 'body' || role === 'sans' ? 'body' :
          'general';
        occurrences.push({ family, context });
      }
    }
  }

  return occurrences;
}

// ---------------------------------------------------------------------------
// Classification & Assignment
// ---------------------------------------------------------------------------

/**
 * Extract typography information from source file contents.
 */
export function extractTypography(contents: string[]): ExtractedTypography | undefined {
  const occurrences = extractFontOccurrences(contents);

  // Filter out weight-tagged entries and system fonts
  const fontOccurrences = occurrences.filter((o) => {
    if (o.family.includes(':')) return false;
    const lower = o.family.toLowerCase();
    if (['system-ui', 'sans-serif', 'serif', 'monospace', 'inherit', 'initial'].includes(lower)) {
      return false;
    }
    return true;
  });

  if (fontOccurrences.length === 0) return undefined;

  // Group by context
  const headingFonts = deduplicateByFrequency(
    fontOccurrences.filter((o) => o.context === 'heading').map((o) => o.family),
  );
  const bodyFonts = deduplicateByFrequency(
    fontOccurrences.filter((o) => o.context === 'body').map((o) => o.family),
  );
  const codeFonts = deduplicateByFrequency(
    fontOccurrences.filter((o) => o.context === 'code').map((o) => o.family),
  );
  const allFonts = deduplicateByFrequency(
    fontOccurrences.map((o) => o.family),
  );

  const result: ExtractedTypography = {};

  // Assign display font
  const displayFamily = headingFonts[0] ?? allFonts[0];
  if (displayFamily) {
    const classification = classifyFont(displayFamily) ?? 'sans-serif';
    result.display = { family: displayFamily, classification };
  }

  // Assign body font (must differ from display if possible)
  const bodyFamily = bodyFonts[0] ?? allFonts.find((f) => f !== displayFamily) ?? allFonts[0];
  if (bodyFamily) {
    const classification = classifyFont(bodyFamily) ?? 'sans-serif';
    result.body = { family: bodyFamily, classification };
  }

  // Assign mono font
  const monoFamily = codeFonts[0] ??
    allFonts.find((f) => classifyFont(f) === 'monospace');
  if (monoFamily) {
    result.mono = { family: monoFamily, classification: 'monospace' };
  }

  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert PascalCase to spaces: "SpaceGrotesk" → "Space Grotesk" */
function pascalToSpaces(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}
