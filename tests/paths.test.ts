/**
 * Generated output must never overwrite a recorded asset
 *
 * A candidate's `asset.path` is part of the durable record. If a later run
 * writes the same filename, the ledger describes one mark and shows another,
 * and nothing can detect it: the path resolves, the kit parses, and no review
 * gate reads image bytes.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { nonClobberingPath, slug } from '../src/core/generators/paths.js';

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-paths-'));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('nonClobberingPath', () => {
  it('uses the plain name when nothing is there', () => {
    expect(nonClobberingPath(dir, 'mark')).toBe(path.join(dir, 'mark.png'));
  });

  it('never returns a path that already exists', () => {
    const paths: string[] = [];
    for (let i = 0; i < 5; i++) {
      const p = nonClobberingPath(dir, 'mark');
      expect(fs.existsSync(p)).toBe(false);
      fs.writeFileSync(p, String(i));
      paths.push(p);
    }
    expect(new Set(paths).size).toBe(5);
  });

  it('leaves earlier files byte-identical', () => {
    const first = nonClobberingPath(dir, 'mark');
    fs.writeFileSync(first, 'recorded-in-the-ledger');

    const second = nonClobberingPath(dir, 'mark');
    fs.writeFileSync(second, 'a later round');

    expect(second).not.toBe(first);
    expect(fs.readFileSync(first, 'utf-8')).toBe('recorded-in-the-ledger');
  });

  it('honors a custom extension', () => {
    expect(nonClobberingPath(dir, 'mark', '.svg')).toBe(path.join(dir, 'mark.svg'));
  });
});

describe('slug', () => {
  it('collapses runs of non-alphanumerics into single dashes', () => {
    expect(slug('Flickday Media')).toBe('flickday-media');
    expect(slug('630 Volleyball!!')).toBe('630-volleyball');
  });

  it('does not leave leading or trailing dashes', () => {
    expect(slug('  Signal Dispatch  ')).toBe('signal-dispatch');
    expect(slug('---x---')).toBe('x');
  });
});
