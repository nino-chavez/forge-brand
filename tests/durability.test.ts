/**
 * The record must hold what we claim it holds
 *
 * Two failures motivated these. An unsettled conflict was written as an
 * unknown JSON key, so Zod stripped it and the next write deleted it — a
 * question that vanishes reads as settled. And ids were unvalidated, so two
 * judgment constraints could share one, letting a single `reviewed` entry
 * satisfy both: the mandatory look defeated by a typo.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseBrandKit, type BrandKit } from '../src/core/schema/brand-kit.js';

const PRESETS_DIR = path.resolve(__dirname, '../presets');

function baseKit(): BrandKit {
  return parseBrandKit(
    JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'flickday.json'), 'utf-8')),
  );
}

function withDecisions(decisions: unknown): BrandKit {
  return parseBrandKit({ ...baseKit(), decisions });
}

const GATES = [
  { id: 'territory', name: 'Territory', requires: [] },
  { id: 'symbol', name: 'Symbol', requires: ['territory'] },
];

describe('open questions survive a write cycle', () => {
  it('round-trips through parse, which unknown keys do not', () => {
    const kit = withDecisions({
      constitution: {
        brief: 'Resolve the identity.',
        openQuestions: [
          { id: 'anchor', question: 'What is the metaphor?', sources: ['3 rounds drifted'], blocks: ['territory'] },
        ],
        // An unknown key, the shape that silently disappeared before.
        _note: 'this will not survive',
      },
      gates: GATES,
    });

    const again = parseBrandKit(JSON.parse(JSON.stringify(kit)));
    const c: any = again.decisions!.constitution;
    expect(c.openQuestions).toHaveLength(1);
    expect(c.openQuestions[0].blocks).toEqual(['territory']);
    expect(c._note).toBeUndefined();
  });

  it('the shipped flickday kit records its open questions in the real field', () => {
    const c = baseKit().decisions?.constitution;
    expect(c?.openQuestions.length).toBeGreaterThan(0);
    for (const q of c!.openQuestions) {
      expect(q.sources.length, `${q.id} cites no source`).toBeGreaterThan(0);
    }
  });

  it('records no typeface as approved while the typeface question is open', () => {
    // The fabrication this catches was "wordmark set in Bebas Neue-class
    // condensed display type" — nobody approved that, and BRAND-PRIORS says
    // wordmark type is OPEN.
    //
    // It used to assert that the word "wordmark" never appeared here, which
    // is a keyword standing in for the real property. That misfired the
    // moment a genuine ruling about the wordmark's *construction* was
    // recorded. Approving how the mark is built is not approving what it is
    // set in; test the second thing, since that is the one in dispute.
    const c = baseKit().decisions?.constitution;
    const open = (c?.openQuestions ?? []).some((q) => q.id === 'logotype-typeface');
    expect(open, 'this test is scoped to the window where the typeface is undecided').toBe(true);

    const approvals = (c?.priorApprovals ?? []).join(' ').toLowerCase();
    const faces = [
      'bebas',
      'poppins',
      'montserrat',
      'baloo',
      'fredoka',
      'nunito',
      'rubik',
      'plus jakarta',
      'sora',
      'figtree',
      'manrope',
    ];
    for (const face of faces) {
      expect(approvals, `"${face}" is recorded as approved while the typeface is open`).not.toContain(
        face,
      );
    }
  });
});

describe('duplicate ids are rejected at the schema', () => {
  const cases: Array<[string, unknown]> = [
    [
      'candidates',
      {
        gates: GATES,
        candidates: [
          { id: 'C-001', gate: 'territory', descriptor: 'A', method: 'other' },
          { id: 'C-001', gate: 'territory', descriptor: 'B', method: 'other' },
        ],
      },
    ],
    [
      'rejections',
      {
        gates: GATES,
        rejections: [
          { id: 'dup', reason: 'one', patterns: ['a'] },
          { id: 'dup', reason: 'two', patterns: ['b'] },
        ],
      },
    ],
    ['gates', { gates: [...GATES, { id: 'symbol', name: 'Symbol again', requires: [] }] }],
    [
      'rubric',
      {
        gates: GATES,
        rubric: [
          { id: 'same', criterion: 'One' },
          { id: 'same', criterion: 'Two' },
        ],
      },
    ],
  ];

  for (const [field, decisions] of cases) {
    it(`rejects duplicate ${field} ids`, () => {
      expect(() => withDecisions(decisions)).toThrow();
    });
  }

  it('one acknowledgement cannot cover two constraints sharing an id', () => {
    // The reason this is a schema error and not a warning: `reviewed` names
    // ids, so a collision makes a single look satisfy two distinct calls.
    expect(() =>
      withDecisions({
        gates: GATES,
        rejections: [
          { id: 'no-meta', reason: 'Reads as Meta', class: 'judgment', gates: ['symbol'], patterns: ['a'] },
          { id: 'no-meta', reason: 'Something else entirely', class: 'judgment', gates: ['symbol'], patterns: ['b'] },
        ],
      }),
    ).toThrow();
  });

  it('every shipped preset has unique ids', () => {
    for (const file of fs.readdirSync(PRESETS_DIR).filter((f) => f.endsWith('.json'))) {
      expect(() =>
        parseBrandKit(JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, file), 'utf-8'))),
        file,
      ).not.toThrow();
    }
  });
});
