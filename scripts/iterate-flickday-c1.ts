import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const apiKey = process.env.OPENROUTER_API_KEY;
const model = 'google/gemini-2.5-flash-image';
const outputDir = './output/flickday-iterate/direction-c1';
fs.mkdirSync(outputDir, { recursive: true });

// DIRECTION C1: The F Lettermark
//
// Conceptual anchor: "The Flick" — the decisive gesture of capturing a moment.
// NOT a camera. NOT an aperture. The ACT of shooting, encoded as a letter.
//
// The F is the primary mark. It goes on:
// - Photo watermarks (40px corner of every delivered image)
// - Social avatar (circle crop)
// - Favicon (16-32px)
// - Merch (screen print, embroidery, DTF)
// - Stickers (Hydro Flask size)
//
// Brand colors: Flickday Yellow (#facc15) on black (#000000)
// Font reference: Bebas Neue uppercase (condensed, athletic, no-nonsense)
//
// What "flick" means visually: a single confident stroke with snap/whip at the end.
// Think: calligraphy brush flick, finger snap, shutter click — one fast motion.

const SHARED_CONTEXT = `You are designing a lettermark logo for Flickday Media, a grassroots volleyball photography company in Chicago.

CRITICAL RULES:
- The mark is the letter F. That's it. One letter.
- The F must be IMMEDIATELY readable as the letter F. No abstraction that obscures readability.
- NO cameras. NO apertures. NO shutters. NO lenses. NO viewfinders. NO film strips. NO photography equipment of any kind.
- NO volleyballs. NO sports equipment.
- The letter itself carries ALL the brand energy through its form, weight, and gesture.
- Two-color maximum: Yellow (#facc15) on solid black (#000000) background.
- The mark must work at 32px (favicon) AND at 3 inches (screen print).
- Think: Palace Skateboards triangle, Fila F, Fox Racing head. Letter-marks with built-in attitude.

WHAT "FLICKDAY" MEANS: The flick — a fast, decisive gesture. A shutter click. A finger snap. One moment, captured. The F should FEEL like that gesture — confident, quick, done.`;

const VARIANTS = [
  {
    id: 'flick-stroke',
    prompt: `${SHARED_CONTEXT}

DIRECTION: The F as a single brush stroke with a whip/snap at the terminal.

Imagine someone writing the letter F with a thick marker in one fast motion — the stroke starts heavy at the top-left, sweeps down the stem with confidence, and the crossbar FLICKS out to the right with a sharp snap. The terminal end of the crossbar tapers to a point, like a whip crack or a pen leaving the paper at speed.

The top bar is shorter and bolder. The crossbar is the star — it's where the "flick" lives. That crossbar should feel like kinetic energy frozen mid-gesture.

STYLE: Bold, condensed, slightly italic lean (5-10 degrees). The F has WEIGHT — thick stem, heavy top. But the crossbar ending is sharp and fast. Contrast between heavy and sharp.

OUTPUT: Single letter F mark on solid black background. Yellow (#facc15) only. No text, no tagline, no additional elements. Just the F.`,
  },
  {
    id: 'block-f',
    prompt: `${SHARED_CONTEXT}

DIRECTION: The F as a heavy geometric block letter with one kinetic break.

A thick, condensed, uppercase F built from bold rectangular shapes — like Bebas Neue or Impact but CHUNKIER. Industrial weight. The kind of F you'd stencil on a crate.

BUT: one element breaks the rigidity. The crossbar is OFFSET — shifted slightly right or angled 3-5 degrees, as if the whole letter just got hit by a shockwave. Or the top-right corner of the F is clipped at an aggressive diagonal, creating a speed-cut.

The break should be subtle enough that the F is still perfectly readable, but noticeable enough to give it attitude. Like a playing card that's been flicked across a table — still a card, but with MOTION implied.

STYLE: Geometric, heavy, condensed. Flat fills, no gradients. The break/offset is the only dynamic element. Everything else is solid and confident.

OUTPUT: Single letter F mark on solid black background. Yellow (#facc15) only. No text, no tagline, no additional elements. Just the F.`,
  },
  {
    id: 'speed-cut',
    prompt: `${SHARED_CONTEXT}

DIRECTION: The F with a diagonal speed cut slicing through it.

Start with a bold, clean, condensed uppercase F. Then cut it — a single diagonal line slices through the letter from top-right to bottom-left (or bottom-right to top-left). The cut separates the F into two pieces that are slightly offset, like a card that's been cut in half but the pieces haven't fallen apart yet.

The cut represents the DECISIVE MOMENT — the split-second the shutter fires. Before and after. The gap between the two halves is narrow (2-4px at logo scale) — tight, precise, intentional.

Both halves of the F are still clearly recognizable as parts of the letter F. The cut adds tension and energy without destroying readability.

STYLE: Clean vector. Bold weight. The cut is ruler-straight and confident. No rough edges, no grunge — this is precision, not chaos.

OUTPUT: Single letter F mark on solid black background. Yellow (#facc15) only. No text, no tagline, no additional elements. Just the F.`,
  },
  {
    id: 'snap-f',
    prompt: `${SHARED_CONTEXT}

DIRECTION: The F that snaps — built from negative space and positive space tension.

The letter F is formed partly by a solid yellow shape and partly by the BLACK background showing through. Specifically: the stem of the F is solid yellow, but the crossbars are created by NEGATIVE SPACE — rectangular cutouts in a larger yellow block that reveal the black background.

This creates a snapping, stencil-like quality. The F feels PUNCHED OUT rather than drawn. Like a rubber stamp, a stencil spray, or a press credential badge.

The overall silhouette (the bounding yellow shape) should be a slightly irregular rectangle or rounded rectangle — like a press badge or credential. The F emerges from WITHIN that shape through negative space.

STYLE: Bold, graphic, high-contrast. The interplay between yellow fill and black negative space IS the design. No outlines, no thin elements. Works at any size because it's fundamentally about shape relationships.

OUTPUT: Single letter F mark on solid black background. Yellow (#facc15) and black only. No text, no tagline, no additional elements. Just the F mark.`,
  },
  {
    id: 'motion-f',
    prompt: `${SHARED_CONTEXT}

DIRECTION: The F in motion — the letter caught mid-gesture with speed trails.

A bold condensed F that's LEANING forward (10-15 degree italic). Behind the F (on its left side), 2-3 horizontal speed lines trail off, like the letter is moving fast to the right. The speed lines are the same yellow but thinner — they suggest the F just ARRIVED at this position.

The F itself is solid, heavy, and planted. It's not blurry or distorted — it's sharp and clear. The motion lines are the only dynamic element. They say "this thing MOVES" without compromising the mark's readability or reproduction quality.

Think: the moment after a card is flicked across a table and lands. The card is still. The air is still moving.

The speed lines should be 2-3 simple horizontal bars of decreasing length, evenly spaced, aligned with the crossbar of the F. Clean, geometric, deliberate.

STYLE: Athletic, forward-leaning, confident. Like a racing stripe on a helmet. The F is the main event; the speed lines are supporting evidence.

OUTPUT: Single letter F mark on solid black background. Yellow (#facc15) only. No text, no tagline, no additional elements. Just the F with speed trails.`,
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
