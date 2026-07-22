/**
 * Generation readiness + prompt constraints
 *
 * Two claims worth testing separately: that a managed kit refuses to
 * generate at the wrong moment, and that when it does generate, the
 * recorded state actually reaches the prompt. The second is the one a
 * console banner can fake.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseBrandKit, type BrandKit } from '../src/core/schema/brand-kit.js';
import { checkGenerationReadiness } from '../src/core/review/decisions.js';
import { buildLogoPrompt } from '../src/core/generators/logo.js';
import { buildIterationPrompt, VARIANT_IDS } from '../src/core/generators/logo-iterate.js';

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

const ANCHORED = { brief: 'Resolve the identity.', conceptualAnchor: 'The instant of contact' };

const REJECTIONS = [
  {
    id: 'no-filmstrip-letter',
    reason: 'Filmstrip forced into a letterform collapses at small sizes',
    class: 'judgment' as const,
    gates: ['symbol'],
    patterns: ['filmstrip'],
    suggestion: 'Let the film metaphor be the symbol, not a substituted glyph',
  },
  {
    id: 'territory-only',
    reason: 'One metaphor per mark',
    class: 'judgment' as const,
    gates: ['territory'],
    patterns: ['combines'],
  },
];

describe('open questions block the gates they name', () => {
  // The field was printed but never consulted, so a question recorded as
  // blocking the symbol gate did not block it. A promise the record makes
  // and the tool ignores is worse than no promise.
  const kit = () =>
    withDecisions({
      constitution: {
        ...ANCHORED,
        openQuestions: [
          {
            id: 'play-mark',
            question: 'Signature idea or rejected construction?',
            sources: ['two sources disagree'],
            blocks: ['symbol'],
          },
        ],
      },
      gates: GATES,
      candidates: [
        { id: 'C-001', gate: 'territory', descriptor: 'A', method: 'other', status: 'approved' },
      ],
      ledger: [
        {
          gate: 'territory',
          decision: 'approved',
          candidates: ['C-001'],
          rationale: 'x',
          decidedBy: 'nino',
        },
      ],
    });

  it('blocks the named gate and quotes the question', () => {
    const r = checkGenerationReadiness(kit(), 'symbol');
    expect(r.ready).toBe(false);
    expect(r.blockers.join(' ')).toContain('play-mark');
  });

  it('leaves gates it does not name alone', () => {
    expect(checkGenerationReadiness(kit(), 'territory', { reopen: true }).ready).toBe(true);
  });

  it('--reopen does not waive it, because it is not a re-decision', () => {
    expect(checkGenerationReadiness(kit(), 'symbol', { reopen: true }).ready).toBe(false);
  });
});

describe('checkGenerationReadiness', () => {
  it('lets an unmanaged kit generate freely', () => {
    // The decisions block is opt-in; a kit without one is not taxed.
    const { decisions: _omitted, ...unmanaged } = baseKit();
    const r = checkGenerationReadiness(parseBrandKit(unmanaged), 'anything');
    expect(r.ready).toBe(true);
    expect(r.blockers).toEqual([]);
  });

  it('refuses before the anchor is set', () => {
    const r = checkGenerationReadiness(
      withDecisions({ constitution: { brief: 'Resolve it.' }, gates: GATES }),
      'territory',
    );
    expect(r.ready).toBe(false);
    expect(r.blockers.join(' ')).toContain('conceptual anchor');
  });

  it('refuses at a gate whose prerequisite is open', () => {
    const r = checkGenerationReadiness(
      withDecisions({ constitution: ANCHORED, gates: GATES }),
      'symbol',
    );
    expect(r.ready).toBe(false);
    expect(r.blockers.join(' ')).toContain('blocked until territory');
  });

  it('refuses at an undefined gate', () => {
    const r = checkGenerationReadiness(
      withDecisions({ constitution: ANCHORED, gates: GATES }),
      'motion',
    );
    expect(r.ready).toBe(false);
    expect(r.blockers.join(' ')).toContain('not defined');
  });

  const decided = () =>
    withDecisions({
      constitution: ANCHORED,
      gates: GATES,
      candidates: [
        { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'other', status: 'approved' },
      ],
      ledger: [
        { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'Owns it.', decidedBy: 'nino' },
      ],
    });

  it('refuses at a decided gate by default', () => {
    const r = checkGenerationReadiness(decided(), 'territory');
    expect(r.ready).toBe(false);
    expect(r.blockers.join(' ')).toContain('already decided');
  });

  it('allows another round when reopening is explicit', () => {
    const r = checkGenerationReadiness(decided(), 'territory', { reopen: true });
    expect(r.ready).toBe(true);
  });

  it('reopening does not waive the anchor or the prerequisites', () => {
    const noAnchor = checkGenerationReadiness(
      withDecisions({ constitution: { brief: 'Resolve it.' }, gates: GATES }),
      'territory',
      { reopen: true },
    );
    expect(noAnchor.ready).toBe(false);

    const blocked = checkGenerationReadiness(
      withDecisions({ constitution: ANCHORED, gates: GATES }),
      'symbol',
      { reopen: true },
    );
    expect(blocked.ready).toBe(false);
  });

  it('returns only the rejections and criteria in scope for the gate', () => {
    const kit = withDecisions({
      constitution: ANCHORED,
      gates: GATES,
      rejections: REJECTIONS,
      rubric: [
        { id: 'small', criterion: 'Legible at favicon size', gates: ['symbol'] },
        { id: 'ownable', criterion: 'Distinctive and ownable', gates: [] },
      ],
      candidates: [
        { id: 'C-001', gate: 'territory', descriptor: 'Contact instant', method: 'other', status: 'approved' },
      ],
      ledger: [
        { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'Owns it.', decidedBy: 'nino', reviewed: ['territory-only'] },
      ],
    });

    const r = checkGenerationReadiness(kit, 'symbol');
    expect(r.ready).toBe(true);
    expect(r.anchor).toBe('The instant of contact');
    expect(r.avoid.join(' ')).toContain('Filmstrip forced into a letterform');
    expect(r.avoid.join(' ')).not.toContain('One metaphor per mark');
    // Unscoped criteria apply everywhere; scoped ones only where declared.
    expect(r.criteria).toContain('Legible at favicon size');
    expect(r.criteria).toContain('Distinctive and ownable');
  });
});

describe('buildLogoPrompt carries the recorded state', () => {
  const base = { name: 'Test Brand', personality: ['bold'] };

  it('includes the anchor as the thing to express', () => {
    const prompt = buildLogoPrompt({ ...base, anchor: 'The instant of contact' }, 0);
    expect(prompt).toContain('CONCEPTUAL ANCHOR');
    expect(prompt).toContain('The instant of contact');
  });

  it('includes recorded rejections as do-not-propose', () => {
    const prompt = buildLogoPrompt(
      { ...base, rejected: ['Reads as the Meta mark. Instead: break the symmetry'] },
      0,
    );
    expect(prompt).toContain('ALREADY REJECTED');
    expect(prompt).toContain('Reads as the Meta mark');
  });

  it('includes the criteria it will be judged against', () => {
    const prompt = buildLogoPrompt({ ...base, criteria: ['Legible at favicon size'] }, 0);
    expect(prompt).toContain('JUDGED AGAINST');
    expect(prompt).toContain('Legible at favicon size');
  });

  it('omits the sections entirely when there is no recorded state', () => {
    const prompt = buildLogoPrompt(base, 0);
    expect(prompt).not.toContain('CONCEPTUAL ANCHOR');
    expect(prompt).not.toContain('ALREADY REJECTED');
    expect(prompt).not.toContain('JUDGED AGAINST');
  });
});

describe('buildIterationPrompt carries the recorded state', () => {
  const base = {
    direction: 'Asymmetric contact burst',
    name: 'Test Brand',
    accentHex: '#123456',
    accentName: 'Test Accent',
  };

  it('carries the anchor and the rejections into every variant', () => {
    for (const id of VARIANT_IDS) {
      const prompt = buildIterationPrompt(
        { ...base, anchor: 'The instant of contact', rejected: ['Reads as the Meta mark'] },
        id,
      );
      expect(prompt, id).toContain('The instant of contact');
      expect(prompt, id).toContain('ALREADY REJECTED');
      expect(prompt, id).toContain('Reads as the Meta mark');
    }
  });

  it('uses the kit accent in the background variants, never a hardcoded one', () => {
    for (const id of ['on-black', 'on-white']) {
      const prompt = buildIterationPrompt(base, id);
      expect(prompt, id).toContain('Test Accent (#123456)');
      expect(prompt, id).not.toContain('#facc15');
      expect(prompt, id).not.toContain('undefined');
    }
  });

  it('falls back to the bare hex when the accent has no name', () => {
    const prompt = buildIterationPrompt({ ...base, accentName: undefined }, 'on-black');
    expect(prompt).toContain('#123456');
    expect(prompt).not.toContain('undefined');
  });
});
