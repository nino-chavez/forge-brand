/**
 * Exporter snapshot tests
 *
 * Same input must always produce identical output (deterministic).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseBrandKit } from '../src/core/schema/brand-kit.js';
import { exportCssTokens } from '../src/core/exporters/css-tokens.js';
import { exportTailwindPreset } from '../src/core/exporters/tailwind.js';
import { exportMarkdown } from '../src/core/exporters/markdown.js';
import { exportDesignMd } from '../src/core/exporters/design-md.js';
import { exportSignalForgeTheme } from '../src/core/exporters/signal-forge-theme.js';
import { exportImageGenStyle } from '../src/core/exporters/image-gen-style.js';

const flickdayKit = parseBrandKit(
  JSON.parse(fs.readFileSync(path.resolve(__dirname, '../presets/flickday.json'), 'utf-8')),
);

describe('exportCssTokens', () => {
  it('produces deterministic output', () => {
    const a = exportCssTokens(flickdayKit);
    const b = exportCssTokens(flickdayKit);
    expect(a).toBe(b);
  });

  it('contains :root block', () => {
    const css = exportCssTokens(flickdayKit);
    expect(css).toContain(':root {');
  });

  it('contains brand primary color', () => {
    const css = exportCssTokens(flickdayKit);
    expect(css).toContain('--brand-primary: #facc15;');
  });

  it('contains font variables', () => {
    // Reads the family from the kit rather than naming one. Hardcoding
    // "Bebas Neue" here pinned a value that had drifted from the live site
    // months earlier, so the suite was holding the stale fact in place and
    // the correction looked like a regression.
    const css = exportCssTokens(flickdayKit);
    expect(css).toContain(`--font-display: '${flickdayKit.typography.display.family}'`);
    expect(css).toContain('--font-body:');
  });

  it('contains DO NOT EDIT warning', () => {
    const css = exportCssTokens(flickdayKit);
    expect(css).toContain('DO NOT EDIT');
  });
});

describe('exportTailwindPreset', () => {
  it('produces deterministic output', () => {
    const a = exportTailwindPreset(flickdayKit);
    const b = exportTailwindPreset(flickdayKit);
    expect(a).toBe(b);
  });

  it('exports valid-looking JS module', () => {
    const tw = exportTailwindPreset(flickdayKit);
    expect(tw).toContain('export default {');
    expect(tw).toContain('theme: {');
  });

  it('includes brand colors', () => {
    const tw = exportTailwindPreset(flickdayKit);
    expect(tw).toContain("primary: '#facc15'");
  });
});

describe('exportMarkdown', () => {
  it('produces deterministic output', () => {
    const a = exportMarkdown(flickdayKit);
    const b = exportMarkdown(flickdayKit);
    expect(a).toBe(b);
  });

  it('includes brand name as title', () => {
    const md = exportMarkdown(flickdayKit);
    expect(md).toContain('# Flickday Media Design System');
  });

  it('includes color table', () => {
    const md = exportMarkdown(flickdayKit);
    expect(md).toContain('Flickday Yellow');
    expect(md).toContain('`#facc15`');
  });

  it('includes voice section', () => {
    const md = exportMarkdown(flickdayKit);
    expect(md).toContain('## Voice & Tone');
    expect(md).toContain('authentic');
  });
});

describe('exportDesignMd', () => {
  it('produces deterministic output', () => {
    const a = exportDesignMd(flickdayKit);
    const b = exportDesignMd(flickdayKit);
    expect(a).toBe(b);
  });

  it('opens with YAML frontmatter', () => {
    const md = exportDesignMd(flickdayKit);
    expect(md.startsWith('---\n')).toBe(true);
    // Frontmatter must close with a `---` line before the body begins.
    const afterOpen = md.slice(4);
    expect(afterOpen).toMatch(/\n---\n/);
  });

  it('emits tokens under canonical frontmatter keys', () => {
    const md = exportDesignMd(flickdayKit);
    expect(md).toContain('colors:');
    expect(md).toContain('typography:');
    expect(md).toContain('spacing:');
    expect(md).toContain('rounded:');
    expect(md).toContain('layout:');
    expect(md).toContain('primary: "#facc15"');
  });

  it('mirrors every nested color as a flat top-level key', () => {
    // Conformance readers that check a rendered page against DESIGN.md walk only
    // the top level of `colors:` for string values (impeccable's
    // design-system.mjs addColorObject() is non-recursive). Without these flat
    // aliases every neutral/semantic/surface color reads as undeclared drift.
    const md = exportDesignMd(flickdayKit);
    const frontmatter = md.slice(0, md.indexOf('\n---\n', 4));

    const flatValue = (key: string) =>
      frontmatter.match(new RegExp(`^ {2}${key}: "(#[0-9a-fA-F]+)"$`, 'm'))?.[1];

    for (const [step, hex] of Object.entries(flickdayKit.colors.neutral)) {
      expect(flatValue(`neutral-${step}`)).toBe(hex);
    }
    for (const [role, token] of Object.entries(flickdayKit.colors.semantic)) {
      expect(flatValue(`semantic-${role}`)).toBe(token.hex);
    }
    for (const [name, hex] of Object.entries(flickdayKit.colors.surfaces)) {
      expect(flatValue(`surface-${name}`)).toBe(hex);
    }

    // The grouped blocks stay canonical — flat keys are additive, not a swap.
    expect(md).toContain('  neutral:');
    expect(md).toContain('  semantic:');
    expect(md).toContain('  surfaces:');
  });

  it('mirrors fonts and type steps in the shape a conformance reader walks', () => {
    // Same failure as the flat colors, on two more paths. impeccable's
    // addTypographyFonts wants a top-level role object with a string
    // `fontFamily`; addTypographySizes wants a role object with `fontSize`.
    // This exporter's canonical shape is `fonts.<role>.family` and
    // `scale.<name>.size`, so before these aliases a generated DESIGN.md parsed
    // to zero fonts and zero type steps — which does not relax the font check,
    // it makes every font on the page read as undeclared.
    const md = exportDesignMd(flickdayKit);
    const frontmatter = md.slice(0, md.indexOf('\n---\n', 4));

    const roleFamily = (role: string) =>
      frontmatter.match(new RegExp(`^ {2}${role}:\\n {4}fontFamily: "([^"]+)"$`, 'm'))?.[1];

    for (const role of ['display', 'body', 'mono'] as const) {
      const font = flickdayKit.typography[role];
      // The whole stack, not just the primary: a rendered page computes to the
      // fallback when the primary is missing, and an undeclared fallback is a
      // finding.
      expect(roleFamily(role)).toBe([font.family, ...font.fallbacks].join(', '));
    }

    for (const step of flickdayKit.typography.scale.steps) {
      expect(frontmatter).toMatch(
        new RegExp(`^ {2}"?step-${step.name}"?:\\n {4}fontSize: ${step.sizeRem}rem$`, 'm'),
      );
    }

    // Additive, not a swap — the grouped blocks stay canonical.
    expect(md).toContain('  fonts:');
    expect(md).toContain('  scale:');
  });

  it('emits canonical body sections in order', () => {
    const md = exportDesignMd(flickdayKit);
    const idx = (s: string) => md.indexOf(s);
    expect(idx('## Overview')).toBeGreaterThan(-1);
    expect(idx('## Overview')).toBeLessThan(idx('## Colors'));
    expect(idx('## Colors')).toBeLessThan(idx('## Typography'));
    expect(idx('## Typography')).toBeLessThan(idx('## Layout'));
    expect(idx('## Layout')).toBeLessThan(idx('## Shapes'));
    expect(idx('## Shapes')).toBeLessThan(idx("## Do's and Don'ts"));
  });

  it('uses token-reference syntax in the body', () => {
    const md = exportDesignMd(flickdayKit);
    expect(md).toContain('{colors.primary}');
    expect(md).toContain('{colors.surfaces.card}');
  });

  it('carries a provenance footer with brand-forge version', () => {
    const md = exportDesignMd(flickdayKit);
    expect(md).toContain('Generated by brand-forge v');
  });
});

describe('exportSignalForgeTheme', () => {
  it('produces valid JSON', () => {
    const json = exportSignalForgeTheme(flickdayKit);
    const parsed = JSON.parse(json);
    expect(parsed.id).toBe('flickday-media');
  });

  it('strips # from hex colors', () => {
    const json = exportSignalForgeTheme(flickdayKit);
    const parsed = JSON.parse(json);
    expect(parsed.colors.primary).toBe('facc15');
    expect(parsed.colors.primary).not.toContain('#');
  });
});

describe('exportImageGenStyle', () => {
  it('produces valid JSON', () => {
    const json = exportImageGenStyle(flickdayKit);
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe('flickday-media');
  });

  it('includes basePrompt from creative context', () => {
    const json = exportImageGenStyle(flickdayKit);
    const parsed = JSON.parse(json);
    expect(parsed.basePrompt).toContain('Flickday Media');
  });

  it('includes conceptMap', () => {
    const json = exportImageGenStyle(flickdayKit);
    const parsed = JSON.parse(json);
    expect(parsed.conceptMap.aperture).toBeTruthy();
  });
});
