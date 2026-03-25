/**
 * Extractor tests
 *
 * Tests all pure extraction functions with inline fixture strings.
 */

import { describe, it, expect } from 'vitest';
import { normalizeHex, deduplicateByFrequency, classifyFont } from '../src/core/extractors/utils.js';
import { extractColors, inferMode } from '../src/core/extractors/colors.js';
import { extractTypography } from '../src/core/extractors/typography.js';
import { extractSpacing } from '../src/core/extractors/spacing.js';
import { extractLayout } from '../src/core/extractors/layout.js';
import { extractVoiceHints } from '../src/core/extractors/voice-hints.js';

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

describe('normalizeHex', () => {
  it('passes through valid 6-char hex', () => {
    expect(normalizeHex('#facc15')).toBe('#facc15');
  });

  it('expands 3-char shorthand', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc');
  });

  it('strips alpha from 8-char hex', () => {
    expect(normalizeHex('#1a1a1dff')).toBe('#1a1a1d');
  });

  it('adds # prefix if missing', () => {
    expect(normalizeHex('e86c5d')).toBe('#e86c5d');
  });

  it('lowercases', () => {
    expect(normalizeHex('#FACC15')).toBe('#facc15');
  });

  it('returns null for invalid', () => {
    expect(normalizeHex('not-a-color')).toBeNull();
    expect(normalizeHex('#gg0000')).toBeNull();
  });
});

describe('deduplicateByFrequency', () => {
  it('sorts by frequency descending', () => {
    expect(deduplicateByFrequency(['a', 'b', 'a', 'c', 'b', 'a'])).toEqual(['a', 'b', 'c']);
  });

  it('handles empty array', () => {
    expect(deduplicateByFrequency([])).toEqual([]);
  });
});

describe('classifyFont', () => {
  it('classifies known fonts', () => {
    expect(classifyFont('Inter')).toBe('sans-serif');
    expect(classifyFont('JetBrains Mono')).toBe('monospace');
    expect(classifyFont('Playfair Display')).toBe('serif');
    expect(classifyFont('Bebas Neue')).toBe('display');
  });

  it('returns null for unknown fonts', () => {
    expect(classifyFont('My Custom Font')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(classifyFont('INTER')).toBe('sans-serif');
  });
});

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

describe('extractColors', () => {
  it('extracts Tailwind arbitrary hex values', () => {
    const content = `
      <div className="bg-[#1a1a1d] text-[#ffffff]">
        <p className="text-[#ffffff]">Hello</p>
        <span className="text-[#e86c5d]">Accent</span>
      </div>
    `;
    const result = extractColors([content]);
    expect(result).toBeDefined();
    expect(result!.allExtracted).toContain('#e86c5d');
    expect(result!.allExtracted).toContain('#1a1a1d');
    expect(result!.background).toBe('#1a1a1d');
    expect(result!.foreground).toBe('#ffffff');
  });

  it('extracts CSS custom properties', () => {
    const content = `
      :root {
        --brand-primary: #e86c5d;
        --brand-bg: #0a0a0b;
      }
    `;
    const result = extractColors([content]);
    expect(result).toBeDefined();
    expect(result!.allExtracted).toContain('#e86c5d');
    expect(result!.allExtracted).toContain('#0a0a0b');
  });

  it('extracts inline style colors', () => {
    const content = `
      <div style="background-color: #0a0a0b; color: #ffffff">
        <span style="color: #facc15">Accent</span>
      </div>
    `;
    const result = extractColors([content]);
    expect(result).toBeDefined();
    expect(result!.allExtracted).toContain('#facc15');
  });

  it('extracts quoted hex values (JSX style objects)', () => {
    const content = `
      const style = { color: '#e86c5d', backgroundColor: '#0a0a0b' };
    `;
    const result = extractColors([content]);
    expect(result).toBeDefined();
    expect(result!.allExtracted).toContain('#e86c5d');
  });

  it('returns undefined for no colors', () => {
    const result = extractColors(['<div>No colors here</div>']);
    expect(result).toBeUndefined();
  });

  it('identifies primary as most frequent chromatic color', () => {
    const content = `
      :root {
        --bg: #0a0a0b;
        --fg: #ffffff;
        --primary: #e86c5d;
        --primary2: #e86c5d;
        --primary3: #e86c5d;
        --secondary: #00ced1;
      }
    `;
    const result = extractColors([content]);
    expect(result).toBeDefined();
    // #e86c5d appears 3x, #00ced1 appears 1x — primary should be most frequent chromatic
    expect(result!.primary?.hex).toBe('#e86c5d');
    expect(result!.secondary?.hex).toBe('#00ced1');
  });
});

describe('inferMode', () => {
  it('infers dark mode from dark background', () => {
    expect(inferMode({ background: '#0a0a0b', allExtracted: ['#0a0a0b'] })).toBe('dark');
  });

  it('infers light mode from light background', () => {
    expect(inferMode({ background: '#fafafa', allExtracted: ['#fafafa'] })).toBe('light');
  });

  it('returns undefined for no background', () => {
    expect(inferMode({ allExtracted: ['#e86c5d'] })).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

describe('extractTypography', () => {
  it('extracts next/font/google imports', () => {
    const content = `
      import { Inter } from 'next/font/google';
      import { Playfair_Display } from 'next/font/google';
    `;
    const result = extractTypography([content]);
    expect(result).toBeDefined();
    // Should find both fonts
    expect(result!.display || result!.body).toBeDefined();
  });

  it('extracts Google Fonts link tags', () => {
    const content = `
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Inter:wght@400;500" rel="stylesheet">
    `;
    const result = extractTypography([content]);
    expect(result).toBeDefined();
  });

  it('extracts font-family from CSS', () => {
    const content = `
      h1 { font-family: 'Bebas Neue', sans-serif; }
      body { font-family: 'Inter', system-ui, sans-serif; }
      code { font-family: 'JetBrains Mono', monospace; }
    `;
    const result = extractTypography([content]);
    expect(result).toBeDefined();
    expect(result!.display?.family).toBe('Bebas Neue');
    expect(result!.body?.family).toBe('Inter');
    expect(result!.mono?.family).toBe('JetBrains Mono');
  });

  it('extracts Tailwind fontFamily config', () => {
    const content = `
      fontFamily: {
        display: ['Space Grotesk', 'system-ui'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    `;
    const result = extractTypography([content]);
    expect(result).toBeDefined();
    expect(result!.display?.family).toBe('Space Grotesk');
    expect(result!.body?.family).toBe('Inter');
    expect(result!.mono?.family).toBe('JetBrains Mono');
  });

  it('returns undefined for no fonts', () => {
    const result = extractTypography(['<div>No fonts here</div>']);
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

describe('extractSpacing', () => {
  it('extracts Tailwind spacing classes', () => {
    const content = `
      <div className="p-4 mt-8 gap-6 px-2">
        <section className="py-24 px-8">Content</section>
      </div>
    `;
    const result = extractSpacing([content]);
    expect(result).toBeDefined();
    expect(result!.values).toContain(1);   // p-4 = 1rem
    expect(result!.values).toContain(2);   // mt-8 = 2rem
    expect(result!.values).toContain(6);   // py-24 = 6rem
  });

  it('extracts Tailwind arbitrary spacing', () => {
    const content = '<div className="p-[2rem] m-[32px]">Hello</div>';
    const result = extractSpacing([content]);
    expect(result).toBeDefined();
    expect(result!.values).toContain(2);   // 2rem
    expect(result!.values).toContain(2);   // 32px = 2rem
  });

  it('identifies section padding from large values', () => {
    const content = `
      <section className="py-24">A</section>
      <section className="py-24">B</section>
      <section className="py-16">C</section>
    `;
    const result = extractSpacing([content]);
    expect(result).toBeDefined();
    expect(result!.sectionPadding).toBeDefined();
  });

  it('returns undefined for no spacing', () => {
    const result = extractSpacing(['<div>No spacing</div>']);
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

describe('extractLayout', () => {
  it('extracts Tailwind max-w classes', () => {
    const content = '<div className="max-w-7xl mx-auto">Content</div>';
    const result = extractLayout([content]);
    expect(result).toBeDefined();
    expect(result!.maxWidth).toBe(80); // 7xl = 80rem
  });

  it('extracts arbitrary max-width', () => {
    const content = '<div className="max-w-[72rem]">Content</div>';
    const result = extractLayout([content]);
    expect(result).toBeDefined();
    expect(result!.maxWidth).toBe(72);
  });

  it('extracts CSS max-width', () => {
    const content = '.container { max-width: 1280px; }';
    const result = extractLayout([content]);
    expect(result).toBeDefined();
    expect(result!.maxWidth).toBe(80); // 1280px = 80rem
  });

  it('returns undefined for no layout', () => {
    const result = extractLayout(['<div>No layout</div>']);
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Voice Hints
// ---------------------------------------------------------------------------

describe('extractVoiceHints', () => {
  it('extracts heading text', () => {
    const content = `
      <h1>Welcome to Our Platform</h1>
      <h2>Features That Matter</h2>
    `;
    const result = extractVoiceHints([content]);
    expect(result).toBeDefined();
    expect(result!.headings).toContain('Welcome to Our Platform');
    expect(result!.headings).toContain('Features That Matter');
  });

  it('extracts button/CTA text', () => {
    const content = `
      <button>Get Started Free</button>
      <Button>Learn More</Button>
    `;
    const result = extractVoiceHints([content]);
    expect(result).toBeDefined();
    expect(result!.ctaLabels).toContain('Get Started Free');
    expect(result!.ctaLabels).toContain('Learn More');
  });

  it('extracts paragraph text (min 30 chars)', () => {
    const content = `
      <p>Short</p>
      <p>This is a longer paragraph that describes the product and its many wonderful features for users.</p>
    `;
    const result = extractVoiceHints([content]);
    expect(result).toBeDefined();
    expect(result!.bodySnippets.length).toBe(1);
    expect(result!.bodySnippets[0]).toContain('longer paragraph');
  });

  it('returns undefined for no text', () => {
    const result = extractVoiceHints(['<div className="grid"></div>']);
    expect(result).toBeUndefined();
  });

  it('deduplicates headings', () => {
    const content = `
      <h1>Hello World</h1>
      <h1>Hello World</h1>
    `;
    const result = extractVoiceHints([content]);
    expect(result).toBeDefined();
    expect(result!.headings.length).toBe(1);
  });
});
