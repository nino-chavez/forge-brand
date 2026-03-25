import 'dotenv/config';
import { iterateLogoConcept } from '../src/core/generators/logo-iterate.js';
import fs from 'node:fs';
import path from 'node:path';

const kit = JSON.parse(fs.readFileSync('presets/flickday.json', 'utf-8'));

// Direction A: Volleyball-aperture hybrid with motion (concept 2)
console.log('\n=== Direction A: Volleyball-Aperture Hybrid ===\n');
const dirA = await iterateLogoConcept({
  direction: `Volleyball-aperture hybrid mark with motion energy. The volleyball panel lines merge with camera aperture blade geometry to create a single unified circular mark. Speed lines or motion trails radiate from one side, suggesting fast action and shutter speed. The volleyball panels and aperture blades should be visually integrated — not two separate elements overlaid, but one cohesive shape where you can read both volleyball and camera simultaneously. Yellow (#facc15) primary with black negative space.`,
  name: 'Flickday Media',
  basePrompt: kit.media.creative.basePrompt,
  avoid: kit.media.creative.avoid,
  outputDir: './output/flickday-iterate/direction-a',
});
for (const v of dirA) console.log(`  ${v.variant} → ${v.path}`);

// Direction B: Viewfinder HUD (concept 3)
console.log('\n=== Direction B: Viewfinder HUD ===\n');
const dirB = await iterateLogoConcept({
  direction: `Camera viewfinder / heads-up display mark. A squared viewfinder frame with corner focus brackets, center aperture motif, and subtle energy lines suggesting the moment of capture. Camera metadata zones (shutter speed, f-stop indicators) as decorative geometric elements — NOT readable text, just geometric shapes that evoke camera readouts. The viewfinder frame creates structured negative space. Yellow (#facc15) lines and elements on transparent/dark background.`,
  name: 'Flickday Media',
  basePrompt: kit.media.creative.basePrompt,
  avoid: kit.media.creative.avoid,
  outputDir: './output/flickday-iterate/direction-b',
});
for (const v of dirB) console.log(`  ${v.variant} → ${v.path}`);

console.log('\nDone. Review at output/flickday-iterate/');
