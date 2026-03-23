/**
 * Batch Command
 *
 * brand-forge batch --kit <path> --output <dir>
 * Renders all registered templates + exports all formats for a brand kit.
 * One command, full brand asset package.
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
import { exportSignalForgeTheme } from '../../core/exporters/signal-forge-theme.js';
import { exportImageGenStyle } from '../../core/exporters/image-gen-style.js';
import { getTemplate, listTemplateIds } from '../../media/templates/index.js';
import { renderToFile } from '../../media/renderer.js';

export function registerBatchCommand(program: Command) {
  program
    .command('batch')
    .description('Export all formats + render all templates for a brand kit')
    .option('-k, --kit <path>', 'Path to brand-kit.json', 'brand-kit.json')
    .option('-o, --output <dir>', 'Output directory', './output')
    .action(async (options: { kit: string; output: string }) => {
      const kit = parseBrandKit(JSON.parse(fs.readFileSync(path.resolve(options.kit), 'utf-8')));
      const outDir = path.resolve(options.output, kit.meta.id);
      fs.mkdirSync(outDir, { recursive: true });

      console.log(chalk.bold(`\nBatch processing: ${kit.identity.name}\n`));

      // --- Review ---
      const report = reviewBrandKit(kit);
      if (!report.passed) {
        console.error(chalk.red(`Review FAILED — ${report.errorCount} errors. Fix before batch export.`));
        process.exit(1);
      }
      console.log(chalk.green('Review: PASSED') + (report.warningCount ? chalk.yellow(` (${report.warningCount} warnings)`) : ''));

      // --- Exports ---
      console.log(chalk.bold('\nExports:'));
      const exports: Array<{ name: string; fn: (k: any) => string; ext: string }> = [
        { name: 'CSS Tokens', fn: exportCssTokens, ext: '.css' },
        { name: 'Tailwind Preset', fn: exportTailwindPreset, ext: '.tailwind.ts' },
        { name: 'Design System Docs', fn: exportMarkdown, ext: '.md' },
        { name: 'Signal Forge Theme', fn: exportSignalForgeTheme, ext: '.theme.json' },
        { name: 'Image Gen Style', fn: exportImageGenStyle, ext: '.style.json' },
      ];

      const exportDir = path.join(outDir, 'exports');
      fs.mkdirSync(exportDir, { recursive: true });
      for (const { name, fn, ext } of exports) {
        const output = fn(kit);
        const filePath = path.join(exportDir, `${kit.meta.id}${ext}`);
        fs.writeFileSync(filePath, output, 'utf-8');
        console.log(chalk.green(`  ${name} → exports/${kit.meta.id}${ext}`));
      }

      // --- Media Templates ---
      console.log(chalk.bold('\nMedia:'));
      const mediaDir = path.join(outDir, 'media');
      fs.mkdirSync(mediaDir, { recursive: true });

      // Sample data for each template — uses brand identity for content
      const templateData: Record<string, Record<string, unknown>> = {
        'social-card': {
          title: kit.identity.name,
          subtitle: kit.identity.tagline || kit.identity.mission || '',
        },
        'story': {
          title: kit.identity.name,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          location: kit.identity.domain || '',
        },
        'flyer': {
          eventName: kit.identity.name,
          date: 'TBD',
          location: 'TBD',
          tagline: kit.identity.tagline || '',
        },
        'favicon': {},
        'email-header': {
          subtitle: kit.identity.tagline || kit.identity.mission || '',
        },
        'prescription-label': {
          rxName: kit.identity.name,
          format: kit.identity.domain || 'General',
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          location: 'TBD',
          dosage: kit.identity.tagline || '',
        },
        'heat-card': {
          variety: 'Default',
          heatLevel: 3,
          tournamentName: kit.identity.name,
          format: kit.identity.domain || '',
        },
      };

      for (const templateId of listTemplateIds()) {
        const tmpl = getTemplate(templateId);
        if (!tmpl) continue;

        const data = templateData[templateId] || {};
        const element = tmpl.render(kit, data);
        const filePath = path.join(mediaDir, `${templateId}.png`);

        try {
          await renderToFile(element, kit, {
            width: tmpl.defaultWidth,
            height: tmpl.defaultHeight,
            outputPath: filePath,
          });
          console.log(chalk.green(`  ${templateId} (${tmpl.defaultWidth}x${tmpl.defaultHeight}) → media/${templateId}.png`));
        } catch (e) {
          console.log(chalk.yellow(`  ${templateId} — skipped (${e})`));
        }
      }

      // --- Favicon set ---
      console.log(chalk.bold('\nFavicons:'));
      const faviconDir = path.join(outDir, 'favicons');
      fs.mkdirSync(faviconDir, { recursive: true });
      const faviconTmpl = getTemplate('favicon');
      if (faviconTmpl) {
        const sizes = [16, 32, 180, 512];
        for (const size of sizes) {
          const element = faviconTmpl.render(kit, {});
          const filePath = path.join(faviconDir, `favicon-${size}x${size}.png`);
          await renderToFile(element, kit, {
            width: size,
            height: size,
            outputPath: filePath,
          });
          console.log(chalk.green(`  ${size}x${size} → favicons/favicon-${size}x${size}.png`));
        }
      }

      console.log(chalk.bold(`\nDone → ${outDir}/`));
    });
}
