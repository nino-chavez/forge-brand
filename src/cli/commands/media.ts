/**
 * Media Command
 *
 * brand-forge media <template> --kit <path> --data <json>
 * Generate media assets from Satori templates parameterized by brand kit.
 */

import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { parseBrandKit } from '../../core/schema/brand-kit.js';
import { getTemplate, listTemplateIds } from '../../media/templates/index.js';
import { renderToFile } from '../../media/renderer.js';

export function registerMediaCommand(program: Command) {
  const media = program
    .command('media')
    .description('Generate media assets from brand kit templates');

  media
    .command('list')
    .description('List available media templates for a brand kit')
    .option('-k, --kit <path>', 'Path to brand-kit.json', 'brand-kit.json')
    .action(async (options: { kit: string }) => {
      const kit = parseBrandKit(JSON.parse(fs.readFileSync(path.resolve(options.kit), 'utf-8')));

      if (kit.media.templates.length === 0) {
        console.log(chalk.dim(`No media templates defined in ${kit.identity.name}`));
        return;
      }

      console.log(chalk.bold(`\nMedia templates for ${kit.identity.name}:\n`));
      for (const tmpl of kit.media.templates) {
        console.log(chalk.bold(`  ${tmpl.id}`) + ` — ${tmpl.name}`);
        console.log(chalk.dim(`  ${tmpl.description}`));
        for (const size of tmpl.sizes) {
          console.log(`    ${size.width}x${size.height} @ ${size.dpi}dpi${size.label ? ` (${size.label})` : ''}`);
        }
        if (tmpl.dataFields.length) {
          const required = tmpl.dataFields.filter((f) => f.required).map((f) => f.name);
          const optional = tmpl.dataFields.filter((f) => !f.required).map((f) => f.name);
          if (required.length) console.log(`    Required: ${required.join(', ')}`);
          if (optional.length) console.log(chalk.dim(`    Optional: ${optional.join(', ')}`));
        }
        console.log('');
      }
    });

  media
    .command('render')
    .description('Render a media template to image')
    .argument('<template-id>', 'Template ID to render')
    .option('-k, --kit <path>', 'Path to brand-kit.json', 'brand-kit.json')
    .option('-d, --data <json>', 'Template data as JSON string', '{}')
    .option('-o, --output <path>', 'Output file path', './output.png')
    .option('-w, --width <n>', 'Width override')
    .option('-h, --height <n>', 'Height override')
    .option('--print', 'Render at 300dpi (4.17x scale) for print output')
    .action(async (templateId: string, options: { kit: string; data: string; output: string; width?: string; height?: string; print?: boolean }) => {
      const kit = parseBrandKit(JSON.parse(fs.readFileSync(path.resolve(options.kit), 'utf-8')));

      const tmpl = getTemplate(templateId);
      if (!tmpl) {
        console.error(chalk.red(`Unknown template: "${templateId}". Available: ${listTemplateIds().join(', ')}`));
        process.exit(1);
      }

      const data = JSON.parse(options.data);

      // Find size: CLI overrides > kit template sizes > template defaults
      const kitTemplate = kit.media.templates.find((t) => t.id === templateId);

      let width: number;
      let height: number;
      let dpiScale = 1;

      if (options.width && options.height) {
        // Explicit CLI overrides
        width = parseInt(options.width);
        height = parseInt(options.height);
        if (options.print) dpiScale = 300 / 72;
      } else if (kitTemplate?.sizes) {
        if (options.print) {
          // Pick the 300dpi size variant from the kit, or scale the first one
          const printSize = kitTemplate.sizes.find((s) => s.dpi >= 300);
          if (printSize) {
            // Kit already defines pixel dimensions at 300dpi — render at 1:1
            width = printSize.width;
            height = printSize.height;
            dpiScale = 1;
          } else {
            // No print size defined — scale the first size to 300dpi
            const baseSize = kitTemplate.sizes[0];
            width = baseSize.width;
            height = baseSize.height;
            dpiScale = 300 / (baseSize.dpi || 72);
          }
        } else {
          // Pick the web/digital size (lowest DPI), or first if all same
          const webSize = kitTemplate.sizes
            .slice()
            .sort((a, b) => (a.dpi || 72) - (b.dpi || 72))[0];
          width = webSize.width;
          height = webSize.height;
        }
      } else {
        // No kit template — use template defaults
        width = parseInt(options.width || '') || tmpl.defaultWidth;
        height = parseInt(options.height || '') || tmpl.defaultHeight;
        if (options.print) dpiScale = 300 / 72;
      }

      const renderWidth = Math.round(width * dpiScale);
      const renderHeight = Math.round(height * dpiScale);
      const label = dpiScale > 1 ? `${renderWidth}x${renderHeight} (${Math.round(dpiScale * 72)}dpi from ${width}x${height})` : `${width}x${height}`;
      console.log(chalk.dim(`Rendering ${templateId} at ${label}...`));

      const element = tmpl.render(kit, data);
      const outPath = await renderToFile(element, kit, {
        width,
        height,
        dpiScale,
        outputPath: path.resolve(options.output),
      });

      console.log(chalk.green(`Rendered → ${outPath}`));
    });

  // Favicon multi-size command
  media
    .command('favicon')
    .description('Generate favicon set (16, 32, 180, 512) from brand kit')
    .option('-k, --kit <path>', 'Path to brand-kit.json', 'brand-kit.json')
    .option('-o, --output <dir>', 'Output directory', './output/favicons')
    .option('-l, --letter <char>', 'Override letter (defaults to first letter of brand name)')
    .action(async (options: { kit: string; output: string; letter?: string }) => {
      const kit = parseBrandKit(JSON.parse(fs.readFileSync(path.resolve(options.kit), 'utf-8')));
      const tmpl = getTemplate('favicon');
      if (!tmpl) { console.error(chalk.red('Favicon template not found')); process.exit(1); }

      const sizes = [
        { size: 16, name: 'favicon-16x16.png' },
        { size: 32, name: 'favicon-32x32.png' },
        { size: 180, name: 'apple-touch-icon.png' },
        { size: 512, name: 'icon-512x512.png' },
      ];

      const outDir = path.resolve(options.output);
      const data = options.letter ? { letter: options.letter } : {};

      for (const { size, name } of sizes) {
        const element = tmpl.render(kit, data);
        const outPath = await renderToFile(element, kit, {
          width: size,
          height: size,
          outputPath: path.join(outDir, name),
        });
        console.log(chalk.green(`  ${size}x${size} → ${outPath}`));
      }
    });
}
