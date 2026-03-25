import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const apiKey = process.env.OPENROUTER_API_KEY;
const model = 'google/gemini-2.5-flash-image';
const outputDir = './output/flickday-iterate/direction-c5';
fs.mkdirSync(outputDir, { recursive: true });

// DIRECTION C5: Italic FM monogram with ACTUAL shared geometry
//
// What worked in C4: interlocked-italic had the right FEEL — fast, athletic, forward-leaning
// What failed: it was just two italic letters side by side. No shared strokes. No M1-style fusion.
//
// This round: italic lean + real structural sharing. Every variant must have at least
// one stroke that belongs to BOTH letters simultaneously.

const BASE = `Design a monogram combining the letters F and M into ONE glyph for Flickday Media, a grassroots volleyball photography brand.

MANDATORY STRUCTURAL CONSTRAINT — SHARED GEOMETRY:
The F and M must share at least ONE stroke. One line that is simultaneously part of both letters. Like the M1 Finance logo where the M's right leg IS the 1. Not two letters placed next to each other. Not overlapping. SHARED. One stroke serving two masters.

MANDATORY STYLE CONSTRAINT — ITALIC:
The entire mark leans forward 10-15 degrees to the right. All vertical strokes are angled. This creates athletic, forward-momentum energy. Like a racing team mark.

MANDATORY RULES:
- NO cameras, apertures, lenses, shutters, viewfinders, film, or photography equipment
- NO volleyballs or sports equipment
- NO decorative elements — speed lines, particles, debris, swooshes, or flourishes
- JUST the letterforms. Nothing else.
- Bold, condensed, heavy stroke weight
- Yellow (#facc15) on solid black (#000000). Two-color only
- Must work at 32px AND at 3 inches
- OUTPUT: The FM monogram on black. Yellow only. No text, no tagline. ONLY the fused lettermark.`;

const VARIANTS = [
  {
    id: 'italic-shared-stem-v1',
    prompt: `${BASE}

SHARED STROKE: The F's right vertical edge IS the M's left leg. They share this angled stroke.

Construction: Draw the F first — italic, bold, condensed. Its rightmost vertical stroke (where the horizontal bars terminate) continues downward and becomes the M's left leg. From that shared angled stroke, the M's two peaks angle up-right, hit the center valley, and the right leg descends.

The F reads on the left (stem + bars ending at the shared stroke). The M reads on the right (shared stroke + peaks + right leg). The shared stroke is the SEAM — invisible, doing double duty.

All strokes lean at the same italic angle. Horizontal bars of the F are truly horizontal (they don't lean). The contrast between leaning verticals and flat horizontals creates the athletic tension.

WEIGHT: Ultra-bold. Stroke width ~18-20% of mark height. Condensed proportions — the mark is taller than wide.`,
  },
  {
    id: 'italic-shared-stem-v2',
    prompt: `${BASE}

SHARED STROKE: Same concept as v1 — F's right edge IS M's left leg — but with a WIDER M.

The M should be noticeably wider than the F. The F is compact (it's a simpler letter). The M spreads out to the right with confident, wide-set peaks. This creates an asymmetric silhouette — narrow left, wide right — which adds dynamism.

The M's peaks should be sharp 45-degree angles, not rounded. The center valley of the M should be SHALLOW (about 30% of letter height) — this keeps the mark bold and heavy rather than spindly.

Think of the overall silhouette as a forward-leaning trapezoid — narrow at the F end, wide at the M end. Like a car going fast, wider at the back.`,
  },
  {
    id: 'italic-crossbar-bridge',
    prompt: `${BASE}

SHARED STROKE: The F's crossbar extends rightward and becomes the M's left peak descent.

The F has a vertical stem, a top bar, and a crossbar. Instead of the crossbar ending, it continues to the right and angles DOWNWARD — becoming the left slope of the M's center valley. From the valley, it rises to the M's right peak, then descends as the right leg.

So the F's crossbar IS the M's left peak. One horizontal-turning-diagonal stroke that starts as part of the F and becomes part of the M. The bridge between the letters.

The F's top bar is separate and shorter — it stays within F territory. The crossbar is the star: it's the connection point, the shared element, the thing that makes this one glyph instead of two letters.

All verticals lean italic. The crossbar-to-diagonal transition should be a clean angle change, not a curve.`,
  },
  {
    id: 'italic-unified-outline',
    prompt: `${BASE}

SHARED STROKE: The entire mark is ONE continuous closed shape. You could trace the outline without lifting your pen.

Starting from the bottom-left of the F's stem, trace UP the stem (italic lean), across the TOP BAR to the right, DOWN the right side (this becomes the M's left leg going into the first peak), UP to the M's right peak, DOWN the M's right leg to the baseline, LEFT across the baseline back to where you started.

The F's counter spaces (the gaps between the bars) and the M's center valley are HOLES cut into this solid shape. But the outer outline is continuous.

This means the F and M don't just share ONE stroke — they share their ENTIRE outer boundary. They are literally one shape with internal cutouts that create the letter recognition.

FILL: Solid yellow fill with black cutouts for the F's counters and the M's valley. Heavy, blocky, monolithic.`,
  },
  {
    id: 'italic-lightning',
    prompt: `${BASE}

SHARED STROKE: A single diagonal that serves as BOTH the F's crossbar AND the M's left peak.

Imagine a bold italic F. Now replace its horizontal crossbar with a diagonal that descends from left to right at about 45 degrees. That diagonal continues past the F's right edge and becomes the left descending slope of the M.

The result is a LIGHTNING-BOLT-like zigzag running through the center of the mark: F's crossbar angles down-right, hits the M's valley, then angles up-right to the M's second peak.

Above the lightning: the F's top bar and the M's right peak. Below the lightning: the F's stem base and the M's two legs.

The zigzag diagonal is the SPINE of the entire mark. It's the most prominent stroke — maybe slightly heavier than the other strokes. It's what your eye follows.

This should feel like ENERGY running through the letterforms. Not decorative — structural. The lightning IS the shared geometry.`,
  },
];

async function run() {
  for (const variant of VARIANTS) {
    console.log(`Generating ${variant.id}...`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/nino-chavez/brand-forge',
        'X-Title': 'brand-forge',
      },
      body: JSON.stringify({
        model,
        modalities: ['text', 'image'],
        messages: [{ role: 'user', content: variant.prompt }],
      }),
    });

    if (!response.ok) {
      console.error(`  ${variant.id}: error ${response.status}`);
      continue;
    }

    const data = await response.json() as any;
    const message = data.choices?.[0]?.message;
    const buffer = extractImage(message);

    if (!buffer) {
      console.error(`  ${variant.id}: no image`);
      continue;
    }

    const filePath = path.join(outputDir, `${variant.id}.png`);
    fs.writeFileSync(filePath, buffer);
    console.log(`  -> ${filePath}`);
  }
}

function extractImage(message: any): Buffer | null {
  if (!message) return null;
  if (message.images?.length > 0) {
    const img = message.images[0];
    if (img?.image_url?.url) return decode(img.image_url.url);
    if (typeof img === 'string') return decode(img);
    if (img?.url) return decode(img.url);
    if (img?.b64_json) return Buffer.from(img.b64_json, 'base64');
  }
  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (part.type === 'image_url' && part.image_url?.url) return decode(part.image_url.url);
      if (part.inline_data?.data) return Buffer.from(part.inline_data.data, 'base64');
    }
  }
  return null;
}

function decode(url: string): Buffer {
  return Buffer.from(url.replace(/^data:image\/\w+;base64,/, ''), 'base64');
}

run();
