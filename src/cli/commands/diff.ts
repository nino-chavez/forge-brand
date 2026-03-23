/**
 * Diff Command
 *
 * brand-forge diff <prev> <next>
 * Shows what changed between two brand kit versions.
 */

import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { parseBrandKit } from '../../core/schema/brand-kit.js';
import { diffBrandKits } from '../../core/review/consistency.js';

export function registerDiffCommand(program: Command) {
  program
    .command('diff')
    .description('Show differences between two brand kit versions')
    .argument('<prev>', 'Path to previous brand-kit.json')
    .argument('<next>', 'Path to new brand-kit.json')
    .action(async (prevPath: string, nextPath: string) => {
      const prevKit = parseBrandKit(JSON.parse(fs.readFileSync(path.resolve(prevPath), 'utf-8')));
      const nextKit = parseBrandKit(JSON.parse(fs.readFileSync(path.resolve(nextPath), 'utf-8')));

      const changes = diffBrandKits(prevKit, nextKit);

      if (changes.length === 0) {
        console.log(chalk.green('No changes detected.'));
        return;
      }

      console.log(chalk.bold(`\n${changes.length} change(s) between versions:\n`));

      for (const change of changes) {
        switch (change.type) {
          case 'added':
            console.log(chalk.green(`  + ${change.path}: ${JSON.stringify(change.newValue)}`));
            break;
          case 'removed':
            console.log(chalk.red(`  - ${change.path}: ${JSON.stringify(change.oldValue)}`));
            break;
          case 'changed':
            console.log(chalk.yellow(`  ~ ${change.path}`));
            console.log(chalk.red(`    - ${JSON.stringify(change.oldValue)}`));
            console.log(chalk.green(`    + ${JSON.stringify(change.newValue)}`));
            break;
        }
      }
    });
}
