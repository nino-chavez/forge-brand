/**
 * One answer to "where does this gate stand"
 *
 * Three places computed it independently and all three asked the easy
 * question — does an approval entry exist — instead of the real one. A kit
 * whose only approved candidate had since been rejected failed review as
 * broken while readiness unblocked every gate downstream of it.
 *
 * The two questions are both legitimate and different:
 *   everApproved — was a decision recorded? (ordering)
 *   decided      — is it settled now?       (acting on current state)
 *
 * These tests pin the agreement between consumers, not just each consumer.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseBrandKit, type BrandKit } from '../src/core/schema/brand-kit.js';
import {
  resolveDecisionState,
  checkGenerationReadiness,
  reviewDecisions,
} from '../src/core/review/decisions.js';

const PRESETS_DIR = path.resolve(__dirname, '../presets');

function withDecisions(decisions: unknown): BrandKit {
  const base = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'flickday.json'), 'utf-8'));
  return parseBrandKit({ ...base, decisions });
}

const GATES = [
  { id: 'territory', name: 'Territory', requires: [] },
  { id: 'symbol', name: 'Symbol', requires: ['territory'] },
];

const CONSTITUTION = { brief: 'Resolve the identity.', conceptualAnchor: 'The instant of contact' };

/** Approved, then reversed — an approval with nobody holding it. */
function staleWinner() {
  return withDecisions({
    constitution: CONSTITUTION,
    gates: GATES,
    candidates: [
      { id: 'C-001', gate: 'territory', descriptor: 'A', method: 'other', status: 'rejected' },
    ],
    ledger: [
      { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'x', decidedBy: 'nino' },
      { gate: 'territory', decision: 'rejected', candidates: ['C-001'], rationale: 'changed my mind', decidedBy: 'nino' },
    ],
  });
}

function settled() {
  return withDecisions({
    constitution: CONSTITUTION,
    gates: GATES,
    candidates: [
      { id: 'C-001', gate: 'territory', descriptor: 'A', method: 'other', status: 'approved' },
    ],
    ledger: [
      { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'x', decidedBy: 'nino' },
    ],
  });
}

describe('resolveDecisionState', () => {
  it('separates "was approved" from "is settled"', () => {
    const s = resolveDecisionState(staleWinner().decisions!);
    expect(s.everApproved('territory')).toBe(true);
    expect(s.decided('territory')).toBe(false);
    expect(s.winner('territory')).toBeNull();
  });

  it('reports the candidate currently holding a settled gate', () => {
    const s = resolveDecisionState(settled().decisions!);
    expect(s.decided('territory')).toBe(true);
    expect(s.winner('territory')).toBe('C-001');
  });

  it('treats an unknown gate as undecided rather than throwing', () => {
    const s = resolveDecisionState(settled().decisions!);
    expect(s.decided('nonexistent')).toBe(false);
    expect(s.winner('nonexistent')).toBeNull();
  });
});

describe('consumers agree', () => {
  it('readiness refuses downstream of a gate review calls broken', () => {
    const kit = staleWinner();

    // Review says the kit is broken...
    expect(reviewDecisions(kit).passed).toBe(false);

    // ...so readiness must not wave generation through. This is the exact
    // disagreement the resolver exists to remove.
    const r = checkGenerationReadiness(kit, 'symbol');
    expect(r.ready).toBe(false);
    expect(r.blockers.join(' ')).toContain('no candidate holds the position');
  });

  it('readiness allows downstream of a genuinely settled gate', () => {
    const kit = settled();
    expect(reviewDecisions(kit).passed).toBe(true);
    expect(checkGenerationReadiness(kit, 'symbol').ready).toBe(true);
  });

  it('a superseded winner still counts as settled, because a replacement holds it', () => {
    const kit = withDecisions({
      constitution: CONSTITUTION,
      gates: GATES,
      candidates: [
        { id: 'C-001', gate: 'territory', descriptor: 'A', method: 'other', status: 'superseded' },
        { id: 'C-002', gate: 'territory', descriptor: 'B', method: 'other', status: 'approved' },
      ],
      ledger: [
        { gate: 'territory', decision: 'approved', candidates: ['C-001'], rationale: 'first', decidedBy: 'nino' },
        { gate: 'territory', decision: 'approved', candidates: ['C-002'], rationale: 'better', decidedBy: 'nino' },
      ],
    });
    const s = resolveDecisionState(kit.decisions!);
    expect(s.decided('territory')).toBe(true);
    expect(s.winner('territory')).toBe('C-002');
    expect(reviewDecisions(kit).passed).toBe(true);
    expect(checkGenerationReadiness(kit, 'symbol').ready).toBe(true);
  });

  it('a gate with no live winner cannot be reopened into generating either', () => {
    // --reopen waives "already decided", not "the prerequisite is missing".
    const r = checkGenerationReadiness(staleWinner(), 'symbol', { reopen: true });
    expect(r.ready).toBe(false);
  });
});
