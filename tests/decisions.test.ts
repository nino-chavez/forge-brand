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

describe('rule 4 — recorded rejections stay rejected', () => {
  const rejections = [
    {
      id: 'no-meta-lookalike',
      reason: 'Reads as the Facebook/Meta mark',
      patterns: ['facebook', 'meta\\b', 'rounded blue f'],
      severity: 'error' as const,
      suggestion: 'Keep the counterform asymmetric',
    },
    {
      id: 'no-filmstrip-letter',
      reason: 'Filmstrip forced into a letterform never survives small sizes',
      patterns: ['filmstrip.*(letter|bowl|counter)', 'perforation'],
      severity: 'error' as const,
    },
  ];

  it('blocks a live candidate that matches a recorded rejection', () => {
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
    expect(report.passed).toBe(false);
    expect(report.constraintsEnforced).toBe(2);
    const msg = report.issues.map((i) => i.message).join(' ');
    expect(msg).toContain('no-filmstrip-letter');
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
      { id: 'x', reason: 'y', patterns: ['aperture', 'blade'], severity: 'error' },
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
