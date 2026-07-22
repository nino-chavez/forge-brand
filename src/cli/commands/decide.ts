/**
 * Candidate + Decide Commands
 *
 * The authoring loop for creative state. Without these, candidates and
 * ledger entries are hand-edited JSON, which is exactly the friction that
 * makes people stop recording decisions and go back to remembering them.
 *
 * Both commands validate the whole kit BEFORE writing. A kit on disk is
 * always one that passes review — you cannot record a decision that the
 * gate would have rejected, so the file never drifts into a state someone
 * has to untangle later.
 */

import { Command, Option } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { parseBrandKit, type BrandKit } from '../../core/schema/brand-kit.js';
import { reviewBrandKit } from '../../core/review/index.js';
import type { GenerationMethod } from '../../core/schema/decisions.js';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function loadKit(kitPath: string): { kit: BrandKit; resolved: string } {
  const resolved = path.resolve(kitPath);
  if (!fs.existsSync(resolved)) {
    console.error(chalk.red(`Brand kit not found: ${resolved}`));
    process.exit(1);
  }
  const kit = parseBrandKit(JSON.parse(fs.readFileSync(resolved, 'utf-8')));
  if (!kit.decisions) {
    console.error(
      chalk.red('This kit has no `decisions` block. Add one before recording candidates or decisions.'),
    );
    process.exit(1);
  }
  return { kit, resolved };
}

/**
 * Validate then write. Refusing to persist an invalid kit is what keeps the
 * ledger trustworthy — a recorded decision that the gate rejects is not a
 * decision, it is a mess someone inherits.
 */
function commit(kit: BrandKit, resolved: string, summary: string): void {
  // Schema first. None of the review gates run Zod — `reviewBrandKit` never
  // calls `parseBrandKit` — so validating only against the gates let a bad
  // `--method` or a NaN round reach disk, after which every later command
  // died on an uncaught ZodError until someone hand-edited the JSON. That is
  // the exact friction these commands exist to remove.
  const serialized = JSON.stringify(kit, null, 2);
  try {
    parseBrandKit(JSON.parse(serialized));
  } catch (e: any) {
    console.error(chalk.red('Refusing to write — the result would not parse:\n'));
    for (const issue of e.issues ?? []) {
      console.error(chalk.red(`  - ${issue.path.join('.')}: ${issue.message}`));
    }
    if (!e.issues) console.error(chalk.red(`  ${e.message}`));
    process.exit(1);
  }

  const report = reviewBrandKit(kit);
  const errors = report.gates.decisions.issues.filter((i) => i.severity === 'error');

  if (errors.length > 0) {
    console.error(chalk.red('Refusing to write — the result would not pass review:\n'));
    for (const issue of errors) {
      console.error(chalk.red(`  - ${issue.area}: ${issue.message}`));
    }
    process.exit(1);
  }

  kit.meta.updated = new Date().toISOString();
  fs.writeFileSync(resolved, JSON.stringify(kit, null, 2) + '\n', 'utf-8');
  console.log(chalk.green(summary));

  const warnings = report.gates.decisions.issues.filter((i) => i.severity === 'warning');
  for (const w of warnings) {
    console.warn(chalk.yellow(`  warning: ${w.area}: ${w.message}`));
  }
}

/**
 * Store an asset path the way the schema says it is stored.
 *
 * `AssetRef.path` is documented as "relative to brand kit root, or URL", but
 * this writer stored whatever the operator typed — which is naturally
 * CWD-relative, like every other path flag in this CLI. The reader then
 * resolved it against the kit's directory, so a hand-typed
 * `output/logos/x.png` became `presets/output/logos/x.png` and the file
 * "didn't exist". It only ever worked because the paths the tool prints are
 * absolute, which makes the rebase a no-op by accident.
 *
 * So: interpret input against CWD, like the other flags. Store relative to
 * the kit when the asset actually lives under it — that is what makes a kit
 * portable — and absolute when it does not. A kit outside the asset tree
 * would otherwise store `../../../../../..` chains that are correct, fragile,
 * and unreadable. URLs pass through untouched.
 */
export function normalizeAssetPath(input: string, kitPath: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(input)) return input;
  const absolute = path.resolve(process.cwd(), input);
  const relative = path.relative(path.dirname(path.resolve(kitPath)), absolute);
  if (relative.startsWith('..')) return absolute;
  // Keep POSIX separators so a kit written on Windows still reads elsewhere.
  return relative.split(path.sep).join('/');
}

/** Next free `C-NNN`. */
function nextCandidateId(kit: BrandKit): string {
  const used = (kit.decisions?.candidates ?? [])
    .map((c) => /^C-(\d+)$/.exec(c.id)?.[1])
    .filter((n): n is string => Boolean(n))
    .map(Number);
  const next = used.length > 0 ? Math.max(...used) + 1 : 1;
  return `C-${String(next).padStart(3, '0')}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// candidate
// ---------------------------------------------------------------------------

export function registerCandidateCommand(program: Command) {
  const cmd = program
    .command('candidate')
    .description('Record and inspect candidates at a gate');

  cmd
    .command('add')
    .description('Record a new candidate')
    .requiredOption('-g, --gate <id>', 'Gate this candidate competes at')
    .requiredOption(
      '-d, --descriptor <text>',
      'What the candidate IS, in mechanical terms — this is what rejection constraints match against, so describe the construction, not the vibe',
    )
    .addOption(
      new Option('-m, --method <method>', 'How the candidate was produced')
        .makeOptionMandatory()
        .choices(['ai-image', 'ai-vector', 'type-setting', 'hand-vector', 'trace', 'other']),
    )
    .option('-k, --kit <path>', 'Path to brand-kit.json', 'brand-kit.json')
    .option('-a, --asset <path>', 'Path to the rendered artifact')
    .option('-p, --parent <id>', 'Candidate this was derived from')
    .option('-r, --round <n>', 'Round number within the gate', '1')
    .option('--id <id>', 'Explicit candidate id (default: next C-NNN)')
    .action((options: Record<string, string>) => {
      const { kit, resolved } = loadKit(options.kit);
      const id = options.id || nextCandidateId(kit);

      kit.decisions!.candidates.push({
        id,
        gate: options.gate,
        round: parseInt(options.round, 10),
        descriptor: options.descriptor,
        method: options.method as GenerationMethod,
        status: 'candidate',
        ...(options.parent ? { parent: options.parent } : {}),
        ...(options.asset
          ? { asset: { id, label: id, path: normalizeAssetPath(options.asset, resolved), tags: [] } }
          : {}),
      });

      commit(kit, resolved, `Recorded ${id} at gate "${options.gate}"`);
    });

  cmd
    .command('list')
    .description('List candidates')
    .option('-k, --kit <path>', 'Path to brand-kit.json', 'brand-kit.json')
    .option('-g, --gate <id>', 'Filter to one gate')
    .action((options: { kit: string; gate?: string }) => {
      const { kit } = loadKit(options.kit);
      const rows = kit.decisions!.candidates.filter(
        (c) => !options.gate || c.gate === options.gate,
      );

      if (rows.length === 0) {
        console.log(chalk.dim('No candidates recorded.'));
        return;
      }

      const color = {
        approved: chalk.green,
        rejected: chalk.red,
        superseded: chalk.dim,
        candidate: chalk.white,
      } as const;

      for (const c of rows) {
        console.log(
          `${color[c.status](c.id.padEnd(7))} ${c.gate.padEnd(12)} ${c.status.padEnd(11)} ${chalk.dim(c.method.padEnd(12))} ${c.descriptor}`,
        );
      }
    });
}

// ---------------------------------------------------------------------------
// decide
// ---------------------------------------------------------------------------

export function registerDecideCommand(program: Command) {
  program
    .command('decide')
    .description('Record a human decision at a gate — the only thing that advances one')
    .requiredOption('-g, --gate <id>', 'Gate being decided')
    .requiredOption('--rationale <text>', 'Why. An unexplained approval is not a decision.')
    .requiredOption('--by <name>', 'Who decided. The human, not the agent.')
    .option('-k, --kit <path>', 'Path to brand-kit.json', 'brand-kit.json')
    .option('--approve <ids>', 'Comma-separated candidate ids to approve')
    .option('--reject <ids>', 'Comma-separated candidate ids to reject')
    .option(
      '--reviewed <ids>',
      'Comma-separated judgment-constraint ids you actually looked at the artifact against',
    )
    .option('--date <YYYY-MM-DD>', 'Decision date (default: today)')
    .action((options: Record<string, string>) => {
      const { kit, resolved } = loadKit(options.kit);
      const d = kit.decisions!;

      const approve = splitIds(options.approve);
      const reject = splitIds(options.reject);
      if (approve.length === 0 && reject.length === 0) {
        console.error(chalk.red('Nothing to decide — pass --approve and/or --reject.'));
        process.exit(1);
      }

      // Surface the required looks before writing, with the exact flag to
      // use. The review gate would catch a missing acknowledgement anyway;
      // this makes the fix obvious instead of a puzzle.
      if (approve.length > 0) {
        const owed = d.rejections.filter(
          (r) =>
            r.class === 'judgment' &&
            r.acknowledgement === 'required' &&
            (r.gates.length === 0 || r.gates.includes(options.gate)),
        );
        const seen = splitIds(options.reviewed);
        const missing = owed.filter((r) => !seen.includes(r.id));
        if (missing.length > 0) {
          console.error(
            chalk.red(`\nApproving at "${options.gate}" requires looking at the artifact against:\n`),
          );
          for (const r of missing) {
            console.error(chalk.red(`  ${r.id} — ${r.reason}`));
            if (r.suggestion) console.error(chalk.dim(`    instead: ${r.suggestion}`));
          }
          console.error(
            chalk.yellow(
              `\nOnce you have actually checked each, re-run with:\n  --reviewed ${[...seen, ...missing.map((r) => r.id)].join(',')}\n`,
            ),
          );
          process.exit(1);
        }
      }

      const date = options.date || today();

      // Approving at a gate that already has a winner replaces it. The old
      // ledger entry stays — history is the point — and the old candidate's
      // status drops to `superseded` so the gate still resolves to one.
      const superseded: string[] = [];
      if (approve.length > 0) {
        for (const c of d.candidates) {
          if (c.gate === options.gate && c.status === 'approved' && !approve.includes(c.id)) {
            c.status = 'superseded';
            superseded.push(c.id);
          }
        }
      }

      for (const [ids, decision, status] of [
        [approve, 'approved', 'approved'],
        [reject, 'rejected', 'rejected'],
      ] as const) {
        if (ids.length === 0) continue;

        d.ledger.push({
          gate: options.gate,
          decision,
          candidates: ids,
          rationale: options.rationale,
          decidedBy: options.by,
          reviewed: decision === 'approved' ? splitIds(options.reviewed) : [],
          date,
        });

        for (const id of ids) {
          const c = d.candidates.find((x) => x.id === id);
          if (!c) {
            console.error(chalk.red(`Candidate "${id}" does not exist.`));
            process.exit(1);
          }
          if (c.gate !== options.gate) {
            console.error(
              chalk.red(
                `Candidate "${id}" competes at gate "${c.gate}", not "${options.gate}". Deciding a gate with a candidate from another one records a winner that never competed there.`,
              ),
            );
            process.exit(1);
          }
          c.status = status;
        }
      }

      const parts = [
        approve.length > 0 ? `approved ${approve.join(', ')}` : '',
        reject.length > 0 ? `rejected ${reject.join(', ')}` : '',
        superseded.length > 0 ? `superseded ${superseded.join(', ')}` : '',
      ].filter(Boolean);

      commit(kit, resolved, `Gate "${options.gate}": ${parts.join('; ')} (${date})`);
    });
}

function splitIds(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
