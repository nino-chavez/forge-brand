/**
 * Stored asset paths must mean the same thing to the writer and the reader
 *
 * `AssetRef.path` is documented as "relative to brand kit root, or URL", but
 * `candidate add` stored the operator's raw input — naturally CWD-relative,
 * like every other path flag — while `generate iterate` resolved it against
 * the kit's directory. A hand-typed `output/logos/x.png` became
 * `presets/output/logos/x.png` and the tool reported a file missing that was
 * sitting right there. It only ever worked because the paths the tool prints
 * are absolute, which makes the rebase a silent no-op.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normalizeAssetPath } from '../src/cli/commands/decide.js';

let root: string;
let cwd: string;

beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'forge-assets-')));
  fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(root, 'presets'), { recursive: true });
  cwd = process.cwd();
  process.chdir(root);
});

afterEach(() => {
  process.chdir(cwd);
  fs.rmSync(root, { recursive: true, force: true });
});

/** What the writer stores, then what the reader resolves it back to. */
function roundTrip(input: string, kitPath: string): string {
  const stored = normalizeAssetPath(input, kitPath);
  return path.resolve(path.dirname(path.resolve(kitPath)), stored);
}

describe('normalizeAssetPath', () => {
  it('keeps it relative when the asset lives under the kit', () => {
    const stored = normalizeAssetPath('assets/mark.png', path.join(root, 'kit.json'));
    expect(stored).toBe('assets/mark.png');
  });

  it('goes absolute rather than climbing out of the kit directory', () => {
    // presets/ and assets/ are siblings — a relative path here would be
    // ../assets/mark.png, and for a kit far from the tree, a chain of them.
    const stored = normalizeAssetPath('assets/mark.png', path.join(root, 'presets', 'kit.json'));
    expect(path.isAbsolute(stored)).toBe(true);
    expect(stored).toBe(path.join(root, 'assets', 'mark.png'));
  });

  it('round-trips a CWD-relative input to the file the operator meant', () => {
    const target = path.join(root, 'assets', 'mark.png');
    fs.writeFileSync(target, 'x');

    for (const kit of [path.join(root, 'kit.json'), path.join(root, 'presets', 'kit.json')]) {
      const resolved = roundTrip('assets/mark.png', kit);
      expect(resolved, kit).toBe(target);
      expect(fs.existsSync(resolved), kit).toBe(true);
    }
  });

  it('round-trips an absolute input unchanged', () => {
    const target = path.join(root, 'assets', 'mark.png');
    expect(roundTrip(target, path.join(root, 'presets', 'kit.json'))).toBe(target);
  });

  it('leaves URLs alone', () => {
    for (const url of ['https://cdn.example.com/mark.png', 'data:image/png;base64,AAAA']) {
      expect(normalizeAssetPath(url, path.join(root, 'kit.json'))).toBe(url);
    }
  });

  it('stores POSIX separators so a kit written on Windows still reads', () => {
    const stored = normalizeAssetPath('assets/mark.png', path.join(root, 'kit.json'));
    expect(stored).not.toContain('\\');
  });
});
