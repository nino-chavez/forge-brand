/**
 * Figma Tokens Exporter
 *
 * Pure function: BrandKit → Figma Variables-compatible JSON.
 * Output format follows the Figma REST API variables structure.
 * Can be imported via Figma's "Import variables" or the Variables API.
 *
 * Groups: brand/color, brand/typography, brand/spacing, brand/radius
 */

import type { BrandKit } from '../schema/brand-kit.js';

interface FigmaVariable {
  name: string;
  type: 'COLOR' | 'FLOAT' | 'STRING';
  value: string | number;
  description?: string;
}

export function exportFigmaTokens(kit: BrandKit): string {
  const variables: FigmaVariable[] = [];

  // --- Colors ---
  variables.push(
    { name: 'brand/color/primary', type: 'COLOR', value: kit.colors.primary.hex, description: kit.colors.primary.name },
    { name: 'brand/color/secondary', type: 'COLOR', value: kit.colors.secondary.hex, description: kit.colors.secondary.name },
    { name: 'brand/color/accent', type: 'COLOR', value: kit.colors.accent.hex, description: kit.colors.accent.name },
  );

  // Neutral scale
  for (const [step, hex] of Object.entries(kit.colors.neutral)) {
    variables.push({ name: `brand/color/neutral/${step}`, type: 'COLOR', value: hex });
  }

  // Semantic
  for (const [role, token] of Object.entries(kit.colors.semantic)) {
    variables.push({ name: `brand/color/semantic/${role}`, type: 'COLOR', value: token.hex, description: token.name });
  }

  // Surfaces
  for (const [name, hex] of Object.entries(kit.colors.surfaces)) {
    const kebab = name.replace(/([A-Z])/g, '-$1').toLowerCase();
    variables.push({ name: `brand/color/surface/${kebab}`, type: 'COLOR', value: hex });
  }

  // --- Typography ---
  variables.push(
    { name: 'brand/font/display', type: 'STRING', value: kit.typography.display.family },
    { name: 'brand/font/body', type: 'STRING', value: kit.typography.body.family },
    { name: 'brand/font/mono', type: 'STRING', value: kit.typography.mono.family },
  );

  for (const step of kit.typography.scale.steps) {
    variables.push(
      { name: `brand/font-size/${step.name}`, type: 'FLOAT', value: step.sizeRem * kit.typography.scale.baseSizePx },
      { name: `brand/line-height/${step.name}`, type: 'FLOAT', value: step.lineHeight },
    );
  }

  // --- Spacing ---
  for (const [step, rem] of Object.entries(kit.spacing)) {
    variables.push({ name: `brand/spacing/${step}`, type: 'FLOAT', value: rem * 16 });
  }

  // --- Radius ---
  for (const [name, rem] of Object.entries(kit.radius)) {
    if (name === 'full') {
      variables.push({ name: 'brand/radius/full', type: 'FLOAT', value: 9999 });
    } else {
      variables.push({ name: `brand/radius/${name}`, type: 'FLOAT', value: (rem as number) * 16 });
    }
  }

  // Wrap in a Figma-compatible structure
  const output = {
    version: '1.0',
    metadata: {
      generator: 'brand-forge',
      brandName: kit.identity.name,
      brandVersion: kit.meta.version,
      generated: kit.meta.updated,
    },
    variables,
  };

  return JSON.stringify(output, null, 2);
}
