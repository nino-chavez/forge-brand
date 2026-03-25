/**
 * Voice Hints Extractor
 *
 * Extracts raw copy text from components to feed into generateVoice().
 * Does not produce voice data directly — provides raw material for AI enrichment.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExtractedVoiceHints {
  headings: string[];
  ctaLabels: string[];
  bodySnippets: string[];
}

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

/**
 * Extract copy text (headings, CTAs, body) from source file contents.
 */
export function extractVoiceHints(contents: string[]): ExtractedVoiceHints | undefined {
  const headings: string[] = [];
  const ctaLabels: string[] = [];
  const bodySnippets: string[] = [];

  for (const content of contents) {
    // HTML/JSX heading content: <h1>Text</h1>, <h2 className="...">Text</h2>
    const headingMatches = content.matchAll(/<h[1-6][^>]*>([^<]+)</g);
    for (const match of headingMatches) {
      const text = cleanText(match[1]);
      if (text.length >= 3) headings.push(text);
    }

    // Button/CTA text: <button>Text</button>, <Button>Text</Button>
    const buttonMatches = content.matchAll(/<[Bb]utton[^>]*>([^<]+)</g);
    for (const match of buttonMatches) {
      const text = cleanText(match[1]);
      if (text.length >= 2) ctaLabels.push(text);
    }

    // Link text with CTA-like classes
    const ctaLinkMatches = content.matchAll(
      /<a[^>]*(?:class(?:Name)?="[^"]*(?:btn|cta|button)[^"]*")[^>]*>([^<]+)</g,
    );
    for (const match of ctaLinkMatches) {
      const text = cleanText(match[1]);
      if (text.length >= 2) ctaLabels.push(text);
    }

    // Paragraph text (min 30 chars to skip labels)
    const paragraphMatches = content.matchAll(/<p[^>]*>([^<]{30,})</g);
    for (const match of paragraphMatches) {
      const text = cleanText(match[1]);
      if (text.length >= 30) bodySnippets.push(text);
    }

    // JSX string literals that look like copy (in curly braces, 5+ words)
    const jsxStrings = content.matchAll(/>\s*\{?\s*['"`]([^'"`]{20,})['"`]\s*\}?\s*</g);
    for (const match of jsxStrings) {
      const text = cleanText(match[1]);
      const wordCount = text.split(/\s+/).length;
      if (wordCount >= 5) bodySnippets.push(text);
    }
  }

  if (headings.length === 0 && ctaLabels.length === 0 && bodySnippets.length === 0) {
    return undefined;
  }

  return {
    headings: [...new Set(headings)],
    ctaLabels: [...new Set(ctaLabels)],
    bodySnippets: [...new Set(bodySnippets)],
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip JSX expressions, extra whitespace, and HTML entities */
function cleanText(raw: string): string {
  return raw
    .replace(/\{[^}]*\}/g, '')       // remove JSX expressions
    .replace(/&[a-z]+;/gi, ' ')       // remove HTML entities
    .replace(/\s+/g, ' ')            // collapse whitespace
    .trim();
}
