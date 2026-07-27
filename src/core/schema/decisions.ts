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
 * 2. Gates + ledger   — ordered decision points; a gate advances only on a
 *                       ledger entry with a rationale and an author. Soft
 *                       control, not a hard one: it makes approval explicit
 *                       and diff-able so review can catch what it can't.
 * 3. Rubric           — evaluation criteria, agreed BEFORE generation
 * 4. Rejections       — durable "never again" constraints, enforced by the
 *                       decisions review gate against live candidates
 *
 * This is contract data, same class as the kit itself — not a fifth module
 * category. Extractors/generators/review gates/exporters all read it.
 */

import { z } from 'zod';
import { AssetRef } from './media.js';

/**
 * `YYYY-MM-DD`, optionally with a time part.
 *
 * Validated at the boundary because these fields are hand-authored and load
 * bearing: rule 7 compares them to decide whether a constraint predates a
 * decision, and a format like `07/20/2026` would compare lexicographically
 * as later than any ISO date, silently dropping the constraint.
 */
const IsoDate = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/,
    'Must be YYYY-MM-DD, optionally with a time part',
  )
  // The regex alone admits 2026-13-45, which sorts after every real date.
  .refine((v) => {
    const [y, m, d] = v.slice(0, 10).split('-').map(Number);
    if (m < 1 || m > 12 || d < 1) return false;
    return d <= new Date(Date.UTC(y, m, 0)).getUTCDate();
  }, 'Not a real calendar date');

// ---------------------------------------------------------------------------
// Constitution — the reconciled brief
// ---------------------------------------------------------------------------

/**
 * Deliberately thin. Name, audience, personality, and positioning already live
 * in `identity` — duplicating them here creates two sources of truth. This
 * captures only what identity cannot: the brief in prose, what is out of
 * scope, and what has already been settled.
 */
/**
 * Something unsettled that an agent must not settle on its own.
 *
 * Two real sources disagreeing, a fact nobody has decided yet, a question
 * raised by evidence. Recorded because the first attempt at capturing one
 * used an unknown JSON key — Zod strips those, so it survived in the file
 * until the next write and then vanished. An open question that disappears
 * when someone records a candidate is worse than never writing it down: it
 * reads as settled.
 */
export const OpenQuestion = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  /** The conflicting or incomplete evidence, cited */
  sources: z.array(z.string()).default([]),
  /** Gates this must be answered at, if it blocks. Empty means informational. */
  blocks: z.array(z.string()).default([]),
});
export type OpenQuestion = z.infer<typeof OpenQuestion>;

export const Constitution = z.object({
  /** The actual brief, in prose. What this identity has to accomplish. */
  brief: z.string().min(1),
  /**
   * The conceptual metaphor this identity is built on — the idea, not the
   * apparatus. "The instant of contact" is an anchor. "Aperture, shutter,
   * viewfinder" is a list of camera parts, which is what gets produced when
   * generation starts before an anchor exists.
   *
   * Recorded here rather than left to a session's memory: a fresh session or
   * a different harness has no access to the last one's reasoning.
   */
  conceptualAnchor: z.string().optional(),
  /** Explicit non-goals — directions ruled out before work started */
  nonGoals: z.array(z.string()).default([]),
  /** Decisions carried in from before the ledger existed */
  priorApprovals: z.array(z.string()).default([]),
  /** Where the brief came from (site audit, prior session, stakeholder call) */
  sources: z.array(z.string()).default([]),
  /** Conflicts and unsettled points — see OpenQuestion */
  openQuestions: z.array(OpenQuestion).default([]),
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
 * Two enforcement classes, because pretending otherwise is the trap.
 *
 * `mechanical` — the violation is decidable from text. A forbidden font
 *   family, a banned slogan, a required lowercase spelling. Descriptor match
 *   is proof; the gate blocks.
 *
 * `judgment` — the violation is a visual call: "reads as the Facebook mark",
 *   "the aperture geometry is wrong", "the filmstrip feels forced". No string
 *   match can decide these. A descriptor hit is a prompt to LOOK, not a
 *   verdict, so it downgrades to a warning. The real enforcement is that
 *   approving a candidate at a gate in this constraint's scope requires the
 *   human to acknowledge the constraint in the ledger entry.
 *
 * Default is `judgment`. Claiming mechanical certainty you don't have is the
 * more expensive mistake: it produces a gate that misses the real cases and
 * cries wolf on the honest ones, which trains everyone to ignore it.
 */
export const ConstraintClass = z.enum(['mechanical', 'judgment']);
export type ConstraintClass = z.infer<typeof ConstraintClass>;

/**
 * Mirrors VoiceAntiPattern deliberately: same dual-rail idea, applied to
 * visual candidates instead of prose.
 */
export const RejectionConstraint = z.object({
  id: z.string().min(1),
  /** Why this was rejected — the durable rationale */
  reason: z.string().min(1),
  class: ConstraintClass.default('judgment'),
  /**
   * Regex or literal strings matched against a candidate's descriptor.
   * Invalid regex falls back to case-insensitive substring match.
   *
   * For `mechanical` constraints a hit is a verdict. For `judgment`
   * constraints a hit is an early warning — most real violations will not
   * announce themselves in the descriptor.
   */
  patterns: z.array(z.string()).min(1),
  /** Applies only when approving at these gates. Empty means all gates. */
  gates: z.array(z.string()).default([]),
  /**
   * Severity of a DESCRIPTOR HIT only — how much a text match matters.
   * Judgment-class hits are reported as warnings regardless, because a text
   * match is weak evidence for a visual claim.
   *
   * This does NOT govern whether the mandatory look is required; that is
   * `acknowledgement`. Two meanings on one field meant an author lowering
   * this for evidentiary reasons silently disabled the real enforcement.
   */
  severity: z.enum(['error', 'warning']).default('error'),
  /**
   * Whether approving in this constraint's scope requires the human to name
   * it in the ledger entry's `reviewed`. Judgment-class only. `required`
   * blocks; `optional` warns.
   */
  acknowledgement: z.enum(['required', 'optional']).default('required'),
  /** What to do instead */
  suggestion: z.string().optional(),
  /** Date the rejection was recorded */
  recorded: IsoDate.optional(),
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
  /**
   * Ids of `judgment`-class rejection constraints looked at before approving.
   * An approval must cover every judgment constraint in scope for the gate —
   * that mandatory look is the only real enforcement a judgment call has.
   */
  reviewed: z.array(z.string()).default([]),
  /** Date the decision was made */
  date: IsoDate.optional(),
});
export type DecisionEntry = z.infer<typeof DecisionEntry>;

// ---------------------------------------------------------------------------
// Full Decision System
// ---------------------------------------------------------------------------

/**
 * Ids are the only handle anything else has on these records — ledger
 * entries name candidates, acknowledgements name rejections, gates name
 * prerequisites. A duplicate makes every one of those references ambiguous,
 * and the dangerous case is not theoretical: two judgment constraints
 * sharing an id means one `reviewed` entry silently satisfies both, so a
 * typo defeats the mandatory look.
 *
 * Enforced at the schema so no writer can route around it — `candidate add
 * --id` hands an operator the collision directly.
 */
function uniqueIds<T extends { id: string }>(field: string) {
  return (rows: T[], ctx: z.RefinementCtx) => {
    const seen = new Set<string>();
    for (const [i, row] of rows.entries()) {
      if (seen.has(row.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [i, 'id'],
          message: `Duplicate ${field} id "${row.id}" — ids are how everything else refers to this record`,
        });
      }
      seen.add(row.id);
    }
  };
}

export const DecisionSystem = z.object({
  constitution: Constitution.optional(),
  gates: z.array(GateDefinition).superRefine(uniqueIds('gate')).default([]),
  rubric: z.array(RubricCriterion).superRefine(uniqueIds('rubric criterion')).default([]),
  rejections: z.array(RejectionConstraint).superRefine(uniqueIds('rejection')).default([]),
  candidates: z.array(Candidate).superRefine(uniqueIds('candidate')).default([]),
  ledger: z.array(DecisionEntry).default([]),
});
export type DecisionSystem = z.infer<typeof DecisionSystem>;
