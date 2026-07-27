/**
 * Shared modules must not carry one brand's colors
 *
 * `logo-iterate.ts` shipped "Use Flickday Yellow (#facc15)" inside a generic
 * variant instruction, so iterating a logo for any other brand injected
 * Flickday's accent into the prompt. Same shape as a template that mixes
 * canonical chrome with project data: every consumer silently inherits it.
 *
 * The target is narrow on purpose: a brand color baked into text that gets
 * sent to a model, where it silently biases output for every other brand.
 *
 * Two modules are exempt because emitting default color scales IS their job,
 * and the values there are generic (Tailwind-style neutrals, standard
 * semantic states) rather than any one brand's identity:
 *   - `cli/init.ts`             — the scaffolder
 *   - `core/generators/palette` — proposes palettes; brand hues come from the
 *                                 proposal, only the scaffolding is literal
 *
 * Brand *names* are not checked mechanically. The shipped presets include
 * "Signal Dispatch" and "Review Surface", whose first words are ordinary
 * English that appears legitimately throughout the CLI. A check that fires on
 * every `console.log('Reviewing...')` would be ignored within a week, which
 * is the same cry-wolf failure the decisions gate exists to avoid.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '../src');
const SCOPED = ['core/generators', 'core/exporters', 'core/review', 'media'];
const EXEMPT = ['core/generators/palette.ts'];

/** Structural, not brand identity. */
const STRUCTURAL = new Set(['#000000', '#ffffff']);

function sourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(full);
    return e.name.endsWith('.ts') ? [full] : [];
  });
}

describe('no brand colors in shared modules', () => {
  const files = SCOPED.flatMap((d) => sourceFiles(path.join(SRC, d))).filter(
    (f) => !EXEMPT.includes(path.relative(SRC, f)),
  );

  it('finds the scoped source files', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('no hex color literals outside comments and schema descriptions', () => {
    const offenders: string[] = [];
    for (const file of files) {
      fs.readFileSync(file, 'utf-8')
        .split('\n')
        .forEach((line, i) => {
          if (/^\s*(\*|\/\/|\/\*)/.test(line)) return;
          const code = line.replace(/\/\/.*$/, '');
          if (/\.describe\(/.test(code)) return;
          const hits = (code.match(/#[0-9a-fA-F]{6}\b/g) ?? []).filter(
            (h) => !STRUCTURAL.has(h.toLowerCase()),
          );
          if (hits.length > 0) {
            offenders.push(`${path.relative(SRC, file)}:${i + 1} — ${hits.join(', ')}`);
          }
        });
    }
    expect(
      offenders,
      `brand colors belong in a preset, read from the kit at call time:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
