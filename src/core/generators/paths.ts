/**
 * Output paths for generated artifacts
 *
 * Generated filenames used to be a pure function of brand name + variant, so
 * every run wrote the same handful of paths. On its own that is a scratch
 * directory being reused. Combined with recording a candidate's `asset.path`
 * in the ledger, it is corruption of the durable record: the next run
 * overwrites the file a recorded candidate points at, and the ledger ends up
 * describing one mark while showing another.
 *
 * Nothing downstream can detect that. The path still resolves, the kit still
 * parses, and no review gate reads image bytes.
 *
 * Two defenses, because the cost of the failure is a record you cannot trust:
 * scope the directory to what produced the run, and never overwrite.
 */

import fs from 'node:fs';
import path from 'node:path';

/** Filesystem-safe slug. */
export function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * A path under `dir` that does not exist yet.
 *
 * Repeat runs get `-2`, `-3`, … rather than replacing what is already there.
 * Anything already referenced by a ledger entry stays where it was.
 */
export function nonClobberingPath(dir: string, base: string, ext = '.png'): string {
  const first = path.join(dir, `${base}${ext}`);
  if (!fs.existsSync(first)) return first;

  for (let n = 2; n < 1000; n++) {
    const next = path.join(dir, `${base}-${n}${ext}`);
    if (!fs.existsSync(next)) return next;
  }
  throw new Error(`Cannot find a free filename for ${base}${ext} in ${dir}`);
}
