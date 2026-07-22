/**
 * Decisions Review Gate
 *
 * Enforces the two rules that keep a creative process from drifting:
 *
 * 1. Only a recorded human decision advances a gate. An agent marking a
 *    candidate "approved" without a ledger entry is not an approval.
 * 2. A recorded rejection stays rejected. Live candidates are matched against
 *    every rejection constraint, so "looks like Facebook" is enforced by the
 *    tool instead of being rediscovered three days later.
 *
 * Plus the ordering and generate-before-criteria checks that catch the
 * classic failure: producing artifacts before the evaluation bar exists,
 * then arguing about the artifacts instead of the bar.
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

  for (const [i, entry] of d.ledger.entries()) {
    if (!gateIds.has(entry.gate)) {
      issues.push({
        area: `decisions.ledger[${i}].gate`,
        message: `References gate "${entry.gate}" which is not defined`,
        severity: 'error',
      });
    }
    for (const cid of entry.candidates) {
      if (!candidateIds.has(cid)) {
        issues.push({
          area: `decisions.ledger[${i}].candidates`,
          message: `References candidate "${cid}" which does not exist`,
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
          'Marked approved with no matching ledger entry. A gate advances on a recorded human decision, not on a status field. Add a decisions.ledger entry naming this candidate, or set status back to "candidate".',
        severity: 'error',
      });
    }
  }

  // A ledger approval that contradicts the candidate's own status
  for (const cid of ledgerApproved) {
    const c = d.candidates.find((x) => x.id === cid);
    if (c && c.status !== 'approved') {
      issues.push({
        area: `decisions.candidates[${cid}].status`,
        message: `Ledger records this candidate as approved but its status is "${c.status}"`,
        severity: 'error',
      });
    }
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

  // --- Rule 4: recorded rejections stay rejected ------------------------------

  const live = d.candidates.filter((c) => LIVE.includes(c.status));
  for (const c of live) {
    for (const r of d.rejections) {
      const hits = violatedPatterns(r, c.descriptor);
      if (hits.length === 0) continue;
      issues.push({
        area: `decisions.candidates[${c.id}]`,
        message: `Violates rejection "${r.id}" (${r.reason}) — matched: ${hits.join(', ')}.${r.suggestion ? ` Instead: ${r.suggestion}` : ''}`,
        severity: r.severity,
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

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}
