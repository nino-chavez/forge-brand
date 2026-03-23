/**
 * Prescription Label Template
 *
 * Volley Rx brand-specific: vintage pharmaceutical label for tournament announcements.
 * 1080x1080 (digital) or 2550x3300 (print).
 * Ornamental borders, Rx symbol, dosage metaphor.
 */

import type { BrandKit } from '../../core/schema/brand-kit.js';

export interface PrescriptionLabelData {
  /** Tournament name / "prescription name" */
  rxName: string;
  /** Format (e.g. "Coed 4s", "Men's 6s") */
  format: string;
  /** Date */
  date: string;
  /** Location */
  location: string;
  /** Price per team */
  price?: string;
  /** "Dosage" — tournament structure */
  dosage?: string;
  /** "Side effects" — fun tagline */
  sideEffects?: string;
  /** Rx number (e.g. "RX-2026-001") */
  rxNumber?: string;
}

export function PrescriptionLabel(kit: BrandKit, data: PrescriptionLabelData) {
  const { colors, typography, identity } = kit;
  const primary = colors.primary.hex;
  const fg = colors.surfaces.foreground;
  const bg = colors.surfaces.background;
  const muted = colors.surfaces.mutedForeground;
  const border = colors.surfaces.border;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: bg,
        padding: '60px',
        fontFamily: typography.body.family,
      }}
    >
      {/* Outer ornamental border */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          border: `3px solid ${primary}`,
          padding: '8px',
        }}
      >
        {/* Inner border */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            border: `1px solid ${primary}`,
            padding: '40px',
          }}
        >
          {/* Header: brand + Rx number */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  fontSize: '16px',
                  fontFamily: typography.mono.family,
                  color: muted,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase' as const,
                }}
              >
                {identity.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: '14px',
                  fontFamily: typography.mono.family,
                  color: muted,
                  letterSpacing: '0.1em',
                  marginTop: '4px',
                }}
              >
                {data.rxNumber || 'RX-2026-001'}
              </div>
            </div>

            {/* Rx symbol */}
            <div
              style={{
                display: 'flex',
                fontSize: '48px',
                fontFamily: typography.display.family,
                color: primary,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              Rx
            </div>
          </div>

          {/* Center: prescription name (the hero) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Format tag */}
            <div
              style={{
                display: 'flex',
                fontSize: '14px',
                fontFamily: typography.mono.family,
                color: primary,
                letterSpacing: '0.2em',
                textTransform: 'uppercase' as const,
                marginBottom: '16px',
              }}
            >
              {data.format}
            </div>

            {/* Rx name */}
            <div
              style={{
                display: 'flex',
                fontSize: '64px',
                fontFamily: typography.display.family,
                fontWeight: 700,
                color: fg,
                lineHeight: 1.1,
                textAlign: 'center',
              }}
            >
              {data.rxName}
            </div>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                width: '160px',
                height: '2px',
                backgroundColor: primary,
                marginTop: '24px',
                marginBottom: '24px',
              }}
            />

            {/* Dosage */}
            {data.dosage && (
              <div
                style={{
                  display: 'flex',
                  fontSize: '18px',
                  fontFamily: typography.body.family,
                  color: muted,
                  textAlign: 'center',
                }}
              >
                Dosage: {data.dosage}
              </div>
            )}
          </div>

          {/* Bottom: details */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Date + Location row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    display: 'flex',
                    fontSize: '11px',
                    fontFamily: typography.mono.family,
                    color: primary,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase' as const,
                    marginBottom: '4px',
                  }}
                >
                  DISPENSED
                </div>
                <div style={{ display: 'flex', fontSize: '18px', color: fg, fontWeight: 600 }}>
                  {data.date}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div
                  style={{
                    display: 'flex',
                    fontSize: '11px',
                    fontFamily: typography.mono.family,
                    color: primary,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase' as const,
                    marginBottom: '4px',
                  }}
                >
                  LOCATION
                </div>
                <div style={{ display: 'flex', fontSize: '18px', color: fg }}>
                  {data.location}
                </div>
              </div>
            </div>

            {/* Price */}
            {data.price && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: '11px',
                      fontFamily: typography.mono.family,
                      color: primary,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase' as const,
                      marginBottom: '4px',
                    }}
                  >
                    COPAY
                  </div>
                  <div style={{ display: 'flex', fontSize: '18px', color: fg, fontWeight: 600 }}>
                    {data.price}
                  </div>
                </div>
              </div>
            )}

            {/* Side effects warning */}
            {data.sideEffects && (
              <div
                style={{
                  display: 'flex',
                  fontSize: '13px',
                  fontFamily: typography.body.family,
                  color: muted,
                  fontStyle: 'italic',
                  borderTop: `1px solid ${border}`,
                  paddingTop: '12px',
                }}
              >
                Warning: {data.sideEffects}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
