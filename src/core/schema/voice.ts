/**
 * Voice Schema
 *
 * Adapted from signal-forge's voice system. Defines the rules that
 * constrain AI-generated content for a brand. Voice rules are enforcement
 * targets, not suggestions — generation should fail if it violates them.
 *
 * The schema captures both positive patterns (what the brand sounds like)
 * and negative patterns (what it must never sound like). This dual-rail
 * approach makes automated voice checking possible.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Voice Attributes
// ---------------------------------------------------------------------------

export const VoiceAttribute = z.object({
  trait: z.string().min(1).describe('e.g. "direct", "energetic", "technical"'),
  description: z.string().describe('What this trait means for this brand'),
  example: z.string().optional().describe('Example sentence demonstrating this trait'),
});
export type VoiceAttribute = z.infer<typeof VoiceAttribute>;

// ---------------------------------------------------------------------------
// Anti-patterns (things the brand must never do)
// ---------------------------------------------------------------------------

export const VoiceAntiPattern = z.object({
  category: z.string().describe('e.g. "corporate-jargon", "academic-distance"'),
  patterns: z.array(z.string()).min(1).describe('Regex or literal strings to detect'),
  severity: z.enum(['error', 'warning']).default('warning'),
  suggestion: z.string().optional().describe('What to do instead'),
});
export type VoiceAntiPattern = z.infer<typeof VoiceAntiPattern>;

// ---------------------------------------------------------------------------
// Structural Patterns
// ---------------------------------------------------------------------------

export const StructuralPattern = z.object({
  name: z.string().describe('e.g. "question-first-opening"'),
  description: z.string(),
  required: z.boolean().default(false).describe('Must this pattern appear?'),
  example: z.string().optional(),
});
export type StructuralPattern = z.infer<typeof StructuralPattern>;

// ---------------------------------------------------------------------------
// Full Voice System
// ---------------------------------------------------------------------------

export const VoiceSystem = z.object({
  /** Core tonal attributes */
  attributes: z.array(VoiceAttribute).min(1),

  /** Things to avoid — these are enforcement targets */
  antiPatterns: z.array(VoiceAntiPattern).default([]),

  /** Structural patterns the brand uses */
  structuralPatterns: z.array(StructuralPattern).default([]),

  /** Paired examples: good vs bad for the same intent */
  examples: z
    .array(
      z.object({
        intent: z.string().describe('What the writer is trying to say'),
        good: z.string().describe('How this brand says it'),
        bad: z.string().describe('How it should NOT be said'),
      }),
    )
    .default([]),

  /** Minimum voice check score (0-100) for content to pass */
  minimumScore: z.number().min(0).max(100).default(70),
});
export type VoiceSystem = z.infer<typeof VoiceSystem>;
