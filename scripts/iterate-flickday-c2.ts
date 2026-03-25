import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const apiKey = process.env.OPENROUTER_API_KEY;
const model = 'google/gemini-2.5-flash-image';
const outputDir = './output/flickday-iterate/direction-c2';
fs.mkdirSync(outputDir, { recursive: true });

// DIRECTION C2: F+M Monogram
//
// The letters F and M share geometry. They interlock, overlap, or merge
// so that both letters are readable but form ONE unified mark.
//
// Key constraint: must read as "FM" (Flickday Media) at a glance.
// Secondary read: the shared structure creates visual tension/cleverness.

const SHARED_CONTEXT = `You are designing a monogram logo for Flickday Media, a grassroots volleyball photography company in Chicago.

CRITICAL RULES:
- The mark combines the letters F and M into ONE unified monogram.
- Both letters must be clearly readable. Someone seeing this for the first time should read "FM" within 2 seconds.
- NO cameras. NO apertures. NO shutters. NO lenses. NO photography equipment. NO volleyballs. NO sports equipment.
- The cleverness comes from how the two letters SHARE geometry — shared strokes, interlocking shapes, or structural overlap.
- Two-color maximum: Yellow (#facc15) on solid black (#000000) background.
- The mark must work at 32px (favicon) AND at 3 inches (screen print).
- Style reference: athletic, condensed, bold. Think ESPN, Fox Sports, UFC monograms — heavy letterforms with structural interplay.
- This is a SPORTS MEDIA mark. It should feel fast, confident, and decisive.

OUTPUT: The FM monogram on solid black background. Yellow (#facc15) only. No tagline, no additional text, no decorative elements. Just the monogram.`;

const VARIANTS = [
  {
    id: 'shared-stem',
    prompt: `${SHARED_CONTEXT}

DIRECTION: F and M share a vertical stem.

The right vertical stroke of the F IS the left vertical stroke of the M. One line serves double duty. The F's crossbars extend left, the M's peaks and right leg extend right. The shared stem is the spine of the whole mark.

Both letters are bold, condensed, uppercase. The F is on the left side of the shared stem, the M is on the right. The shared stem is the heaviest element — it's the anchor that holds the monogram together.

The M should be a classic pointed M (not rounded) — the center V dips down to create clear M readability. The F's top bar and crossbar are short and decisive, extending left from the stem.

PROPORTIONS: The F is slightly narrower than the M (F is simpler, needs less width). Total aspect ratio should be roughly 3:4 (width:height). Condensed and tall.`,
  },
  {
    id: 'rotated-m',
    prompt: `${SHARED_CONTEXT}

DIRECTION: The M is rotated 90 degrees clockwise, and its top edge becomes the crossbar of the F.

Start with a bold condensed F. The crossbar of the F is actually a sideways M — rotated 90 degrees so its peaks point to the right. The M's zigzag pattern (the two peaks of a capital M) reads horizontally as the crossbar element of the F.

This is a visual pun: the F contains the M. One letter lives inside the other. At first glance you see an F with an unusual crossbar. On second look, the crossbar IS an M turned on its side.

The F's vertical stem is heavy and straight. The rotated M-crossbar should be sized so it clearly reads as both "the crossbar of an F" and "a sideways M." The peaks of the M should be sharp and distinct.

Keep the top bar of the F as a simple horizontal — only the CROSSBAR is the rotated M. This maintains F readability while embedding the M.`,
  },
  {
    id: 'nested-cutout',
    prompt: `${SHARED_CONTEXT}

DIRECTION: The M is cut out of (negative space within) the F.

A large, bold, block letter F fills most of the frame. Within the solid yellow area of the F — specifically in the lower portion of the stem or in the counter space — the letter M appears as BLACK negative space cut out of the yellow.

The F is the dominant read (big, yellow, obvious). The M is the secondary discovery (smaller, black, embedded). This creates a nice hierarchy: F for Flickday (the brand name), M for Media (the descriptor).

The M cutout should be positioned where the F has the most solid area — likely in the lower-left portion of the stem, below the crossbar. The M should be small but crisp and clearly readable.

STYLE: The F is geometric, heavy, blocky — maximum solid area to house the M cutout. Think slab-serif or ultra-bold sans. The M cutout is clean and sharp-edged.`,
  },
  {
    id: 'interlocked',
    prompt: `${SHARED_CONTEXT}

DIRECTION: F and M physically interlock like puzzle pieces or chain links.

The F and M are separate letterforms that OVERLAP and weave through each other. Where they cross, one letter passes in front of the other (alternating which is on top). This creates a woven/interlocked effect.

Specifically: the F's crossbar passes THROUGH a gap in the M (between the M's two humps or through one of its legs). And one of the M's legs passes BEHIND the F's stem. The letters are physically entangled.

This interlock means you can't separate them — they're bonded. Which is the point: Flickday and Media are one thing, not two.

Both letters are the same weight, same height, same style — they're equals. Bold condensed sans-serif. The overlap areas should be clearly rendered (one in front, one behind) using the yellow color at different values or using thin black separation lines.

The overall silhouette should be compact — the letters overlap enough that the total width is less than F-width + M-width. Tight, locked together.`,
  },
  {
    id: 'stacked-ligature',
    prompt: `${SHARED_CONTEXT}

DIRECTION: F sits on top of M, sharing horizontal strokes as a ligature.

The F is on top. The M is on the bottom. They share a horizontal line in the middle — the BOTTOM bar of the F is the TOP edge of the M. One stroke, two purposes.

This creates a vertical stack: F over M, connected by their shared horizontal. The overall shape is a tall, narrow rectangle — great for vertical applications (watermarks on portrait photos, story posts, credential badges).

The F's top bar extends to the right. The shared middle bar spans the full width. The M's legs descend below, with the characteristic M peaks visible.

PROPORTIONS: Tall and narrow. Roughly 1:2 (width:height). The shared bar is at the vertical midpoint. This should feel like a sports jersey number — bold, stacked, institutional.

Both letters are ultra-bold, geometric, condensed. No thin strokes anywhere. Minimum stroke width should be ~15% of total mark width.`,
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
