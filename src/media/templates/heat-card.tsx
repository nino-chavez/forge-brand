/**
 * Heat Card Template
 *
 * Let's Pepper brand-specific: tournament heat level announcement card.
 * Shows the pepper variety, heat level indicator, and tournament details.
 * 1080x1080 (Instagram post) or 1080x1920 (story).
 */

import type { BrandKit } from '../../core/schema/brand-kit.js';

export interface HeatCardData {
  /** Pepper variety name (e.g. "Jalapeño", "Ghost Pepper") */
  variety: string;
  /** Heat level 1-5 */
  heatLevel: number;
  /** Tournament name */
  tournamentName: string;
  /** Date */
  date?: string;
  /** Format (e.g. "3v3 Grass") */
  format?: string;
  /** Short description */
  tagline?: string;
}

/** Heat level colors — from mild to extreme */
const HEAT_COLORS = [
  '#4CAF50',  // Bell Pepper green (mild)
  '#F5B91A',  // Yellow (warm)
  '#FF8C00',  // Orange (medium)
  '#E64A19',  // Red-orange (hot)
  '#C62828',  // Deep red (extreme)
];

export function HeatCard(kit: BrandKit, data: HeatCardData) {
  const { colors, typography, identity } = kit;
  const heatColor = HEAT_COLORS[Math.min(Math.max(data.heatLevel - 1, 0), 4)];

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
      {/* Top accent bar in heat color */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '8px',
          backgroundColor: heatColor,
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            display: 'flex',
            fontSize: '18px',
            fontFamily: typography.mono.family,
            color: colors.surfaces.mutedForeground,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
          }}
        >
          {identity.name}
        </div>

        {/* Heat level dots */}
        <div style={{ display: 'flex' }}>
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              style={{
                display: 'flex',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: level <= data.heatLevel ? heatColor : colors.surfaces.border,
                marginLeft: level > 1 ? '8px' : '0',
              }}
            />
          ))}
        </div>
      </div>

      {/* Center — variety name + tournament */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Variety label */}
        <div
          style={{
            display: 'flex',
            fontSize: '16px',
            fontFamily: typography.mono.family,
            color: heatColor,
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            marginBottom: '16px',
          }}
        >
          {data.variety}
        </div>

        {/* Tournament name */}
        <div
          style={{
            display: 'flex',
            fontSize: '72px',
            fontFamily: typography.display.family,
            fontWeight: 700,
            color: colors.surfaces.foreground,
            lineHeight: 1.0,
            marginBottom: '20px',
            ...(typography.display.textTransform === 'uppercase'
              ? { textTransform: 'uppercase' as const }
              : {}),
          }}
        >
          {data.tournamentName}
        </div>

        {/* Divider in heat color */}
        <div
          style={{
            display: 'flex',
            width: '100px',
            height: '4px',
            backgroundColor: heatColor,
            marginBottom: '20px',
          }}
        />

        {data.tagline && (
          <div
            style={{
              display: 'flex',
              fontSize: '22px',
              fontFamily: typography.body.family,
              color: colors.surfaces.mutedForeground,
            }}
          >
            {data.tagline}
          </div>
        )}
      </div>

      {/* Bottom — details */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {data.format && (
          <div
            style={{
              display: 'flex',
              fontSize: '18px',
              fontFamily: typography.body.family,
              color: colors.surfaces.foreground,
              fontWeight: 600,
            }}
          >
            {data.format}
          </div>
        )}
        {data.date && (
          <div
            style={{
              display: 'flex',
              fontSize: '18px',
              fontFamily: typography.body.family,
              color: heatColor,
              fontWeight: 600,
            }}
          >
            {data.date}
          </div>
        )}
      </div>
    </div>
  );
}
