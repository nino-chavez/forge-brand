import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const apiKey = process.env.OPENROUTER_API_KEY;
const model = 'google/gemini-2.5-flash-image';
const outputDir = './output/flickday-iterate/direction-c3';
fs.mkdirSync(outputDir, { recursive: true });

// DIRECTION C3: FM Monogram — M1 Finance style
//
// Reference: M1 Finance logo. The M and the 1 share ONE vertical stroke.
// The right leg of the M IS the 1. Single glyph, two reads, zero waste.
//
// Apply the same principle to FM:
// Find the shared stroke between F and M. One line serves both letters.
// The result should feel like ONE designed glyph, not two letters placed side by side.

const SHARED_CONTEXT = `You are designing a monogram logo combining the letters F and M for Flickday Media.

DESIGN REFERENCE: The M1 Finance logo. In that mark, the M and the 1 share a single vertical stroke — the right leg of the M IS the 1. It reads as one unified glyph. Both characters are immediately legible, but they share geometry so efficiently that the mark feels like a single symbol, not two characters.

Apply this EXACT principle to F and M. Find the stroke(s) they can share. Make one glyph from two letters.

CRITICAL RULES:
- ONE unified glyph. Not two letters placed next to each other. Not two letters overlapping. ONE SHAPE that reads as both F and M.
- Both letters must be clearly readable at a glance.
- NO cameras, apertures, shutters, lenses, volleyballs, or sports equipment.
- Bold, condensed, geometric letterforms. Heavy stroke weight. Athletic feel.
- Yellow (#facc15) on solid black (#000000) background. Two-color only.
- Must work at 32px (favicon) and 3 inches (screen print).
- Clean, precise, minimal. Every stroke earns its place.

OUTPUT: The FM monogram on solid black background. Yellow (#facc15) only. No tagline, no additional text, no decorative elements. Just the monogram.`;

const VARIANTS = [
  {
    id: 'left-stem-shared',
    prompt: `${SHARED_CONTEXT}

STRUCTURAL IDEA: The F's vertical stem IS the M's left leg.

Reading left to right: You see a vertical stem with two horizontal bars extending RIGHT (that's the F). The same vertical stem continues down and is the leftmost leg of the M, whose peaks and right leg extend to the right.

The F occupies the upper portion. The M occupies the lower portion. They share the left vertical as their spine.

Think of it as: one tall vertical line on the left. From the top of that line, two short horizontal bars go right (= F). From the bottom of that line, the M's shape goes right — the V-dip and the right leg.

The transition from F to M happens at the midpoint of the shared vertical. Above: F. Below: M. One continuous left edge.

STYLE: Geometric, ultra-bold, condensed. All strokes the same weight. Like a stencil cut from a single piece of metal.`,
  },
  {
    id: 'right-stem-shared',
    prompt: `${SHARED_CONTEXT}

STRUCTURAL IDEA: The F is on the left. The M is on the right. They share the vertical stroke where they meet — the F's right edge IS the M's left leg.

The F's horizontal bars extend LEFT from the shared vertical. The M's peaks and right leg extend RIGHT from the shared vertical. The shared stroke is the seam that binds them.

This mirrors the M1 Finance approach exactly: two characters sharing the stroke where they connect. Clean seam. No overlap. No interweaving. Just shared geometry.

Read left: F (horizontal bars + shared stem). Read right: M (shared stem + peaks + right leg). Together: one compact glyph.

STYLE: Bold condensed sans-serif. Equal stroke weight throughout. The M should be a pointed/angular M, not rounded. Tight letter spacing — the shared stem means ZERO gap between letters.`,
  },
  {
    id: 'top-bar-becomes-peaks',
    prompt: `${SHARED_CONTEXT}

STRUCTURAL IDEA: The F's top horizontal bar extends right and BECOMES the M's peaks.

Start with a bold F on the left. Its top bar doesn't stop — it continues rightward and transitions into the zigzag peaks of the M (up, down, up). The crossbar of the F stays normal. The M hangs off the F's top bar like a continuation.

The F's top bar and the M's top edge are ONE continuous horizontal line that happens to zigzag into M-peaks on the right side. Below the peaks, the M's two legs descend vertically.

This reads as: F on the left (stem + top bar + crossbar), M on the right (peaks descending from the extended top bar + legs). The top bar is the shared element that ties them together.

STYLE: Geometric and angular. Bold weight. The transition from F's top bar to M's peaks should be sharp and decisive — no curves, no rounded corners. Athletic, like a jersey number.`,
  },
  {
    id: 'f-contains-m',
    prompt: `${SHARED_CONTEXT}

STRUCTURAL IDEA: The negative space inside the F forms the M.

A large bold block F is the primary shape — solid yellow. But the counter spaces (the open areas to the right of the F's bars) are shaped precisely so that the BLACK negative space between and below the F's bars reads as the letter M.

The F is the positive space (yellow). The M is the negative space (black). One shape, two reads. The F is obvious. The M is the discovery — the "aha" moment.

For this to work, the F needs to be a very specific geometric construction where the counter spaces between the top bar, crossbar, and below the crossbar are proportioned to suggest M-like peaks and valleys.

STYLE: Heavy geometric block letter. Maximum area of yellow fill. The negative space must be deliberate and precise. Think FedEx arrow — the secondary read is embedded in the letterform itself.`,
  },
  {
    id: 'diagonal-merge',
    prompt: `${SHARED_CONTEXT}

STRUCTURAL IDEA: The F and M share a diagonal stroke.

The F has a standard vertical stem and top bar. But instead of a horizontal crossbar, the F has a DIAGONAL that descends from left to right. That diagonal IS the left peak of the M — it descends to the M's center valley, then rises again to form the right peak, then descends to the M's right leg.

So the F's "crossbar" is actually the beginning of the M's zigzag. F flows into M through one continuous diagonal line.

Left side: F (vertical stem, top bar, then the diagonal begins). Right side: M (the diagonal continues through the valley and up to the second peak, then down to the right leg).

The shared diagonal creates forward momentum — the whole mark leans right, feels active, has directionality. Like something in motion.

STYLE: Bold, athletic, slightly italic lean. The diagonal shared stroke should be the same weight as the vertical strokes. Angular, no curves. Think racing livery, not corporate identity.`,
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
