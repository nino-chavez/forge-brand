import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const apiKey = process.env.OPENROUTER_API_KEY;
const model = 'google/gemini-2.5-flash-image';
const outputDir = './output/flickday-iterate/direction-c4';
fs.mkdirSync(outputDir, { recursive: true });

// DIRECTION C4: Refinements on C3's three best concepts
// - right-stem-shared (interlocked): F bars left, M peaks right, shared vertical seam
// - diagonal-merge (merge): F flows into M through a shared diagonal stroke
// - top-bar-becomes-peaks (peaks): F's right edge = M's left leg, compact square glyph

const BASE = `You are designing a monogram logo combining F and M for Flickday Media, a grassroots volleyball photography company.

REFERENCE: The M1 Finance logo — M and 1 share one stroke, reading as a single unified glyph. Apply this same economy to FM.

RULES:
- ONE unified glyph. Both letters clearly readable.
- NO cameras, apertures, lenses, volleyballs, or sports equipment.
- Bold, condensed, geometric. Heavy stroke weight. Athletic.
- Yellow (#facc15) on solid black (#000000). Two-color only.
- Must work at 32px favicon AND 3-inch screen print.
- Clean vector aesthetic. Every stroke earns its place.
- OUTPUT: FM monogram on black. Yellow only. No text, no tagline. Just the mark.`;

const VARIANTS = [
  // === INTERLOCKED variants (right-stem-shared refinements) ===
  {
    id: 'interlocked-clean',
    prompt: `${BASE}

STRUCTURE: The F and M share ONE vertical stroke in the center. The F's horizontal bars extend LEFT from this shared vertical. The M's two peaks and right leg extend RIGHT from this shared vertical.

REFINEMENT: Make it CLEANER than last round. Equal stroke width everywhere. The M's peaks should be sharp 45-degree angles — crisp, not rounded. The F's two horizontal bars should be the exact same length and weight. Perfect geometric construction.

The overall silhouette should be roughly rectangular — slightly wider than tall. The shared vertical is dead center. Left half = F. Right half = M. Symmetry in construction, asymmetry in letterform.

Think: if you split the mark down the shared vertical, the left half reads F, the right half reads M. Together: one interlocked glyph.`,
  },
  {
    id: 'interlocked-heavy',
    prompt: `${BASE}

STRUCTURE: Same as interlocked-clean — F bars go left, M peaks go right, shared vertical center stroke. But HEAVIER.

Make the stroke weight about 20-25% of the total mark width. Chunky, industrial, BOLD. The negative space (black gaps) between strokes should be narrow — just enough for legibility. The yellow dominates.

The M's center valley should be a shallow V (not a deep dip) — this keeps the mark compact and heavy. The F's crossbar should be positioned at the exact height where the M's valley hits the shared vertical.

This version prioritizes IMPACT over elegance. It should look like it was stamped in metal. Screen-print-ready. Would work as a 1-inch embroidered patch.`,
  },
  {
    id: 'interlocked-italic',
    prompt: `${BASE}

STRUCTURE: Same interlocked concept — F left, M right, shared vertical — but the ENTIRE mark is italicized 10-12 degrees to the right.

The italic lean adds forward momentum. The mark feels like it's in motion. Athletic, aggressive. Like a racing team monogram on the side of a helmet.

All vertical strokes lean at the same angle. Horizontal bars remain truly horizontal (they don't follow the lean). This creates a dynamic tension between the leaning verticals and the stable horizontals.

The M's peaks should be sharp and angular. The overall silhouette is a parallelogram, not a rectangle.`,
  },
  // === MERGE variants (diagonal-merge refinements) ===
  {
    id: 'merge-single-diagonal',
    prompt: `${BASE}

STRUCTURE: The F transitions into the M through ONE shared diagonal stroke.

Left side: a bold vertical stem with a top horizontal bar (the F). From the crossbar position of the F, a single diagonal descends to the right — this IS both the F's crossbar (reimagined as diagonal) and the M's left peak slope.

The diagonal hits a valley point, then rises as the M's right peak, then descends as the M's right leg.

The key: the diagonal is ONE continuous line that starts as part of the F and ends as part of the M. It's the bridge between the letters. No break, no seam — one flowing transition.

The F's top bar is horizontal and grounding. Everything below it flows diagonally into M territory. The mark has strong directionality — top-left to bottom-right energy.

Keep it SIMPLE. Stem + top bar + diagonal-that-becomes-M + right leg of M. That's 4-5 strokes total. No more.`,
  },
  {
    id: 'merge-angular',
    prompt: `${BASE}

STRUCTURE: F and M merge through angular connections — NO curves, all straight lines at sharp angles.

The F's vertical stem anchors the left. Its top bar goes right. From the end of the top bar, a diagonal descends (this begins the M). The diagonal hits the M's center valley, then another diagonal rises to the M's second peak, then a final vertical descends as the M's right leg.

The ENTIRE mark is one continuous outline — you could trace it without lifting your pen. F flows into M through connected angles. Like a zigzag with purpose.

Think of it as an angular lightning bolt that happens to read as FM. The angles create energy. Every corner is sharp — 45 or 60 degree angles only. No 90-degree corners except at the F's stem-to-top-bar junction.

The mark should feel like it was cut from sheet metal with a plasma cutter. Industrial, angular, decisive.`,
  },
  {
    id: 'merge-compact',
    prompt: `${BASE}

STRUCTURE: The F-to-M diagonal merge, but compressed into a SQUARE aspect ratio.

The mark fits inside a perfect square bounding box. The F is compressed and the M is compressed so that the diagonal transition happens in tight quarters. This makes the mark work perfectly as:
- Social media avatar (square crop)
- App icon
- Favicon
- Photo watermark

The F's stem is on the far left edge of the square. The M's right leg is on the far right edge. The diagonal transition happens across the middle third.

Because it's compressed, the diagonal is steeper (closer to 60 degrees than 45). This makes the mark feel taller and more aggressive within the square frame.

IMPORTANT: The square constraint should make it feel TIGHTER and more energetic, not cramped. Every stroke should breathe but just barely.`,
  },
  // === PEAKS variants (top-bar-becomes-peaks refinements) ===
  {
    id: 'peaks-flush',
    prompt: `${BASE}

STRUCTURE: F on the left, M on the right. They share a vertical stroke where they meet. The F's top bar and the M's top-left peak are at the SAME HEIGHT — flush top edge across the entire mark.

The F is a standard bold condensed F: vertical stem, top bar extending right to the shared vertical, crossbar extending right to the shared vertical. The M starts at the shared vertical: its left peak rises to match the F's top bar height, descends to the center valley, rises to the right peak (same height), descends to the right leg.

KEY: The top edge of the entire mark is ONE continuous horizontal line — the F's top bar flows seamlessly into the M's peak line. The bottom edge has two feet (F's stem base and M's right leg base) at the same height.

This creates a clean rectangular silhouette with the M's center valley as the ONLY break in the outline. That valley is the visual hook — the one detail that makes the mark interesting.

PROPORTIONS: The F should be about 40% of total width, the M about 60% (M is naturally wider). Total aspect ratio roughly 5:4 (width:height).`,
  },
  {
    id: 'peaks-condensed',
    prompt: `${BASE}

STRUCTURE: Same as peaks-flush but ULTRA-CONDENSED. The mark is much taller than wide — roughly 2:3 (width:height).

Both F and M are squeezed horizontally. The F's bars are short stubs. The M's peaks are narrow and steep. The shared vertical is prominent because everything is so compressed around it.

This tall, narrow proportion makes the mark feel like:
- A press credential badge
- A jersey number
- A racing stripe element
- A vertical watermark on portrait-orientation photos

The condensed proportion also means the mark can be used as a VERTICAL element — running along the side of a photo, down the spine of a document, as a sidebar brand element.

Ultra-bold weight. The strokes should be THICK relative to the narrow width — maybe 25-30% of total width. Heavy, stacked, compressed energy.`,
  },
  {
    id: 'peaks-notched',
    prompt: `${BASE}

STRUCTURE: The peaks concept, but the M's center valley is a sharp NOTCH cut into an otherwise solid rectangular block.

Start with a solid yellow rectangle. The F is formed by two horizontal slots cut into the left side (creating the F's counter spaces). The M is formed by a single V-shaped notch cut into the bottom-center-right area.

The entire mark is ONE solid yellow shape with strategic cuts/notches removed. Like a block of metal with precision cuts. The F and M emerge from SUBTRACTION, not construction.

This is the most minimal version — maximum solid area, minimum cuts to achieve FM legibility. The fewer cuts, the bolder the mark.

Target: 3 cuts total. Two horizontal slots (left side, creating F), one V-notch (right side, creating M). That's it. Three precise subtractions from a rectangle.`,
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
