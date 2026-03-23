#!/usr/bin/env node
/**
 * brand-forge CLI
 *
 * Design agency toolkit. One brand kit drives every output.
 */

import { program } from 'commander';
import { registerExportCommand } from './commands/export.js';
import { registerReviewCommand } from './commands/review.js';
import { registerDiffCommand } from './commands/diff.js';
import { registerInitCommand } from './commands/init.js';
import { registerGenerateCommand } from './commands/generate.js';
import { registerMediaCommand } from './commands/media.js';
import { registerSiteCommand } from './commands/site.js';

program
  .name('brand-forge')
  .description('CLI-first design agency toolkit')
  .version('0.1.0');

registerInitCommand(program);
registerGenerateCommand(program);
registerExportCommand(program);
registerMediaCommand(program);
registerSiteCommand(program);
registerReviewCommand(program);
registerDiffCommand(program);

program.parse();
