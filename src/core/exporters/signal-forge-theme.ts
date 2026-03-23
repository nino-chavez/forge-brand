/**
 * Signal Forge Theme Bridge
 *
 * Pure function: BrandKit → PresentationTheme (signal-forge format).
 * This bridges brand-forge's schema to signal-forge's theme system.
 *
 * signal-forge uses 6-char hex WITHOUT '#' prefix (PptxGenJS convention).
 */

import type { BrandKit } from '../schema/brand-kit.js';

/** Strip '#' from hex color for PptxGenJS */
function strip(hex: string): string {
  return hex.replace('#', '');
}

/**
 * Export a brand kit as a signal-forge PresentationTheme object (as JSON string).
 */
export function exportSignalForgeTheme(kit: BrandKit): string {
  const { colors, typography, identity } = kit;

  const theme = {
    id: kit.meta.id,
    name: identity.name,
    description: identity.tagline || identity.mission || `${identity.name} presentation theme`,
    dimensions: {
      width: 13.33,
      height: 7.5,
    },
    colors: {
      primary: strip(colors.primary.hex),
      secondary: strip(colors.secondary.hex),
      dark: strip(colors.surfaces.background),
      light: strip(colors.surfaces.card),
      highlight: strip(colors.accent.hex),
      textPrimary: strip(colors.surfaces.foreground),
      textSecondary: strip(colors.surfaces.cardForeground),
      textBody: strip(colors.surfaces.foreground),
      textMuted: strip(colors.surfaces.mutedForeground),
      textInverse: strip(colors.surfaces.background),
      backgroundWhite: strip(colors.neutral['50']),
      backgroundLight: strip(colors.neutral['100']),
      backgroundAccent: strip(colors.primary.hex),
      backgroundDark: strip(colors.surfaces.background),
      tableHeaderBg: strip(colors.primary.hex),
      tableHeaderText: strip(colors.surfaces.background),
      tableStripeBg: strip(colors.neutral['100']),
      tableBorderColor: strip(colors.surfaces.border),
      success: strip(colors.semantic.success.hex),
      warning: strip(colors.semantic.warning.hex),
      error: strip(colors.semantic.error.hex),
    },
    typography: {
      fontPrimary: typography.display.family,
      fontSecondary: typography.body.family,
      fontBold: `${typography.body.family} Bold`,
      sizes: {
        hero: 44,
        slideTitle: 28,
        sectionTitle: 36,
        subtitle: 18,
        body: 14,
        small: 11,
        footer: 8,
      },
    },
    spacing: {
      marginLeft: 0.75,
      marginRight: 0.75,
      marginTop: 0.75,
      marginBottom: 0.5,
      contentWidth: 11.83,
      contentGap: 0.25,
      columnGutter: 0.4,
    },
    shapes: {
      showAccentLine: true,
      accentLineHeight: 0.04,
      showTitleDivider: false,
      titleDividerHeight: 0.02,
      pillRadius: 0.1,
    },
    footer: {
      template: `${identity.name} | Confidential`,
      showSlideNumbers: true,
    },
  };

  return JSON.stringify(theme, null, 2);
}
