/**
 * Media Schema
 *
 * Defines asset references, media templates, and image generation context.
 * This is where image-gen's style systems and conceptMaps get formalized.
 *
 * Two kinds of media:
 * 1. Templated — deterministic HTML→SVG→PNG via Satori (social cards, flyers, etc.)
 * 2. Creative — AI-generated via image models (logos, illustrations, hero images)
 *
 * Templated media is parameterized by the brand kit. No AI hallucination on layout.
 * Creative media uses the brand kit as prompt context. Human approves before locking.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Asset References
// ---------------------------------------------------------------------------

export const AssetRef = z.object({
  /** Unique identifier for this asset */
  id: z.string().min(1),
  /** Human-readable label */
  label: z.string(),
  /** File path relative to brand kit root, or URL */
  path: z.string(),
  /** MIME type */
  mimeType: z.string().optional(),
  /** Dimensions if known */
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  /** Tags for filtering */
  tags: z.array(z.string()).default([]),
});
export type AssetRef = z.infer<typeof AssetRef>;

// ---------------------------------------------------------------------------
// Logo System
// ---------------------------------------------------------------------------

export const LogoSystem = z.object({
  /** Primary logo (full lockup) */
  primary: AssetRef.optional(),
  /** Icon/mark only */
  icon: AssetRef.optional(),
  /** Wordmark only */
  wordmark: AssetRef.optional(),
  /** Additional variations (dark bg, light bg, monochrome, etc.) */
  variations: z.array(AssetRef).default([]),
  /** Minimum clear space (relative to logo height, e.g. 0.25 = 25%) */
  clearSpace: z.number().min(0).max(1).default(0.25),
  /** Minimum display size in pixels */
  minSizePx: z.number().positive().default(24),
});
export type LogoSystem = z.infer<typeof LogoSystem>;

// ---------------------------------------------------------------------------
// Media Templates (Satori-based, deterministic)
// ---------------------------------------------------------------------------

export const MediaTemplateSize = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  /** DPI for print output (72 for web, 300 for print) */
  dpi: z.number().positive().default(72),
  label: z.string().optional().describe('e.g. "Instagram Story", "A4 Portrait"'),
});
export type MediaTemplateSize = z.infer<typeof MediaTemplateSize>;

export const MediaTemplate = z.object({
  /** Template identifier — maps to a Satori JSX template file */
  id: z.string().min(1),
  /** Human-readable name */
  name: z.string(),
  /** What this template produces */
  description: z.string(),
  /** Output size(s) this template supports */
  sizes: z.array(MediaTemplateSize).min(1),
  /** Output format */
  format: z.enum(['png', 'svg', 'pdf', 'webp']).default('png'),
  /** Required data fields the template expects */
  dataFields: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(['string', 'number', 'boolean', 'image-url']),
        required: z.boolean().default(true),
        description: z.string().optional(),
      }),
    )
    .default([]),
});
export type MediaTemplate = z.infer<typeof MediaTemplate>;

// ---------------------------------------------------------------------------
// Creative Context (for AI image generation)
// ---------------------------------------------------------------------------

export const CreativeContext = z.object({
  /** Base prompt that seeds all image generation for this brand */
  basePrompt: z.string().describe('Brand identity context for image models'),

  /** Concept map — keywords to visual descriptions (from image-gen style systems) */
  conceptMap: z.record(z.string(), z.string()).default({}),

  /** Format modifiers — output size/context presets */
  formatModifiers: z.record(z.string(), z.string()).default({}),

  /** Visual language keywords */
  visualKeywords: z.array(z.string()).default([]),

  /** Things to never include in generated images */
  avoid: z.array(z.string()).default([]),
});
export type CreativeContext = z.infer<typeof CreativeContext>;

// ---------------------------------------------------------------------------
// Full Media System
// ---------------------------------------------------------------------------

export const MediaSystem = z.object({
  logos: LogoSystem,
  templates: z.array(MediaTemplate).default([]),
  creative: CreativeContext.optional(),
  assets: z.array(AssetRef).default([]),
});
export type MediaSystem = z.infer<typeof MediaSystem>;
