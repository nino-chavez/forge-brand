/**
 * Brand Kit Schema — The Contract
 *
 * This is the single source of truth for a brand's identity.
 * Every generator reads from it, every exporter serializes from it.
 * Nothing gets generated "freehand".
 *
 * Consumers:
 * - brand-forge exporters → CSS tokens, Tailwind presets, DESIGN-SYSTEM.md
 * - brand-forge media     → Satori templates, AI image prompts
 * - signal-forge          → PresentationTheme, VoiceRules
 * - image-gen             → style systems, basePrompt, conceptMap
 */

import { z } from 'zod';
import { ColorSystem } from './color.js';
import { TypographySystem } from './typography.js';
import { VoiceSystem } from './voice.js';
import { MediaSystem } from './media.js';
import { SpacingScale, RadiusScale, LayoutConstraints } from './spacing.js';
import { DecisionSystem } from './decisions.js';

// ---------------------------------------------------------------------------
// Brand Identity (non-visual)
// ---------------------------------------------------------------------------

export const BrandIdentity = z.object({
  /** Brand/project name */
  name: z.string().min(1),
  /** Short tagline */
  tagline: z.string().optional(),
  /** Mission statement — why this brand exists */
  mission: z.string().optional(),
  /** Target audience segments */
  audience: z.array(z.string()).default([]),
  /** Brand personality traits (used to seed AI generators) */
  personality: z.array(z.string()).default([]),
  /** Positioning statement */
  positioning: z.string().optional(),
  /** Industry/domain */
  domain: z.string().optional(),
  /** Contact/social links */
  links: z.record(z.string(), z.string()).default({}),
});
export type BrandIdentity = z.infer<typeof BrandIdentity>;

// ---------------------------------------------------------------------------
// Brand Kit Meta
// ---------------------------------------------------------------------------

export const BrandKitMeta = z.object({
  /** Schema version — used for migration detection */
  schemaVersion: z.literal(1),
  /** Unique kit identifier */
  id: z.string().min(1),
  /** When this kit was created (ISO 8601) */
  created: z.string().datetime(),
  /** When this kit was last modified (ISO 8601) */
  updated: z.string().datetime(),
  /** Author */
  author: z.string().optional(),
  /** Kit version (semver) */
  version: z.string().default('0.1.0'),
});
export type BrandKitMeta = z.infer<typeof BrandKitMeta>;

// ---------------------------------------------------------------------------
// Theme Mode
// ---------------------------------------------------------------------------

export const ThemeMode = z.enum(['light', 'dark']);
export type ThemeMode = z.infer<typeof ThemeMode>;

// ---------------------------------------------------------------------------
// Full Brand Kit
// ---------------------------------------------------------------------------

export const BrandKit = z.object({
  meta: BrandKitMeta,
  identity: BrandIdentity,
  colors: ColorSystem,
  typography: TypographySystem,
  spacing: SpacingScale,
  radius: RadiusScale,
  layout: LayoutConstraints,
  voice: VoiceSystem,
  media: MediaSystem,
  /** Default theme mode for this brand */
  defaultMode: ThemeMode.default('dark'),
  /**
   * How the brand got here — constitution, gates, rubric, rejections, ledger.
   * Optional: kits authored before this section existed still parse. Present
   * on any kit whose identity is being actively developed rather than
   * imported wholesale.
   */
  decisions: DecisionSystem.optional(),
});
export type BrandKit = z.infer<typeof BrandKit>;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a brand kit JSON object. Returns the parsed kit or throws ZodError.
 */
export function parseBrandKit(data: unknown): BrandKit {
  return BrandKit.parse(data);
}

/**
 * Safe parse — returns { success, data?, error? } instead of throwing.
 */
export function safeParseBrandKit(data: unknown) {
  return BrandKit.safeParse(data);
}
