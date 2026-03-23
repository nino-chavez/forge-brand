/**
 * Favicon Template
 *
 * Generates a simple branded favicon — primary color background
 * with the first letter of the brand name.
 * Renders at multiple sizes: 16, 32, 180 (apple-touch), 512 (PWA).
 */

import type { BrandKit } from '../../core/schema/brand-kit.js';

export interface FaviconData {
  /** Override the letter shown (defaults to first letter of brand name) */
  letter?: string;
}

export function Favicon(kit: BrandKit, data: FaviconData) {
  const { colors, typography, identity } = kit;
  const letter = data.letter || identity.name.charAt(0).toUpperCase();

  // For the favicon, we invert the typical relationship:
  // primary color as background, contrasting text on top.
  // Use background color (usually black/white) as the text color
  // since it has the highest contrast against the primary.
  const bgColor = colors.primary.hex;
  const textColor = colors.surfaces.background;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: bgColor,
        borderRadius: '20%',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: '320px',
          fontFamily: typography.display.family,
          fontWeight: 700,
          color: textColor,
          lineHeight: 1,
          ...(typography.display.textTransform === 'uppercase'
            ? { textTransform: 'uppercase' as const }
            : {}),
        }}
      >
        {letter}
      </div>
    </div>
  );
}
