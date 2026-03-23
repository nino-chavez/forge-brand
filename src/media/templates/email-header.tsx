/**
 * Email Header Template
 *
 * Horizontal banner for email headers / newsletter headers.
 * 600x200 default (standard email width).
 * Simple: brand name, accent bar, optional subtitle.
 */

import type { BrandKit } from '../../core/schema/brand-kit.js';

export interface EmailHeaderData {
  /** Override title (defaults to brand name) */
  title?: string;
  subtitle?: string;
}

export function EmailHeader(kit: BrandKit, data: EmailHeaderData) {
  const { colors, typography, identity } = kit;
  const title = data.title || identity.name;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        backgroundColor: colors.surfaces.background,
        padding: '0 40px',
        fontFamily: typography.body.family,
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '6px',
          backgroundColor: colors.primary.hex,
        }}
      />

      {/* Brand name */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontSize: '32px',
            fontFamily: typography.display.family,
            fontWeight: 700,
            color: colors.surfaces.foreground,
            lineHeight: 1.2,
            ...(typography.display.textTransform === 'uppercase'
              ? { textTransform: 'uppercase' as const }
              : {}),
          }}
        >
          {title}
        </div>
        {data.subtitle && (
          <div
            style={{
              display: 'flex',
              fontSize: '14px',
              fontFamily: typography.body.family,
              color: colors.surfaces.mutedForeground,
              marginTop: '4px',
            }}
          >
            {data.subtitle}
          </div>
        )}
      </div>

      {/* Right accent dot */}
      <div
        style={{
          display: 'flex',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: colors.primary.hex,
        }}
      />
    </div>
  );
}
