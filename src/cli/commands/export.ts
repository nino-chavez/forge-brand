/**
 * Export Command
 *
 * brand-forge export <format> --kit <path> --output <path>
 */

import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { parseBrandKit } from '../../core/schema/brand-kit.js';
import { reviewBrandKit } from '../../core/review/index.js';
import { exportCssTokens } from '../../core/exporters/css-tokens.js';
import { exportTailwindPreset } from '../../core/exporters/tailwind.js';
import { exportMarkdown } from '../../core/exporters/markdown.js';
import { exportDesignMd } from '../../core/exporters/design-md.js';
import { exportSignalForgeTheme } from '../../core/exporters/signal-forge-theme.js';
import { exportSignalForgeVoice } from '../../core/exporters/signal-forge-voice.js';
import { exportImageGenStyle } from '../../core/exporters/image-gen-style.js';
import { exportFigmaTokens } from '../../core/exporters/figma-tokens.js';
import { exportGlossary } from '../../core/exporters/glossary.js';

const EXPORTERS: Record<string, { fn: (kit: any) => string; ext: string; label: string }> = {
  css: { fn: exportCssTokens, ext: '.css', label: 'CSS Tokens' },
  tailwind: { fn: exportTailwindPreset, ext: '.ts', label: 'Tailwind Preset' },
  docs: { fn: exportMarkdown, ext: '.md', label: 'Design System Docs' },
  markdown: { fn: exportMarkdown, ext: '.md', label: 'Design System Docs' },
  'design-md': { fn: exportDesignMd, ext: '.DESIGN.md', label: 'DESIGN.md (google-labs spec)' },
  glossary: { fn: exportGlossary, ext: '.CONTEXT.md', label: 'Brand Glossary (CONTEXT.md)' },
  'signal-forge': { fn: exportSignalForgeTheme, ext: '.theme.json', label: 'Signal Forge Theme' },
  'signal-forge-voice': { fn: exportSignalForgeVoice, ext: '.voice.json', label: 'Signal Forge Voice' },
  'image-gen': { fn: exportImageGenStyle, ext: '.style.json', label: 'Image Gen Style' },
  figma: { fn: exportFigmaTokens, ext: '.figma.json', label: 'Figma Tokens' },
};

export function registerExportCommand(program: Command) {
  program
    .command('export')
    .description('Export brand kit to various formats')
    .argument('<format>', `Output format: ${Object.keys(EXPORTERS).join(', ')}, all`)
    .option('-k, --kit <path>', 'Path to brand-kit.json', 'brand-kit.json')
    .option('-o, --output <dir>', 'Output directory', './output')
    .option('--skip-review', 'Skip QA review (not recommended)')
    .action(async (format: string, options: { kit: string; output: string; skipReview: boolean }) => {
      // Load brand kit
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
        console.error(chalk.red('Brand kit validation failed:'));
        console.error(e.message);
        process.exit(1);
      }

      // Run QA review (unless skipped)
      if (!options.skipReview) {
        const report = reviewBrandKit(kit);
        if (!report.passed) {
          console.error(chalk.red(`QA review FAILED — ${report.errorCount} error(s):`));
          for (const issue of report.gates.contrast.issues) {
            if (issue.severity === 'error') {
              console.error(chalk.red(`  - ${issue.pair}: ratio ${issue.ratio}:1 (need ${issue.required}:1)`));
            }
          }
          for (const issue of report.gates.fontCompat.issues) {
            if (issue.severity === 'error') {
              console.error(chalk.red(`  - ${issue.pair}: ${issue.message}`));
            }
          }
          for (const issue of report.gates.consistency.issues) {
            if (issue.severity === 'error') {
              console.error(chalk.red(`  - ${issue.area}: ${issue.message}`));
            }
          }
          for (const issue of report.gates.decisions.issues) {
            if (issue.severity === 'error') {
              console.error(chalk.red(`  - ${issue.area}: ${issue.message}`));
            }
          }
          console.error(chalk.yellow('Fix errors or use --skip-review to bypass (not recommended)'));
          process.exit(1);
        }
        if (report.warningCount > 0) {
          console.warn(chalk.yellow(`QA review passed with ${report.warningCount} warning(s)`));
        }
      }

      // Create output dir
      const outDir = path.resolve(options.output);
      fs.mkdirSync(outDir, { recursive: true });

      // Export
      const formats = format === 'all' ? Object.keys(EXPORTERS) : [format];

      for (const fmt of formats) {
        const exporter = EXPORTERS[fmt];
        if (!exporter) {
          console.error(chalk.red(`Unknown format: ${fmt}. Available: ${Object.keys(EXPORTERS).join(', ')}`));
          continue;
        }

        const output = exporter.fn(kit);
        const filename = `${kit.meta.id}${exporter.ext}`;
        const outPath = path.join(outDir, filename);
        fs.writeFileSync(outPath, output, 'utf-8');
        console.log(chalk.green(`  ${exporter.label} → ${outPath}`));
      }
    });
}
