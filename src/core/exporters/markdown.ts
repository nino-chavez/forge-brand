/**
 * Markdown Exporter
 *
 * Pure function: BrandKit → DESIGN-SYSTEM.md string.
 * Follows the same structure as flickdaymedia's manual DESIGN-SYSTEM.md
 * but generated entirely from the brand kit.
 */

import type { BrandKit } from '../schema/brand-kit.js';

export function exportMarkdown(kit: BrandKit): string {
  const lines: string[] = [];
  const { identity, colors, typography, spacing, layout, voice } = kit;

  // --- Header ---
  lines.push(`# ${identity.name} Design System`);
  lines.push('');
  lines.push('## Brand Identity');
  if (identity.tagline) lines.push(`- **Tagline**: "${identity.tagline}"`);
  if (identity.mission) lines.push(`- **Mission**: ${identity.mission}`);
  if (identity.positioning) lines.push(`- **Positioning**: ${identity.positioning}`);
  if (identity.audience.length) lines.push(`- **Audience**: ${identity.audience.join(', ')}`);
  if (identity.personality.length) lines.push(`- **Personality**: ${identity.personality.join(', ')}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // --- Colors ---
  lines.push('## Color Palette');
  lines.push('');
  lines.push('### Primary Colors');
  lines.push('| Name | Hex | Usage |');
  lines.push('|------|-----|-------|');
  lines.push(`| ${colors.primary.name} | \`${colors.primary.hex}\` | ${colors.primary.usage || 'Primary accent'} |`);
  lines.push(`| ${colors.secondary.name} | \`${colors.secondary.hex}\` | ${colors.secondary.usage || 'Secondary accent'} |`);
  lines.push(`| ${colors.accent.name} | \`${colors.accent.hex}\` | ${colors.accent.usage || 'Accent'} |`);
  lines.push('');

  lines.push('### Neutral Scale');
  lines.push('| Step | Hex |');
  lines.push('|------|-----|');
  for (const [step, hex] of Object.entries(colors.neutral)) {
    lines.push(`| ${step} | \`${hex}\` |`);
  }
  lines.push('');

  lines.push('### Semantic Colors');
  lines.push('| Name | Hex | Usage |');
  lines.push('|------|-----|-------|');
  for (const [role, token] of Object.entries(colors.semantic)) {
    lines.push(`| ${token.name} | \`${token.hex}\` | ${token.usage || role} |`);
  }
  lines.push('');

  lines.push('### Surfaces');
  lines.push('| Name | Hex |');
  lines.push('|------|-----|');
  for (const [name, hex] of Object.entries(colors.surfaces)) {
    lines.push(`| ${name} | \`${hex}\` |`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // --- Typography ---
  lines.push('## Typography');
  lines.push('');
  lines.push('### Font Stack');
  lines.push('```css');
  lines.push(`${typography.display.cssVariable || '--font-display'}: '${typography.display.family}', ${typography.display.fallbacks.join(', ')};`);
  lines.push(`${typography.body.cssVariable || '--font-body'}: '${typography.body.family}', ${typography.body.fallbacks.join(', ')};`);
  lines.push(`${typography.mono.cssVariable || '--font-mono'}: '${typography.mono.family}', ${typography.mono.fallbacks.join(', ')};`);
  lines.push('```');
  lines.push('');

  lines.push('### Type Scale');
  lines.push('| Name | Size (Desktop) | Size (Mobile) | Weight | Line Height | Font |');
  lines.push('|------|---------------|---------------|--------|-------------|------|');
  for (const step of typography.scale.steps) {
    const mobile = step.sizeMobileRem ? `${step.sizeMobileRem}rem` : '—';
    lines.push(`| ${step.name} | ${step.sizeRem}rem | ${mobile} | ${step.weight} | ${step.lineHeight} | ${step.font} |`);
  }
  lines.push('');

  // Text transform rules
  const transforms = [typography.display, typography.body, typography.mono].filter(
    (f) => f.textTransform !== 'none',
  );
  if (transforms.length) {
    lines.push('### Typography Rules');
    for (const font of transforms) {
      lines.push(`- **${font.family}**: ${font.textTransform}${font.letterSpacing ? `, letter-spacing: ${font.letterSpacing}em` : ''}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // --- Spacing ---
  lines.push('## Spacing Scale');
  lines.push('');
  lines.push('```css');
  for (const [step, rem] of Object.entries(spacing)) {
    lines.push(`--space-${step}: ${rem}rem;  /* ${rem * 16}px */`);
  }
  lines.push('```');
  lines.push('');
  lines.push('---');
  lines.push('');

  // --- Layout ---
  lines.push('## Layout');
  lines.push('');
  lines.push(`- **Max content width**: ${layout.maxContentWidth}rem (${layout.maxContentWidth * 16}px)`);
  lines.push(`- **Section padding**: space-${layout.sectionPadding}`);
  lines.push(`- **Container padding**: space-${layout.containerPadding}`);
  lines.push('');
  lines.push('### Breakpoints');
  lines.push('| Name | Min Width |');
  lines.push('|------|-----------|');
  for (const [name, px] of Object.entries(layout.breakpoints)) {
    lines.push(`| ${name} | ${px}px |`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // --- Voice ---
  lines.push('## Voice & Tone');
  lines.push('');
  if (voice.attributes.length) {
    lines.push('### Attributes');
    for (const attr of voice.attributes) {
      lines.push(`- **${attr.trait}**: ${attr.description}`);
      if (attr.example) lines.push(`  > "${attr.example}"`);
    }
    lines.push('');
  }

  if (voice.antiPatterns.length) {
    lines.push('### Avoid');
    for (const ap of voice.antiPatterns) {
      lines.push(`- **${ap.category}** (${ap.severity}): ${ap.patterns.slice(0, 5).join(', ')}${ap.patterns.length > 5 ? '...' : ''}`);
      if (ap.suggestion) lines.push(`  > Instead: ${ap.suggestion}`);
    }
    lines.push('');
  }

  if (voice.examples.length) {
    lines.push('### Examples');
    for (const ex of voice.examples) {
      lines.push(`**${ex.intent}**`);
      lines.push(`- Good: "${ex.good}"`);
      lines.push(`- Bad: "${ex.bad}"`);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');
  lines.push(`*Generated by brand-forge v${kit.meta.version} on ${kit.meta.updated}*`);

  return lines.join('\n');
}
