/**
 * Decisions gate tests
 *
 * The two rules that matter: a gate advances only on a recorded human
 * decision, and a recorded rejection stays rejected.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseBrandKit, type BrandKit } from '../src/core/schema/brand-kit.js';
import {
  reviewDecisions,
  matchesPattern,
  violatedPatterns,
} from '../src/core/review/decisions.js';
import { reviewBrandKit } from '../src/core/review/index.js';

const PRESETS_DIR = path.resolve(__dirname, '../presets');

/** A parsed preset, used as the carrier for decisions fixtures. */
function baseKit(): BrandKit {
  const raw = JSON.parse(
    fs.readFileSync(path.join(PRESETS_DIR, 'flickday.json'), 'utf-8'),
  );
  return parseBrandKit(raw);
}

function withDecisions(decisions: unknown): BrandKit {
  return parseBrandKit({ ...baseKit(), decisions });
}

const GATES = [
  { id: 'territory', name: 'Territory', requires: [] },
  { id: 'wordmark', name: 'Wordmark', requires: ['territory'] },
  { id: 'symbol', name: 'Symbol', requires: ['wordmark'] },
];

const RUBRIC = [
  { id: 'legible-small', criterion: 'Legible at favicon size', weight: 5 },
];

const CONSTITUTION = {
  brief: 'Identity for a volleyball media brand that shoots and cuts its own footage.',
  conceptualAnchor: 'The instant of contact',
};

function errorAreas(issues: { area: string; severity: string }[]): string[] {
  return issues.filter((i) => i.severity === 'error').map((i) => i.area);
}

// ---------------------------------------------------------------------------

describe('reviewDecisions — no decisions block', () => {
  it('passes trivially', () => {
    const report = reviewDecisions(baseKit());
    expect(report.passed).toBe(true);
    expect(report.issues).toHaveLength(0);
  });

  /**
   * An unscoped judgment constraint applies to every gate, so rule 7 demands
   * it be acknowledged at every approval — including gates where it is
   * nonsense ("typography drift across lockup variants" at the territory
   * gate, before any artwork exists). That trains rubber-stamping, which is
   * the behavior the mandatory look exists to prevent.
   */
  it('every shipped judgment constraint is gate-scoped', () => {
    const presets = fs.readdirSync(PRESETS_DIR).filter((f) => f.endsWith('.json'));
    for (const file of presets) {
      const raw = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, file), 'utf-8'));
      const kit = parseBrandKit(raw);
      for (const r of kit.decisions?.rejections ?? []) {
        if (r.class !== 'judgment') continue;
        expect(
          r.gates.length,
          `${file}: judgment constraint "${r.id}" is unscoped, so it applies to every gate`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('every shipped preset still parses and reviews clean', () => {
    const presets = fs.readdirSync(PRESETS_DIR).filter((f) => f.endsWith('.json'));
    expect(presets.length).toBeGreaterThan(0);
    for (const file of presets) {
      const raw = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, file), 'utf-8'));
      const kit = parseBrandKit(raw);
      expect(reviewBrandKit(kit).gates.decisions.passed).toBe(true);
    }
  });
});

describe('rule 1 — only a recorded human decision approves', () => {
  // Authoring shape (pre-parse), so schema defaults may be omitted.
  const approvedNoLedger = {
    constitution: CONSTITUTION,
    gates: GATES,
    rubric: RUBRIC,
    rejections: [],
    candidates: [
      {
        id: 'C-001',
        gate: 'territory',
        round: 1,
        descriptor: 'Motion-blur territory: the brand is about the instant of contact',
        method: 'ai-image',
        status: 'approved',
      },
    ],
    ledger: [],
  };

  it('errors when a candidate is approved with no ledger entry', () => {
    const report = reviewDecisions(withDecisions(approvedNoLedger));
    expect(report.passed).toBe(false);
    expect(errorAreas(report.issues)).toContain('decisions.candidates[C-001].status');
  });

  it('passes once the human decision is recorded', () => {
    const report = reviewDecisions(
      withDecisions({
        ...approvedNoLedger,
        ledger: [
          {
            gate: 'territory',
            decision: 'approved',
            candidates: ['C-001'],
            rationale: 'Contact-instant reads across stills and video without a camera cliche.',
            decidedBy: 'nino',
          },
        ],
      }),
    );
    expect(report.passed).toBe(true);
  });

  it('errors when the ledger and the candidate status disagree', () => {
    const report = reviewDecisions(
      withDecisions({
        ...approvedNoLedger,
        candidates: [{ ...approvedNoLedger.candidates[0], status: 'candidate' }],
        ledger: [
          {
            gate: 'territory',
            decision: 'approved',
            candidates: ['C-001'],
            rationale: 'Picked this one.',
            decidedBy: 'nino',
          },
        ],
      }),
    );
    expect(report.passed).toBe(false);
    expect(errorAreas(report.issues)).toContain('decisions.candidates[C-001].status');
  });

  it('rejects an approval with an empty rationale at parse time', () => {
    expect(() =>
      withDecisions({
        ...approvedNoLedger,
        ledger: [
          {
            gate: 'territory',
            decision: 'approved',
            candidates: ['C-001'],
            rationale: '',
            decidedBy: 'nino',
          },
        ],
      }),
    ).toThrow();
  });
});

describe('rule 2 — one winner per gate', () => {
  it('errors on two approved candidates at the same gate', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'ai-image', status: 'approved' },
          { id: 'C-002', gate: 'territory', descriptor: 'Court geometry', method: 'ai-image', status: 'approved' },
        ],
        ledger: [
          {
            gate: 'territory',
            decision: 'approved',
            candidates: ['C-001', 'C-002'],
            rationale: 'Liked both.',
            decidedBy: 'nino',
          },
        ],
      }),
    );
    expect(report.passed).toBe(false);
    expect(errorAreas(report.issues)).toContain('decisions.gates[territory]');
  });
});

describe('rule 3 — gates advance in order', () => {
  it('errors when a gate is approved before its prerequisite', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        candidates: [
          { id: 'C-010', gate: 'wordmark', descriptor: 'Condensed grotesk lowercase', method: 'type-setting', status: 'approved' },
        ],
        ledger: [
          {
            gate: 'wordmark',
            decision: 'approved',
            candidates: ['C-010'],
            rationale: 'Reads well at small sizes.',
            decidedBy: 'nino',
          },
        ],
      }),
    );
    expect(report.passed).toBe(false);
    expect(errorAreas(report.issues)).toContain('decisions.gates[wordmark]');
  });

  it('passes when the prerequisite was decided first', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'ai-image', status: 'approved' },
          { id: 'C-010', gate: 'wordmark', descriptor: 'Condensed grotesk lowercase', method: 'type-setting', status: 'approved' },
        ],
        ledger: [
          { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'Owns the instant of contact.', decidedBy: 'nino' },
          { gate: 'wordmark', decision: 'approved', candidates: ['C-010'], rationale: 'Reads well at small sizes.', decidedBy: 'nino' },
        ],
      }),
    );
    expect(report.passed).toBe(true);
  });
});

describe('rule 4 — a trace is never the master', () => {
  const traced = {
    id: 'C-040',
    gate: 'symbol',
    // Deliberately does NOT say "traced" — the point is that the rule reads
    // the structured method field, not the prose.
    descriptor: 'Ball-in-motion mark with a soft asymmetric counterform',
    method: 'trace' as const,
  };

  it('errors when a traced candidate is approved', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'ai-image', status: 'approved' },
          { id: 'C-010', gate: 'wordmark', descriptor: 'Condensed grotesk lowercase', method: 'type-setting', status: 'approved' },
          { ...traced, status: 'approved' },
        ],
        ledger: [
          { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'Owns the instant of contact.', decidedBy: 'nino' },
          { gate: 'wordmark', decision: 'approved', candidates: ['C-010'], rationale: 'Reads well at small sizes.', decidedBy: 'nino' },
          { gate: 'symbol', decision: 'approved', candidates: ['C-040'], rationale: 'Cleanest silhouette of the round.', decidedBy: 'nino' },
        ],
      }),
    );
    expect(report.passed).toBe(false);
    expect(errorAreas(report.issues)).toContain('decisions.candidates[C-040].method');
  });

  it('allows a trace to circulate as an unapproved candidate', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        candidates: [{ ...traced, status: 'candidate' }],
      }),
    );
    expect(report.passed).toBe(true);
  });

  it('passes once the trace is rebuilt as a hand-vector child', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'ai-image', status: 'approved' },
          { id: 'C-010', gate: 'wordmark', descriptor: 'Condensed grotesk lowercase', method: 'type-setting', status: 'approved' },
          { ...traced, status: 'superseded' },
          { id: 'C-041', gate: 'symbol', descriptor: traced.descriptor, method: 'hand-vector', parent: 'C-040', status: 'approved' },
        ],
        ledger: [
          { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'Owns the instant of contact.', decidedBy: 'nino' },
          { gate: 'wordmark', decision: 'approved', candidates: ['C-010'], rationale: 'Reads well at small sizes.', decidedBy: 'nino' },
          { gate: 'symbol', decision: 'approved', candidates: ['C-041'], rationale: 'Geometry rebuilt from scratch; curves are now real beziers.', decidedBy: 'nino' },
        ],
      }),
    );
    expect(report.passed).toBe(true);
  });
});

describe('rule 5 — recorded rejections stay rejected', () => {
  const rejections = [
    {
      id: 'banned-slogan',
      reason: 'Slogan copy was ruled out',
      class: 'mechanical' as const,
      patterns: ['capture the moment'],
      severity: 'error' as const,
    },
    {
      id: 'no-filmstrip-letter',
      reason: 'Filmstrip forced into a letterform never survives small sizes',
      class: 'judgment' as const,
      patterns: ['filmstrip.*(letter|bowl|counter)', 'perforation'],
      severity: 'error' as const,
    },
  ];

  it('blocks a live candidate matching a mechanical constraint', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        rejections,
        candidates: [
          {
            id: 'C-020',
            gate: 'wordmark',
            descriptor: 'Lockup with "capture the moment" set beneath the name',
            method: 'type-setting',
            status: 'candidate',
          },
        ],
        ledger: [],
      }),
    );
    expect(report.passed).toBe(false);
    expect(report.constraintsEnforced).toBe(2);
    expect(errorAreas(report.issues)).toContain('decisions.candidates[C-020]');
  });

  it('only warns on a judgment constraint — a text match is not a verdict', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        rejections,
        candidates: [
          {
            id: 'C-021',
            gate: 'symbol',
            descriptor: 'Filmstrip perforations forming the d bowl',
            method: 'ai-vector',
            status: 'candidate',
          },
        ],
        ledger: [],
      }),
    );
    expect(report.passed).toBe(true);
    const warning = report.issues.find((i) => i.message.includes('no-filmstrip-letter'));
    expect(warning?.severity).toBe('warning');
    expect(warning?.message).toContain('prompt, not a verdict');
  });

  it('respects gate scoping', () => {
    const scoped = [{ ...rejections[0], gates: ['wordmark'] }];
    const atOtherGate = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        rejections: scoped,
        candidates: [
          { id: 'C-050', gate: 'territory', descriptor: 'capture the moment as a territory', method: 'other', status: 'candidate' },
        ],
      }),
    );
    expect(atOtherGate.passed).toBe(true);
  });

  it('leaves already-rejected candidates alone', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        rejections,
        candidates: [
          {
            id: 'C-021',
            gate: 'symbol',
            descriptor: 'Filmstrip perforations forming the d bowl',
            method: 'ai-vector',
            status: 'rejected',
          },
        ],
        ledger: [],
      }),
    );
    expect(report.passed).toBe(true);
    expect(report.candidatesChecked).toBe(0);
  });

  it('warns when a rejected descriptor reappears under a new id', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        candidates: [
          { id: 'C-021', gate: 'symbol', descriptor: 'Ball inside an aperture blade ring', method: 'ai-image', status: 'rejected' },
          { id: 'C-030', gate: 'symbol', descriptor: 'ball inside an  aperture blade ring', method: 'ai-image', status: 'candidate' },
        ],
        ledger: [],
      }),
    );
    expect(report.passed).toBe(true);
    const warnings = report.issues.filter((i) => i.severity === 'warning');
    expect(warnings.some((w) => w.message.includes('C-021'))).toBe(true);
  });
});

describe('rule 6 — a ledger rejection actually rejects', () => {
  it('errors when the ledger rejects a candidate still marked live', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        candidates: [
          { id: 'C-014', gate: 'symbol', descriptor: 'Aperture ring around the ball', method: 'ai-image', status: 'candidate' },
        ],
        ledger: [
          { gate: 'symbol', decision: 'rejected', candidates: ['C-014'], rationale: 'Too close to a generic camera company.', decidedBy: 'nino' },
        ],
      }),
    );
    expect(report.passed).toBe(false);
    expect(errorAreas(report.issues)).toContain('decisions.candidates[C-014].status');
  });

  it('passes once the status matches the recorded rejection', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        candidates: [
          { id: 'C-014', gate: 'symbol', descriptor: 'Aperture ring around the ball', method: 'ai-image', status: 'rejected' },
        ],
        ledger: [
          { gate: 'symbol', decision: 'rejected', candidates: ['C-014'], rationale: 'Too close to a generic camera company.', decidedBy: 'nino' },
        ],
      }),
    );
    expect(report.passed).toBe(true);
  });
});

describe('rule 7 — judgment constraints require a recorded look', () => {
  const judgmentRejection = {
    id: 'no-meta-lookalike',
    reason: 'Reads as the Facebook/Meta mark',
    class: 'judgment' as const,
    patterns: ['facebook'],
    gates: ['symbol'],
  };

  function kitWithApproval(reviewed: string[]) {
    return withDecisions({
      constitution: CONSTITUTION,
      gates: GATES,
      rubric: RUBRIC,
      rejections: [judgmentRejection],
      candidates: [
        { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'ai-image', status: 'approved' },
        { id: 'C-010', gate: 'wordmark', descriptor: 'Condensed grotesk lowercase', method: 'type-setting', status: 'approved' },
        { id: 'C-060', gate: 'symbol', descriptor: 'Asymmetric contact burst', method: 'hand-vector', status: 'approved' },
      ],
      ledger: [
        { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'Owns the instant of contact.', decidedBy: 'nino' },
        { gate: 'wordmark', decision: 'approved', candidates: ['C-010'], rationale: 'Reads well at small sizes.', decidedBy: 'nino' },
        { gate: 'symbol', decision: 'approved', candidates: ['C-060'], rationale: 'Silhouette holds at 16px.', decidedBy: 'nino', reviewed },
      ],
    });
  }

  it('errors when an in-scope judgment constraint was not acknowledged', () => {
    const report = reviewDecisions(kitWithApproval([]));
    expect(report.passed).toBe(false);
    expect(errorAreas(report.issues)).toContain('decisions.ledger[2].reviewed');
  });

  it('passes once the human records the look', () => {
    const report = reviewDecisions(kitWithApproval(['no-meta-lookalike']));
    expect(report.passed).toBe(true);
  });

  it('errors on an acknowledgement of a constraint that does not exist', () => {
    const report = reviewDecisions(kitWithApproval(['no-meta-lookalike', 'no-such-rule']));
    expect(report.passed).toBe(false);
    const msg = report.issues.map((i) => i.message).join(' ');
    expect(msg).toContain('no-such-rule');
  });

  it('errors on a scope naming a gate that does not exist', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        // "symbols" — a typo. Without the check this silently applies
        // nowhere while still being counted as enforced.
        rejections: [{ ...judgmentRejection, gates: ['symbols'] }],
        candidates: [
          { id: 'C-060', gate: 'symbol', descriptor: 'Asymmetric contact burst', method: 'hand-vector', status: 'candidate' },
        ],
      }),
    );
    expect(report.passed).toBe(false);
    expect(errorAreas(report.issues)).toContain('decisions.rejections[no-meta-lookalike].gates');
  });

  it('does not retroactively invalidate an approval that predates the constraint', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        rejections: [{ ...judgmentRejection, gates: ['territory'], recorded: '2026-07-20' }],
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'ai-image', status: 'approved' },
        ],
        ledger: [
          { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'Owns the instant of contact.', decidedBy: 'nino', date: '2026-07-01' },
        ],
      }),
    );
    // Clearing this any other way would mean backdating an attestation that
    // a human checked a constraint which did not exist yet.
    expect(report.passed).toBe(true);
  });

  it('still demands acknowledgement for a constraint that predates the approval', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        rejections: [{ ...judgmentRejection, gates: ['territory'], recorded: '2026-07-01' }],
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'ai-image', status: 'approved' },
        ],
        ledger: [
          { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'Owns the instant of contact.', decidedBy: 'nino', date: '2026-07-20' },
        ],
      }),
    );
    expect(report.passed).toBe(false);
    expect(errorAreas(report.issues)).toContain('decisions.ledger[0].reviewed');
  });

  it('does not treat a same-day timestamp as postdating a date-only approval', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        // Lexically "2026-07-20T09:00:00Z" > "2026-07-20", which would have
        // silently skipped the constraint. The day is the same, so nothing
        // is proven and the look is still owed.
        rejections: [{ ...judgmentRejection, gates: ['territory'], recorded: '2026-07-20T09:00:00Z' }],
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'ai-image', status: 'approved' },
        ],
        ledger: [
          { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'Owns it.', decidedBy: 'nino', date: '2026-07-20' },
        ],
      }),
    );
    expect(report.passed).toBe(false);
    expect(errorAreas(report.issues)).toContain('decisions.ledger[0].reviewed');
  });

  it('rejects a non-ISO date at parse time', () => {
    expect(() =>
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'ai-image', status: 'approved' },
        ],
        ledger: [
          { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'Owns it.', decidedBy: 'nino', date: '07/20/2026' },
        ],
      }),
    ).toThrow();
  });

  it('warns on an undated approval when dated constraints exist', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        rejections: [{ ...judgmentRejection, gates: ['territory'], recorded: '2026-07-01' }],
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'ai-image', status: 'approved' },
        ],
        ledger: [
          { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'Owns it.', decidedBy: 'nino', reviewed: ['no-meta-lookalike'] },
        ],
      }),
    );
    expect(report.passed).toBe(true);
    expect(report.issues.some((i) => i.area === 'decisions.ledger[0].date')).toBe(true);
  });

  it('a lowered descriptor-hit severity does not disable the mandatory look', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        // severity governs descriptor hits only; acknowledgement stays required
        rejections: [{ ...judgmentRejection, gates: ['territory'], severity: 'warning' }],
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'ai-image', status: 'approved' },
        ],
        ledger: [
          { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'Owns it.', decidedBy: 'nino' },
        ],
      }),
    );
    expect(report.passed).toBe(false);
    expect(errorAreas(report.issues)).toContain('decisions.ledger[0].reviewed');
  });

  it('downgrades to a warning when acknowledgement is optional', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        rejections: [{ ...judgmentRejection, gates: ['territory'], acknowledgement: 'optional' }],
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'ai-image', status: 'approved' },
        ],
        ledger: [
          { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'Owns it.', decidedBy: 'nino' },
        ],
      }),
    );
    expect(report.passed).toBe(true);
    const issue = report.issues.find((i) => i.area === 'decisions.ledger[0].reviewed');
    expect(issue?.severity).toBe('warning');
  });

  it('does not demand acknowledgement at gates outside the constraint scope', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        rubric: RUBRIC,
        rejections: [judgmentRejection],
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'ai-image', status: 'approved' },
        ],
        ledger: [
          { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'Owns the instant of contact.', decidedBy: 'nino' },
        ],
      }),
    );
    expect(report.passed).toBe(true);
  });
});

describe('rule 8 — no generation before a conceptual anchor', () => {
  const noAnchor = { brief: 'Identity for a volleyball media brand.' };

  it('warns when candidates exist with no anchor', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: noAnchor,
        gates: GATES,
        rubric: RUBRIC,
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'Aperture, shutter, viewfinder', method: 'ai-image', status: 'candidate' },
        ],
      }),
    );
    expect(report.passed).toBe(true);
    expect(report.issues.some((i) => i.area === 'decisions.constitution.conceptualAnchor')).toBe(true);
  });

  it('errors when a gate is approved with no anchor', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: noAnchor,
        gates: GATES,
        rubric: RUBRIC,
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'Aperture, shutter, viewfinder', method: 'ai-image', status: 'approved' },
        ],
        ledger: [
          { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'Looks good.', decidedBy: 'nino' },
        ],
      }),
    );
    expect(report.passed).toBe(false);
    expect(errorAreas(report.issues)).toContain('decisions.constitution.conceptualAnchor');
  });
});

describe('referential integrity', () => {
  it('errors on a candidate pointing at an undefined gate', () => {
    const report = reviewDecisions(
      withDecisions({
        gates: GATES,
        rubric: RUBRIC,
        candidates: [
          { id: 'C-001', gate: 'motion', descriptor: 'Sting', method: 'other', status: 'candidate' },
        ],
      }),
    );
    expect(report.passed).toBe(false);
    expect(errorAreas(report.issues)).toContain('decisions.candidates[C-001].gate');
  });

  it('errors on a ledger entry naming a candidate that does not exist', () => {
    const report = reviewDecisions(
      withDecisions({
        gates: GATES,
        rubric: RUBRIC,
        ledger: [
          { gate: 'territory', decision: 'approved', candidates: ['C-999'], rationale: 'Ghost.', decidedBy: 'nino' },
        ],
      }),
    );
    expect(report.passed).toBe(false);
    expect(errorAreas(report.issues)).toContain('decisions.ledger[0].candidates');
  });
});

describe('generate-before-criteria', () => {
  it('warns when candidates exist with no rubric', () => {
    const report = reviewDecisions(
      withDecisions({
        constitution: CONSTITUTION,
        gates: GATES,
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'ai-image', status: 'candidate' },
        ],
      }),
    );
    expect(report.passed).toBe(true);
    expect(report.issues.some((i) => i.area === 'decisions.rubric')).toBe(true);
  });

  it('warns when candidates exist with no constitution', () => {
    const report = reviewDecisions(
      withDecisions({
        gates: GATES,
        rubric: RUBRIC,
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'ai-image', status: 'candidate' },
        ],
      }),
    );
    expect(report.issues.some((i) => i.area === 'decisions.constitution')).toBe(true);
  });
});

describe('pattern matching', () => {
  it('treats patterns as case-insensitive regex', () => {
    expect(matchesPattern('meta\\b', 'Reads like META branding')).toBe(true);
    expect(matchesPattern('meta\\b', 'metallic sheen')).toBe(false);
  });

  it('falls back to substring match on invalid regex', () => {
    expect(matchesPattern('rounded ((f', 'a rounded ((f shape')).toBe(true);
    expect(matchesPattern('rounded ((f', 'a square mark')).toBe(false);
  });

  it('reports which patterns hit', () => {
    const hits = violatedPatterns(
      { id: 'x', reason: 'y', class: 'mechanical', gates: [], patterns: ['aperture', 'blade'], severity: 'error', acknowledgement: 'required' },
      'aperture blades around a ball',
    );
    expect(hits).toEqual(['aperture', 'blade']);
  });
});

describe('reviewBrandKit integration', () => {
  it('a decisions error blocks the whole review', () => {
    const kit = withDecisions({
      gates: GATES,
      rubric: RUBRIC,
      candidates: [
        { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'ai-image', status: 'approved' },
      ],
      ledger: [],
    });
    const report = reviewBrandKit(kit);
    expect(report.gates.decisions.passed).toBe(false);
    expect(report.passed).toBe(false);
    expect(report.errorCount).toBeGreaterThan(0);
  });
});
