/**
 * Spacing & Layout Schema
 *
 * Defines spacing scales, border radii, and layout constraints.
 * These are the spatial building blocks — they apply to every
 * output format (web, print, presentations).
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Spacing Scale
// ---------------------------------------------------------------------------

/**
 * Spacing uses a named step system, not arbitrary values.
 * Each step maps to a rem value. The scale is enforced —
 * components should only use these values.
 */
export const SpacingScale = z.object({
  /** 4px */
  '1': z.number().positive().default(0.25),
  /** 8px */
  '2': z.number().positive().default(0.5),
  /** 12px */
  '3': z.number().positive().default(0.75),
  /** 16px */
  '4': z.number().positive().default(1),
  /** 24px */
  '6': z.number().positive().default(1.5),
  /** 32px */
  '8': z.number().positive().default(2),
  /** 48px */
  '12': z.number().positive().default(3),
  /** 64px */
  '16': z.number().positive().default(4),
  /** 96px */
  '24': z.number().positive().default(6),
});
export type SpacingScale = z.infer<typeof SpacingScale>;

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------

export const RadiusScale = z.object({
  none: z.literal(0).default(0),
  sm: z.number().min(0).default(0.125),
  md: z.number().min(0).default(0.375),
  lg: z.number().min(0).default(0.5),
  xl: z.number().min(0).default(0.75),
  '2xl': z.number().min(0).default(1),
  full: z.literal(9999).default(9999),
});
export type RadiusScale = z.infer<typeof RadiusScale>;

// ---------------------------------------------------------------------------
// Layout Constraints
// ---------------------------------------------------------------------------

export const LayoutConstraints = z.object({
  /** Maximum content width in rem */
  maxContentWidth: z.number().positive().default(80),
  /** Responsive breakpoints in px */
  breakpoints: z.object({
    sm: z.number().positive().default(640),
    md: z.number().positive().default(768),
    lg: z.number().positive().default(1024),
    xl: z.number().positive().default(1280),
    '2xl': z.number().positive().default(1536),
  }),
  /** Section vertical padding step (references SpacingScale key) */
  sectionPadding: z.string().default('24'),
  /** Default container horizontal padding step */
  containerPadding: z.string().default('6'),
});
export type LayoutConstraints = z.infer<typeof LayoutConstraints>;
