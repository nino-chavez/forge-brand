/**
 * Story Template
 *
 * Instagram/TikTok story format. 1080x1920 default.
 * Vertical layout — brand bar at top, content at bottom third.
 */

import type { BrandKit } from '../../core/schema/brand-kit.js';

export interface StoryData {
  title: string;
  date?: string;
  location?: string;
}

export function Story(kit: BrandKit, data: StoryData) {
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
        padding: '80px 60px',
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
          height: '8px',
          backgroundColor: colors.primary.hex,
        }}
      />

      {/* Top section — brand name + optional date/location */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontSize: '20px',
            fontFamily: typography.mono.family,
            color: colors.surfaces.mutedForeground,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            marginBottom: '24px',
          }}
        >
          {identity.name}
        </div>

        {(data.date || data.location) && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data.date && (
              <div
                style={{
                  display: 'flex',
                  fontSize: '28px',
                  fontFamily: typography.body.family,
                  color: colors.primary.hex,
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                {data.date}
              </div>
            )}
            {data.location && (
              <div
                style={{
                  display: 'flex',
                  fontSize: '22px',
                  fontFamily: typography.body.family,
                  color: colors.surfaces.mutedForeground,
                }}
              >
                {data.location}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom section — title */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontSize: '72px',
            fontFamily: typography.display.family,
            fontWeight: 700,
            color: colors.surfaces.foreground,
            lineHeight: 1.05,
            ...(typography.display.textTransform === 'uppercase'
              ? { textTransform: 'uppercase' as const }
              : {}),
          }}
        >
          {data.title}
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            display: 'flex',
            width: '80px',
            height: '4px',
            backgroundColor: colors.primary.hex,
            marginTop: '32px',
          }}
        />
      </div>
    </div>
  );
}
