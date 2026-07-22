/**
 * Decisions Review Gate
 *
 * Eight rules, serving two principles that keep a creative process from
 * drifting:
 *
 * 1. A gate advances only on a ledger entry carrying a rationale and an
 *    author. This is a soft control by construction — the gate cannot prove
 *    a human wrote the entry, and a forged one passes. What it buys is that
 *    approval becomes an explicit, explained, diff-able act instead of a
 *    silently flipped status field, which is what makes review possible.
 * 2. A recorded rejection stays rejected — but only as far as it honestly
 *    can. `mechanical` constraints are decidable from text and block on a
 *    descriptor match. `judgment` constraints ("reads as the Facebook mark")
 *    are not decidable from text at all; a match only warns, and the real
 *    enforcement is that approving in their scope requires the human to
 *    record that they looked. Automating a judgment call produces a gate
 *    that misses the real cases and cries wolf on the honest ones.
 *
 * Rules 1-2 and 6 serve the first; 4-5 and 7 serve the second. Rules 3 and 8
 * catch the classic failure underneath both: producing artifacts before the
 * anchor and the evaluation bar exist, then arguing about the artifacts
 * instead of the bar.
 *
 * Pure deterministic check on a parsed kit. No AI, no network.
 * Kits without a `decisions` block pass trivially.
 */

import type { BrandKit } from '../schema/brand-kit.js';
import type {
  DecisionSystem,
  RejectionConstraint,
  Candidate,
} from '../schema/decisions.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DecisionsIssue {
  area: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface DecisionsReport {
  passed: boolean;
  /** Candidates evaluated against rejection constraints */
  candidatesChecked: number;
  /** Rejection constraints enforced */
  constraintsEnforced: number;
  issues: DecisionsIssue[];
}

/** Statuses that mean the candidate is still in play */
const LIVE: ReadonlyArray<Candidate['status']> = ['candidate', 'approved'];

// ---------------------------------------------------------------------------
// Constraint matching
// ---------------------------------------------------------------------------

/**
 * Match one pattern against a descriptor. Patterns are authored by hand, so
 * an invalid regex is a typo, not a reason to crash the gate — fall back to
 * a case-insensitive substring match.
 */
export function matchesPattern(pattern: string, descriptor: string): boolean {
  try {
    return new RegExp(pattern, 'i').test(descriptor);
  } catch {
    return descriptor.toLowerCase().includes(pattern.toLowerCase());
  }
}

/** Returns the patterns of `constraint` that hit `descriptor`. */
export function violatedPatterns(
  constraint: RejectionConstraint,
  descriptor: string,
): string[] {
  return constraint.patterns.filter((p) => matchesPattern(p, descriptor));
}

// ---------------------------------------------------------------------------
// Gate
// ---------------------------------------------------------------------------

export function reviewDecisions(kit: BrandKit): DecisionsReport {
  const issues: DecisionsIssue[] = [];
  const d: DecisionSystem | undefined = kit.decisions;

  if (!d) {
    return { passed: true, candidatesChecked: 0, constraintsEnforced: 0, issues };
  }

  const gateIds = new Set(d.gates.map((g) => g.id));
  const candidateIds = new Set(d.candidates.map((c) => c.id));

  // Gate ids that carry a recorded human approval
  const approvedGates = new Set(
    d.ledger.filter((e) => e.decision === 'approved').map((e) => e.gate),
  );
  // Candidate ids named in an approval entry
  const ledgerApproved = new Set(
    d.ledger
      .filter((e) => e.decision === 'approved')
      .flatMap((e) => e.candidates),
  );

  // --- Referential integrity ------------------------------------------------

  for (const c of d.candidates) {
    if (!gateIds.has(c.gate)) {
      issues.push({
        area: `decisions.candidates[${c.id}].gate`,
        message: `References gate "${c.gate}" which is not defined. Declared gates: ${[...gateIds].join(', ') || '(none)'}`,
        severity: 'error',
      });
    }
    if (c.parent && !candidateIds.has(c.parent)) {
      issues.push({
        area: `decisions.candidates[${c.id}].parent`,
        message: `References parent candidate "${c.parent}" which does not exist`,
        severity: 'error',
      });
    }
  }

  for (const r of d.rejections) {
    for (const g of r.gates) {
      if (!gateIds.has(g)) {
        // Error, not warning: a mistyped scope makes appliesToGate false
        // everywhere, so the constraint silently stops enforcing while
        // still being counted. A disabled rejection that looks active is
        // worse than no rejection at all.
        issues.push({
          area: `decisions.rejections[${r.id}].gates`,
          message: `References gate "${g}" which is not defined, so this constraint silently applies nowhere. Declared gates: ${[...gateIds].join(', ') || '(none)'}`,
          severity: 'error',
        });
      }
    }
  }

  for (const [i, entry] of d.ledger.entries()) {
    if (!gateIds.has(entry.gate)) {
      issues.push({
        area: `decisions.ledger[${i}].gate`,
        message: `References gate "${entry.gate}" which is not defined`,
        severity: 'error',
      });
    }
    for (const cid of entry.candidates) {
      const c = d.candidates.find((x) => x.id === cid);
      if (!c) {
        issues.push({
          area: `decisions.ledger[${i}].candidates`,
          message: `References candidate "${cid}" which does not exist`,
          severity: 'error',
        });
        continue;
      }
      // Both ids existing is not enough. A typo'd id that happens to name a
      // candidate from another gate records that gate as decided by
      // something that never competed there — and every gate downstream
      // unblocks with no real winner. Nothing else catches this: rule 2
      // keys on the candidate's gate, rule 3 keys on the entry's.
      if (c.gate !== entry.gate) {
        issues.push({
          area: `decisions.ledger[${i}].candidates`,
          message: `Decides gate "${entry.gate}" using candidate "${cid}", which competes at "${c.gate}"`,
          severity: 'error',
        });
      }
    }
  }

  // --- Rule 1: only a recorded human decision approves -----------------------

  for (const c of d.candidates) {
    if (c.status === 'approved' && !ledgerApproved.has(c.id)) {
      issues.push({
        area: `decisions.candidates[${c.id}].status`,
        message:
          'Marked approved with no matching ledger entry. Approval has to be an explained, attributed entry, not a silently flipped status field. Add a decisions.ledger entry naming this candidate, or set status back to "candidate".',
        severity: 'error',
      });
    }
  }

  // A ledger approval that contradicts the candidate's own status.
  //
  // `superseded` is allowed when a LATER approval at the same gate replaced
  // it. That is how a gate reopens without deleting history: the old entry
  // stays, the status tells you it is no longer the winner. Requiring
  // `approved` unconditionally left "supersede it first" as advice whose
  // only execution was erasing the ledger.
  for (const cid of ledgerApproved) {
    const c = d.candidates.find((x) => x.id === cid);
    if (!c || c.status === 'approved') continue;
    if (c.status === 'superseded' && wasSuperseded(d, cid, c.gate)) continue;
    issues.push({
      area: `decisions.candidates[${cid}].status`,
      message: `Ledger records this candidate as approved but its status is "${c.status}"`,
      severity: 'error',
    });
  }

  // --- Rule 2: one winner per gate -------------------------------------------

  const approvedByGate = new Map<string, string[]>();
  for (const c of d.candidates) {
    if (c.status !== 'approved') continue;
    approvedByGate.set(c.gate, [...(approvedByGate.get(c.gate) ?? []), c.id]);
  }
  for (const [gate, ids] of approvedByGate) {
    if (ids.length > 1) {
      issues.push({
        area: `decisions.gates[${gate}]`,
        message: `${ids.length} approved candidates (${ids.join(', ')}). A gate resolves to one. Supersede the others.`,
        severity: 'error',
      });
    }
  }

  // --- Rule 3: gates advance in order ----------------------------------------

  for (const gate of d.gates) {
    if (!approvedGates.has(gate.id)) continue;
    for (const req of gate.requires) {
      if (!gateIds.has(req)) {
        issues.push({
          area: `decisions.gates[${gate.id}].requires`,
          message: `Requires gate "${req}" which is not defined`,
          severity: 'error',
        });
        continue;
      }
      if (!approvedGates.has(req)) {
        issues.push({
          area: `decisions.gates[${gate.id}]`,
          message: `Approved before its prerequisite "${req}" was decided. Generating at this gate first is how a process ends up defending an early artifact instead of solving the brief.`,
          severity: 'error',
        });
      }
    }
  }

  // --- Rule 4: a trace is never the master ------------------------------------
  //
  // Checked structurally off `method`, not off descriptor text. Someone
  // defending a trace does not write "traced" in the descriptor — but the
  // method field is already there and already honest. Prefer a structured
  // field over a string match whenever the data exists.

  for (const c of d.candidates) {
    if (c.status === 'approved' && c.method === 'trace') {
      issues.push({
        area: `decisions.candidates[${c.id}].method`,
        message:
          'Approved with method "trace". A traced raster is not a master — the flaws survive the trace. Rebuild the geometry, record the rebuild as a new candidate with method "hand-vector" and parent set to this one, then approve that.',
        severity: 'error',
      });
    }
  }

  // --- Rule 5: recorded rejections stay rejected ------------------------------
  //
  // Mechanical constraints are decidable from text, so a hit is a verdict.
  // Judgment constraints are not, so a hit is only a prompt to look — their
  // real enforcement is rule 7.

  const live = d.candidates.filter((c) => LIVE.includes(c.status));
  for (const c of live) {
    for (const r of d.rejections) {
      if (!appliesToGate(r.gates, c.gate)) continue;
      const hits = violatedPatterns(r, c.descriptor);
      if (hits.length === 0) continue;
      const mechanical = r.class === 'mechanical';
      issues.push({
        area: `decisions.candidates[${c.id}]`,
        message: mechanical
          ? `Violates rejection "${r.id}" (${r.reason}) — matched: ${hits.join(', ')}.${r.suggestion ? ` Instead: ${r.suggestion}` : ''}`
          : `Descriptor matches judgment constraint "${r.id}" (${r.reason}) — matched: ${hits.join(', ')}. Look at the artifact before approving; the text match is a prompt, not a verdict.${r.suggestion ? ` Instead: ${r.suggestion}` : ''}`,
        severity: mechanical ? r.severity : 'warning',
      });
    }
  }

  // --- Rule 6: a ledger rejection actually rejects -----------------------------
  //
  // The approval rail was already bidirectional; this is its missing mirror.
  // Without it a human's recorded rejection is inert — the candidate stays
  // live, keeps competing, and gets re-proposed.

  const ledgerRejected = new Set(
    d.ledger
      .filter((e) => e.decision === 'rejected')
      .flatMap((e) => e.candidates),
  );
  for (const cid of ledgerRejected) {
    const c = d.candidates.find((x) => x.id === cid);
    if (c && LIVE.includes(c.status)) {
      issues.push({
        area: `decisions.candidates[${cid}].status`,
        message: `Ledger records a rejection for this candidate but its status is "${c.status}", so it is still competing. Set status to "rejected".`,
        severity: 'error',
      });
    }
  }

  // --- Rule 7: judgment constraints require a recorded look --------------------
  //
  // The only honest enforcement for "reads as the Facebook mark" is that a
  // human confirms they considered it. Not automatable; made mandatory.

  const judgment = d.rejections.filter((r) => r.class === 'judgment');
  for (const [i, entry] of d.ledger.entries()) {
    if (entry.decision !== 'approved') continue;

    const inScope = judgment.filter(
      (r) => appliesToGate(r.gates, entry.gate) && !postdates(r, entry),
    );

    // Graded by `acknowledgement`, NOT `severity`. `severity` describes how
    // much a descriptor hit matters — an author lowering it for evidentiary
    // reasons must not silently disable the mandatory look.
    for (const [level, sev] of [
      ['required', 'error'],
      ['optional', 'warning'],
    ] as const) {
      const missed = inScope.filter(
        (r) => r.acknowledgement === level && !entry.reviewed.includes(r.id),
      );
      if (missed.length === 0) continue;
      issues.push({
        area: `decisions.ledger[${i}].reviewed`,
        message: `Approves gate "${entry.gate}" without confirming these judgment constraints were looked at: ${missed.map((r) => r.id).join(', ')}. Add their ids to "reviewed" once you have actually checked the artifact against each.`,
        severity: sev,
      });
    }

    // Undated approvals can't be protected from constraints recorded later,
    // and the repair for that is backdating an attestation — exactly the
    // dishonesty the ledger exists to prevent. Say so once, here.
    if (!entry.date && d.rejections.some((r) => r.recorded)) {
      issues.push({
        area: `decisions.ledger[${i}].date`,
        message:
          'Undated approval. Rejection constraints recorded after this decision cannot be told apart from ones that preceded it, so a later constraint will demand acknowledgement retroactively. Date the entry.',
        severity: 'warning',
      });
    }
    for (const id of entry.reviewed) {
      if (!d.rejections.some((r) => r.id === id)) {
        issues.push({
          area: `decisions.ledger[${i}].reviewed`,
          message: `References rejection constraint "${id}" which does not exist`,
          severity: 'error',
        });
      }
    }
  }

  // --- Rule 8: no generation before a conceptual anchor ------------------------

  if (d.constitution && !d.constitution.conceptualAnchor) {
    if (approvedGates.size > 0) {
      issues.push({
        area: 'decisions.constitution.conceptualAnchor',
        message:
          'A gate has been approved with no conceptual anchor recorded. Without the anchor written down, the next session has only the artifacts to reason from — which is how a project ends up describing camera parts instead of an idea.',
        severity: 'error',
      });
    } else if (d.candidates.length > 0) {
      issues.push({
        area: 'decisions.constitution.conceptualAnchor',
        message: 'Candidates exist with no conceptual anchor recorded. Find the metaphor before generating against it.',
        severity: 'warning',
      });
    }
  }

  // --- Warnings ---------------------------------------------------------------

  // Generating before the bar exists
  if (d.candidates.length > 0 && d.rubric.length === 0) {
    issues.push({
      area: 'decisions.rubric',
      message: `${d.candidates.length} candidates exist with no evaluation criteria recorded. Agree the rubric before generating — otherwise the first artifact sets the bar.`,
      severity: 'warning',
    });
  }

  if (d.candidates.length > 0 && !d.constitution) {
    issues.push({
      area: 'decisions.constitution',
      message: 'Candidates exist with no constitution. The brief should be reconciled before generation starts.',
      severity: 'warning',
    });
  }

  // A rejected idea re-entering under a new id
  const rejectedDescriptors = new Map<string, string>();
  for (const c of d.candidates) {
    if (c.status === 'rejected') {
      rejectedDescriptors.set(normalize(c.descriptor), c.id);
    }
  }
  for (const c of live) {
    const prior = rejectedDescriptors.get(normalize(c.descriptor));
    if (prior) {
      issues.push({
        area: `decisions.candidates[${c.id}]`,
        message: `Same descriptor as rejected candidate ${prior}. Either it is a genuine revision (say how in notes) or the rejection is being relitigated.`,
        severity: 'warning',
      });
    }
  }

  // Rubric that names gates which don't exist
  for (const r of d.rubric) {
    for (const g of r.gates) {
      if (!gateIds.has(g)) {
        issues.push({
          area: `decisions.rubric[${r.id}].gates`,
          message: `References gate "${g}" which is not defined`,
          severity: 'warning',
        });
      }
    }
  }

  return {
    passed: issues.filter((i) => i.severity === 'error').length === 0,
    candidatesChecked: live.length,
    constraintsEnforced: d.rejections.length,
    issues,
  };
}

// ---------------------------------------------------------------------------
// Generation readiness
// ---------------------------------------------------------------------------

export interface GenerationReadiness {
  ready: boolean;
  /** Why generation must not proceed */
  blockers: string[];
  /** The anchor to generate toward, if locked */
  anchor?: string;
  /** In-scope rejections, phrased for a prompt */
  avoid: string[];
  /** In-scope rubric criteria, phrased for a prompt */
  criteria: string[];
}

/**
 * May a generator produce candidates at this gate, and with what constraints?
 *
 * The refusals matter more than the constraints. Generating before the anchor
 * exists is what produces a parts list instead of an idea, and generating at
 * a gate whose prerequisites are open is how a project ends up defending an
 * early artifact instead of solving the brief. Both are cheap to check and
 * expensive to discover afterward.
 *
 * A kit with no `decisions` block is unmanaged and generates freely — this
 * is opt-in, not a tax on every kit.
 */
export function checkGenerationReadiness(
  kit: BrandKit,
  gate: string,
  options: { reopen?: boolean } = {},
): GenerationReadiness {
  const d = kit.decisions;
  if (!d) return { ready: true, blockers: [], avoid: [], criteria: [] };

  const blockers: string[] = [];
  const anchor = d.constitution?.conceptualAnchor;

  if (!anchor) {
    blockers.push(
      'No conceptual anchor recorded. Find the metaphor first and set decisions.constitution.conceptualAnchor — generating against apparatus instead of an idea is what this refusal exists to prevent.',
    );
  }

  const def = d.gates.find((g) => g.id === gate);
  if (!def) {
    blockers.push(
      `Gate "${gate}" is not defined. Declared gates: ${d.gates.map((g) => g.id).join(', ') || '(none)'}`,
    );
  } else {
    const approved = new Set(
      d.ledger.filter((e) => e.decision === 'approved').map((e) => e.gate),
    );
    const open = def.requires.filter((r) => !approved.has(r));
    if (open.length > 0) {
      blockers.push(
        `Gate "${gate}" is blocked until ${open.join(', ')} ${open.length === 1 ? 'is' : 'are'} decided.`,
      );
    }
    if (approved.has(gate) && !options.reopen) {
      blockers.push(
        `Gate "${gate}" is already decided. Pass --reopen to run another round — approving a new candidate there supersedes the current winner and keeps both ledger entries.`,
      );
    }
  }

  const inScope = d.rejections.filter((r) => appliesToGate(r.gates, gate));

  return {
    ready: blockers.length === 0,
    blockers,
    anchor,
    avoid: inScope.map((r) =>
      r.suggestion ? `${r.reason}. Instead: ${r.suggestion}` : r.reason,
    ),
    criteria: d.rubric
      .filter((c) => appliesToGate(c.gates, gate))
      .map((c) => c.criterion),
  };
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Did a later approval at the same gate replace this candidate?
 *
 * "Later" is ledger order, which is append order. Dates are optional and a
 * same-day reopen is normal, so position is the only ordering that always
 * exists.
 */
function wasSuperseded(
  d: DecisionSystem,
  candidateId: string,
  gate: string,
): boolean {
  const approvals = d.ledger
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.decision === 'approved' && e.gate === gate);

  const mine = approvals.find(({ e }) => e.candidates.includes(candidateId));
  if (!mine) return false;

  return approvals.some(
    ({ e, i }) => i > mine.i && !e.candidates.includes(candidateId),
  );
}

/** Empty scope means every gate. */
function appliesToGate(scope: string[], gate: string): boolean {
  return scope.length === 0 || scope.includes(gate);
}

/**
 * Was this constraint recorded after the decision was made?
 *
 * Without this, adding a rejection retroactively invalidates every prior
 * approval, and the only way to clear the error is to edit a historical
 * ledger entry claiming a human checked a constraint that did not exist
 * yet. That makes falsifying the record the sanctioned repair, which
 * destroys the one property the ledger has.
 *
 * Only skips when it can be proven, and "proven" is strict:
 *
 * - Compared at day granularity. A date-only approval says nothing about
 *   the hour, so a constraint stamped 09:00 the same day is not proven to
 *   come after it. String comparison got this wrong in the other direction
 *   — `"2026-07-20T09:00:00Z" > "2026-07-20"` is true by prefix length —
 *   which silently dropped the constraint and disabled the only enforcement
 *   a judgment call has.
 * - Anything unparseable is not proven, so the constraint still applies.
 *
 * Failing toward "still applies" is the right direction: the cost is an
 * acknowledgement you did not strictly owe, versus a skipped check you did.
 */
function postdates(
  r: { recorded?: string },
  entry: { date?: string },
): boolean {
  const recorded = utcDay(r.recorded);
  const decided = utcDay(entry.date);
  if (!recorded || !decided) return false;
  return recorded > decided;
}

/**
 * The calendar day the author wrote, or null if absent or not a real date.
 *
 * Deliberately does NOT go through `Date.parse`. Per spec that treats a
 * date-only string as UTC but a date-time without an offset as LOCAL time,
 * so `"2026-07-20T20:00:00"` becomes the 21st on a UTC-5 machine and the
 * 20th in CI — the same fail-open as the old string comparison, plus a gate
 * whose verdict depends on where it runs.
 *
 * Comparing the declared day is also the honest semantic: someone who wrote
 * `2026-07-20T20:00:00` meant the 20th.
 *
 * The calendar check matters because a `slice(0, 10)` would let `2026-13-45`
 * through, and it sorts after every real date — fail-open again.
 */
function utcDay(value: string | undefined): string | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const [, y, mo, d] = m;
  return isRealDate(+y, +mo, +d) ? `${y}-${mo}-${d}` : null;
}

function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}
