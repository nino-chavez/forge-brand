/**
 * Business Card Template
 *
 * Standard 3.5x2" at 300dpi = 1050x600px.
 * Brand accent bar left edge, name/title top, contact details bottom.
 */

import type { BrandKit } from '../../core/schema/brand-kit.js';

export interface BusinessCardData {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  website?: string;
}

export function BusinessCard(kit: BrandKit, data: BusinessCardData) {
  const { colors, typography, identity } = kit;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        backgroundColor: colors.surfaces.background,
        padding: '48px 48px 48px 60px',
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
          width: '8px',
          backgroundColor: colors.primary.hex,
        }}
      />

      {/* Top: name + title */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontSize: '28px',
            fontFamily: typography.display.family,
            fontWeight: 700,
            color: colors.surfaces.foreground,
            lineHeight: 1.2,
            ...(typography.display.textTransform === 'uppercase'
              ? { textTransform: 'uppercase' as const }
              : {}),
          }}
        >
          {data.name}
        </div>
        {data.title && (
          <div
            style={{
              display: 'flex',
              fontSize: '13px',
              fontFamily: typography.body.family,
              color: colors.primary.hex,
              marginTop: '4px',
              fontWeight: 500,
            }}
          >
            {data.title}
          </div>
        )}
      </div>

      {/* Bottom: contact + brand */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {/* Contact details */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {data.email && (
            <div style={{ display: 'flex', fontSize: '11px', fontFamily: typography.mono.family, color: colors.surfaces.mutedForeground, marginBottom: '4px' }}>
              {data.email}
            </div>
          )}
          {data.phone && (
            <div style={{ display: 'flex', fontSize: '11px', fontFamily: typography.mono.family, color: colors.surfaces.mutedForeground, marginBottom: '4px' }}>
              {data.phone}
            </div>
          )}
          {data.website && (
            <div style={{ display: 'flex', fontSize: '11px', fontFamily: typography.mono.family, color: colors.surfaces.mutedForeground }}>
              {data.website}
            </div>
          )}
        </div>

        {/* Brand name */}
        <div
          style={{
            display: 'flex',
            fontSize: '10px',
            fontFamily: typography.mono.family,
            color: colors.surfaces.mutedForeground,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
          }}
        >
          {identity.name}
        </div>
      </div>
    </div>
  );
}
