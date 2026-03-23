/**
 * Review Command
 *
 * brand-forge review --kit <path>
 * Runs all QA gates and prints a report.
 */

import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { parseBrandKit } from '../../core/schema/brand-kit.js';
import { reviewBrandKit } from '../../core/review/index.js';

export function registerReviewCommand(program: Command) {
  program
    .command('review')
    .description('Run QA review on a brand kit')
    .option('-k, --kit <path>', 'Path to brand-kit.json', 'brand-kit.json')
    .action(async (options: { kit: string }) => {
      const kitPath = path.resolve(options.kit);
      if (!fs.existsSync(kitPath)) {
        console.error(chalk.red(`Brand kit not found: ${kitPath}`));
        process.exit(1);
      }

      const raw = JSON.parse(fs.readFileSync(kitPath, 'utf-8'));
      let kit;
      try {
        kit = parseBrandKit(raw);
      } catch (e: any) {
        console.error(chalk.red('Brand kit schema validation failed:'));
        if (e.issues) {
          for (const issue of e.issues) {
            console.error(chalk.red(`  [${issue.path.join('.')}] ${issue.message}`));
          }
        } else {
          console.error(e.message);
        }
        process.exit(1);
      }

      console.log(chalk.bold(`\nReviewing: ${kit.identity.name} v${kit.meta.version}\n`));

      const report = reviewBrandKit(kit);

      // Contrast gate
      console.log(chalk.bold('Contrast'));
      console.log(`  Pairs checked: ${report.gates.contrast.pairs}`);
      if (report.gates.contrast.passed) {
        console.log(chalk.green('  PASSED'));
      } else {
        console.log(chalk.red('  FAILED'));
        for (const issue of report.gates.contrast.issues) {
          console.log(
            chalk.red(`  - ${issue.pair}: ${issue.ratio}:1 (need ${issue.required}:1) ${issue.foreground} on ${issue.background}`),
          );
        }
      }
      console.log('');

      // Font compatibility gate
      console.log(chalk.bold('Font Compatibility'));
      if (report.gates.fontCompat.passed) {
        console.log(chalk.green('  PASSED'));
      } else {
        console.log(chalk.red('  FAILED'));
      }
      for (const issue of report.gates.fontCompat.issues) {
        const color = issue.severity === 'error' ? chalk.red : chalk.yellow;
        console.log(color(`  - [${issue.severity}] ${issue.pair}: ${issue.message}`));
      }
      console.log('');

      // Consistency gate
      console.log(chalk.bold('Consistency'));
      if (report.gates.consistency.passed) {
        console.log(chalk.green('  PASSED'));
      } else {
        console.log(chalk.red('  FAILED'));
      }
      for (const issue of report.gates.consistency.issues) {
        const color = issue.severity === 'error' ? chalk.red : chalk.yellow;
        console.log(color(`  - [${issue.severity}] ${issue.area}: ${issue.message}`));
      }
      console.log('');

      // Summary
      console.log(chalk.bold('Summary'));
      const statusColor = report.passed ? chalk.green : chalk.red;
      console.log(statusColor(`  ${report.passed ? 'PASSED' : 'FAILED'} — ${report.errorCount} errors, ${report.warningCount} warnings`));

      if (!report.passed) {
        process.exit(1);
      }
    });
}
