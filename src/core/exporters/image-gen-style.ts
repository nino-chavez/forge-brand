/**
 * Image Gen Style Bridge
 *
 * Pure function: BrandKit → image-gen style system object (as JSON string).
 * This bridges brand-forge's schema to image-gen's style system format.
 *
 * image-gen style systems have: name, description, basePrompt, styles,
 * default, conceptMap, and formatModifiers.
 */

import type { BrandKit } from '../schema/brand-kit.js';

/**
 * Export a brand kit as an image-gen style system JSON string.
 */
export function exportImageGenStyle(kit: BrandKit): string {
  const { identity, colors, media } = kit;
  const creative = media.creative;

  // Build base prompt from brand kit if no creative context exists
  const basePrompt = creative?.basePrompt || buildDefaultBasePrompt(kit);

  const style = {
    name: kit.meta.id,
    description: `${identity.name} brand style — ${identity.tagline || identity.mission || ''}`.trim(),

    basePrompt,

    styles: {},  // Style categories would be populated by generators or manual entry

    default: {
      background: kit.defaultMode === 'dark'
        ? `Dark background (${colors.surfaces.background})`
        : `Light background (${colors.surfaces.background})`,
      lineColor: `${colors.primary.name} (${colors.primary.hex}) with ${colors.secondary.name} (${colors.secondary.hex}) accents`,
      style: identity.personality.length
        ? `${identity.personality.join(', ')} aesthetic`
        : 'Clean, modern',
      elements: creative?.visualKeywords?.join(', ') || 'Brand-consistent visual elements',
      personality: identity.personality.join(', ') || identity.tagline || '',
    },

    conceptMap: creative?.conceptMap || {},
    formatModifiers: creative?.formatModifiers || {},
  };

  return JSON.stringify(style, null, 2);
}

function buildDefaultBasePrompt(kit: BrandKit): string {
  const { identity, colors } = kit;
  const lines: string[] = [];

  lines.push(`BRAND: ${identity.name}${identity.tagline ? ` — ${identity.tagline}` : ''}`);
  if (identity.mission) lines.push(`MISSION: ${identity.mission}`);
  if (identity.positioning) lines.push(`POSITIONING: ${identity.positioning}`);
  lines.push('');
  lines.push('COLOR PALETTE:');
  lines.push(`- Primary: ${colors.primary.hex} ${colors.primary.name}`);
  lines.push(`- Secondary: ${colors.secondary.hex} ${colors.secondary.name}`);
  lines.push(`- Accent: ${colors.accent.hex} ${colors.accent.name}`);
  lines.push(`- Background: ${colors.surfaces.background}`);
  lines.push(`- Foreground: ${colors.surfaces.foreground}`);
  lines.push('');
  if (identity.personality.length) {
    lines.push(`PERSONALITY: ${identity.personality.join(', ')}`);
  }
  lines.push('');
  lines.push('CRITICAL:');
  lines.push('- NO text, words, letters, or typography in AI-generated images');
  lines.push('- Typography will be composited separately');

  return lines.join('\n');
}
