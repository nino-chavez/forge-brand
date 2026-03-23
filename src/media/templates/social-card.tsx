/**
 * Social Card Template
 *
 * OG image / social share card. 1200x675 default.
 * Parameterized entirely by brand kit — no hardcoded values.
 *
 * Satori JSX constraints:
 * - Only flex layout (no grid, no gap)
 * - No calc(), no position:fixed
 * - Use margin for spacing
 * - All text must have explicit font family
 */

import type { BrandKit } from '../../core/schema/brand-kit.js';

export interface SocialCardData {
  title: string;
  subtitle?: string;
}

export function SocialCard(kit: BrandKit, data: SocialCardData) {
  const { colors, typography, identity } = kit;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        width: '100%',
        height: '100%',
        backgroundColor: colors.surfaces.background,
        padding: '60px',
        fontFamily: typography.body.family,
      }}
    >
      {/* Accent bar at top */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          backgroundColor: colors.primary.hex,
        }}
      />

      {/* Brand name label */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: '40px',
          left: '60px',
          fontSize: '14px',
          fontFamily: typography.mono.family,
          color: colors.surfaces.mutedForeground,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
        }}
      >
        {identity.name}
      </div>

      {/* Title */}
      <div
        style={{
          display: 'flex',
          fontSize: '56px',
          fontFamily: typography.display.family,
          fontWeight: 700,
          color: colors.surfaces.foreground,
          lineHeight: 1.1,
          marginBottom: data.subtitle ? '16px' : '0',
          ...(typography.display.textTransform === 'uppercase'
            ? { textTransform: 'uppercase' as const }
            : {}),
        }}
      >
        {data.title}
      </div>

      {/* Subtitle */}
      {data.subtitle && (
        <div
          style={{
            display: 'flex',
            fontSize: '24px',
            fontFamily: typography.body.family,
            color: colors.surfaces.mutedForeground,
            lineHeight: 1.4,
          }}
        >
          {data.subtitle}
        </div>
      )}

      {/* Bottom accent dot */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          bottom: '40px',
          right: '60px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: colors.primary.hex,
        }}
      />
    </div>
  );
}
