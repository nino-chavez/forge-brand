/**
 * Decisions Schema — Durable Creative State
 *
 * The brand kit records what a brand *is*. This records how it got there,
 * and what it must never become again.
 *
 * Without this, every session rediscovers the same rejections. "Looks like
 * Facebook" is feedback the first time and wasted work every time after,
 * because nothing durable captured it. Rejection constraints are the fix:
 * a rejection recorded once is enforced mechanically forever.
 *
 * Four things live here:
 * 1. Constitution     — the real brief, reconciled once
 * 2. Gates + ledger   — ordered decision points; only a recorded human
 *                       decision advances one. Agent enthusiasm does not.
 * 3. Rubric           — evaluation criteria, agreed BEFORE generation
 * 4. Rejections       — durable "never again" constraints, enforced by the
 *                       decisions review gate against live candidates
 *
 * This is contract data, same class as the kit itself — not a fifth module
 * category. Extractors/generators/review gates/exporters all read it.
 */

import { z } from 'zod';
import { AssetRef } from './media.js';

// ---------------------------------------------------------------------------
// Constitution — the reconciled brief
// ---------------------------------------------------------------------------

/**
 * Deliberately thin. Name, audience, personality, and positioning already live
 * in `identity` — duplicating them here creates two sources of truth. This
 * captures only what identity cannot: the brief in prose, what is out of
 * scope, and what has already been settled.
 */
export const Constitution = z.object({
  /** The actual brief, in prose. What this identity has to accomplish. */
  brief: z.string().min(1),
  /** Explicit non-goals — directions ruled out before work started */
  nonGoals: z.array(z.string()).default([]),
  /** Decisions carried in from before the ledger existed */
  priorApprovals: z.array(z.string()).default([]),
  /** Where the brief came from (site audit, prior session, stakeholder call) */
  sources: z.array(z.string()).default([]),
});
export type Constitution = z.infer<typeof Constitution>;

// ---------------------------------------------------------------------------
// Gates — ordered decision points
// ---------------------------------------------------------------------------

export const GateDefinition = z.object({
  /** Stable identifier, e.g. "territory", "wordmark", "symbol" */
  id: z.string().min(1),
  /** Human-readable name */
  name: z.string().min(1),
  /** The question this gate answers */
  question: z.string().optional(),
  /** Gate ids that must be approved before this one can be */
  requires: z.array(z.string()).default([]),
});
export type GateDefinition = z.infer<typeof GateDefinition>;

// ---------------------------------------------------------------------------
// Rubric — evaluation criteria, agreed before generation
// ---------------------------------------------------------------------------

export const RubricCriterion = z.object({
  id: z.string().min(1),
  /** e.g. "Legible at favicon size", "Independent of the wordmark" */
  criterion: z.string().min(1),
  description: z.string().optional(),
  /** Relative importance, 1-5 */
  weight: z.number().int().min(1).max(5).default(3),
  /** Gate ids this criterion applies to. Empty means all gates. */
  gates: z.array(z.string()).default([]),
});
export type RubricCriterion = z.infer<typeof RubricCriterion>;

// ---------------------------------------------------------------------------
// Rejection constraints — durable "never again"
// ---------------------------------------------------------------------------

/**
 * Mirrors VoiceAntiPattern deliberately: same dual-rail idea, applied to
 * visual candidates instead of prose. A constraint recorded here is matched
 * against every live candidate's descriptor by the decisions review gate.
 */
export const RejectionConstraint = z.object({
  id: z.string().min(1),
  /** Why this was rejected — the durable rationale */
  reason: z.string().min(1),
  /**
   * Regex or literal strings matched against a candidate's descriptor.
   * Invalid regex falls back to case-insensitive substring match.
   */
  patterns: z.array(z.string()).min(1),
  severity: z.enum(['error', 'warning']).default('error'),
  /** What to do instead */
  suggestion: z.string().optional(),
  /** ISO 8601 date the rejection was recorded */
  recorded: z.string().optional(),
});
export type RejectionConstraint = z.infer<typeof RejectionConstraint>;

// ---------------------------------------------------------------------------
// Candidates
// ---------------------------------------------------------------------------

export const CandidateStatus = z.enum([
  'candidate',
  'rejected',
  'approved',
  'superseded',
]);
export type CandidateStatus = z.infer<typeof CandidateStatus>;

export const GenerationMethod = z.enum([
  'ai-image',
  'ai-vector',
  'type-setting',
  'hand-vector',
  'trace',
  'other',
]);
export type GenerationMethod = z.infer<typeof GenerationMethod>;

export const Candidate = z.object({
  /** Neutral id — used for blind presentation, e.g. "C-014" */
  id: z.string().min(1),
  /** Gate this candidate competes at */
  gate: z.string().min(1),
  /** Round number within the gate */
  round: z.number().int().min(1).default(1),
  /**
   * Plain-language description of what this candidate IS. This is the text
   * rejection constraints match against, so describe the mechanics —
   * "filmstrip perforations forming the d bowl" — not the vibe.
   */
  descriptor: z.string().min(1),
  method: GenerationMethod,
  /** Candidate id this was derived from */
  parent: z.string().optional(),
  /** The rendered artifact */
  asset: AssetRef.optional(),
  status: CandidateStatus.default('candidate'),
  notes: z.string().optional(),
});
export type Candidate = z.infer<typeof Candidate>;

// ---------------------------------------------------------------------------
// Decision ledger
// ---------------------------------------------------------------------------

/**
 * A gate advances only when an entry lands here. Nothing an agent writes
 * about a candidate being "promising" moves anything.
 */
export const DecisionEntry = z.object({
  gate: z.string().min(1),
  decision: z.enum(['approved', 'rejected', 'deferred']),
  /** Candidate ids this decision applies to */
  candidates: z.array(z.string()).default([]),
  /** Why. Required — an unexplained approval is not a decision. */
  rationale: z.string().min(1),
  /** Who decided. The human, not the agent. */
  decidedBy: z.string().min(1),
  /** ISO 8601 date */
  date: z.string().optional(),
});
export type DecisionEntry = z.infer<typeof DecisionEntry>;

// ---------------------------------------------------------------------------
// Full Decision System
// ---------------------------------------------------------------------------

export const DecisionSystem = z.object({
  constitution: Constitution.optional(),
  gates: z.array(GateDefinition).default([]),
  rubric: z.array(RubricCriterion).default([]),
  rejections: z.array(RejectionConstraint).default([]),
  candidates: z.array(Candidate).default([]),
  ledger: z.array(DecisionEntry).default([]),
});
export type DecisionSystem = z.infer<typeof DecisionSystem>;
