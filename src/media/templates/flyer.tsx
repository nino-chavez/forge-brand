/**
 * Flyer Template
 *
 * Event flyer for print or digital.
 * Supports both Letter Portrait (2550x3300 @ 300dpi) and Square Digital (1080x1080).
 * Layout adapts to aspect ratio.
 */

import type { BrandKit } from '../../core/schema/brand-kit.js';

export interface FlyerData {
  eventName: string;
  date: string;
  location: string;
  price?: string;
  tagline?: string;
}

export function Flyer(kit: BrandKit, data: FlyerData) {
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
        padding: '80px',
        fontFamily: typography.body.family,
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '10px',
          backgroundColor: colors.primary.hex,
        }}
      />

      {/* Header — brand + tagline */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontSize: '24px',
            fontFamily: typography.mono.family,
            color: colors.surfaces.mutedForeground,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            marginBottom: '16px',
          }}
        >
          {identity.name}
        </div>
        {data.tagline && (
          <div
            style={{
              display: 'flex',
              fontSize: '28px',
              fontFamily: typography.body.family,
              color: colors.surfaces.mutedForeground,
              fontStyle: 'italic',
            }}
          >
            {data.tagline}
          </div>
        )}
      </div>

      {/* Center — event name (the hero) */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontSize: '96px',
            fontFamily: typography.display.family,
            fontWeight: 700,
            color: colors.surfaces.foreground,
            lineHeight: 1.0,
            marginBottom: '24px',
            ...(typography.display.textTransform === 'uppercase'
              ? { textTransform: 'uppercase' as const }
              : {}),
          }}
        >
          {data.eventName}
        </div>

        {/* Accent divider */}
        <div
          style={{
            display: 'flex',
            width: '120px',
            height: '6px',
            backgroundColor: colors.primary.hex,
            marginBottom: '32px',
          }}
        />
      </div>

      {/* Bottom — details grid */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Date */}
        <div style={{ display: 'flex', marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              fontSize: '14px',
              fontFamily: typography.mono.family,
              color: colors.primary.hex,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              width: '120px',
            }}
          >
            DATE
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '24px',
              fontFamily: typography.body.family,
              color: colors.surfaces.foreground,
              fontWeight: 600,
            }}
          >
            {data.date}
          </div>
        </div>

        {/* Location */}
        <div style={{ display: 'flex', marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              fontSize: '14px',
              fontFamily: typography.mono.family,
              color: colors.primary.hex,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              width: '120px',
            }}
          >
            WHERE
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '24px',
              fontFamily: typography.body.family,
              color: colors.surfaces.foreground,
            }}
          >
            {data.location}
          </div>
        </div>

        {/* Price (optional) */}
        {data.price && (
          <div style={{ display: 'flex' }}>
            <div
              style={{
                display: 'flex',
                fontSize: '14px',
                fontFamily: typography.mono.family,
                color: colors.primary.hex,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                width: '120px',
              }}
            >
              PRICE
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '24px',
                fontFamily: typography.body.family,
                color: colors.surfaces.foreground,
                fontWeight: 600,
              }}
            >
              {data.price}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
