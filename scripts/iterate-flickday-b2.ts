import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const kit = JSON.parse(fs.readFileSync('presets/flickday.json', 'utf-8'));
const apiKey = process.env.OPENROUTER_API_KEY;
const model = 'google/gemini-2.5-flash-image';
const outputDir = './output/flickday-iterate/direction-b2';
fs.mkdirSync(outputDir, { recursive: true });

const VARIANTS = [
  {
    id: 'bold-action',
    prompt: `Design a bold, aggressive sports media logo mark.

THIS IS NOT A PHOTOGRAPHY STUDIO. This is a grassroots ACTION SPORTS MEDIA brand. Think ESPN, Barstool, Overtime — not portrait photography.

The mark must feel like you'd see it on a sideline photographer's vest, stamped on courtside equipment, or screen-printed on a black tee that players actually want to wear.

CORE VISUAL: Camera aperture blades (6-blade iris) EXPLODING outward with kinetic energy — the blades are mid-burst, catching the peak action moment. Speed lines, impact marks, motion blur trails. The aperture is OPENING, not static.

STYLE: Bold, heavy, high-contrast. Think sports brand mark, not tech company icon. Thick confident strokes. Would look right on a snapback hat brim or embroidered on a coaches polo.

COLORS: Flickday Yellow (#facc15) and black only. No gradients, no gray. Two-color screen print ready.

CRITICAL: NO text, NO letters, NO typography. Mark only. On black background.`,
  },
  {
    id: 'impact-freeze',
    prompt: `Design a logo mark that captures the DECISIVE MOMENT — the split-second a camera shutter fires during peak action.

Concept: Camera aperture blades mid-snap, with a volleyball spike impact wave radiating from center. The aperture is the explosion point — energy radiates outward like a shockwave. Volleyball panel geometry visible in the negative space between aperture blades.

This mark should make someone think "that's the company that caught THAT shot." Peak action, frozen in time.

FEEL: Athletic, aggressive, premium. Like Nike's swoosh has a cousin that shoots sports. Not cute, not clean — BOLD. The kind of mark you'd see on a black hoodie and think "I need to know what that is."

EXECUTION: Solid fills, no outlines. Shapes only. Maximum 3-4 elements. Must work at 1 inch and at 12 inches. Screen print ready.

COLORS: Flickday Yellow (#facc15) on black. Single color mark.

CRITICAL: NO text, NO letters, NO typography. Pure graphic mark. On black (#000000) background.`,
  },
  {
    id: 'courtside-badge',
    prompt: `Design a sports media credential badge mark — the kind of graphic you'd see on a press pass lanyard or courtside photographer's armband.

NOT a literal badge shape. The ENERGY of a badge — authoritative, earned, official. Combined with the raw kinetic energy of being courtside at a volleyball tournament.

CORE ELEMENTS:
- Camera aperture as the central icon, but DYNAMIC — tilted, in motion, aggressive angle
- Motion trails suggesting the photographer is moving WITH the action, not standing still
- The feeling of a shutter burst — rapid fire, multiple frames, capturing everything

THIS IS NOT: A stock photography icon. A camera silhouette. A gentle, clean logo. This is GRASSROOTS SPORTS MEDIA. Chicago. Volleyball. Sand. Sweat. Spikes.

WEIGHT: Heavy. This mark has mass. It hits hard visually. Bold fills, thick shapes, confident. Looks like it was stamped in hot metal, not drawn with a thin pen.

COLORS: Yellow (#facc15) and white (#ffffff) on black. DTF transfer ready — this goes on a black tee.

CRITICAL: NO text. NO letters. Pure mark. On black (#000000) background.`,
  },
  {
    id: 'shutter-burst',
    prompt: `Design a mark that IS the sound of a camera shutter firing during a volleyball spike.

Visualize: CLACK-CLACK-CLACK-CLACK — rapid burst mode. The mark is the visual equivalent of that sound. Fast, aggressive, mechanical, satisfying.

The aperture blades are in MOTION — not a static iris, but blades caught mid-rotation with afterimage trails. Like a long exposure of a spinning aperture. Multiple blade positions overlapping to create a dynamic, energetic radial form.

Around or through the aperture: volleyball panel curves — the hexagonal seam pattern of a volleyball, woven into the blade motion. The ball IS the aperture. The aperture IS the ball.

WEARABILITY TEST: Would a 25-year-old competitive volleyball player put this on a sticker on their water bottle? Would they want this on a black tee? If not, it's not aggressive enough.

EXECUTION: Single color yellow (#facc15) on black. No thin lines — everything bold enough to screen print at 3 inches. Solid shapes, not outlines.

CRITICAL: NO text. NO letters. NO typography. Mark only. Black background.`,
  },
  {
    id: 'raw-mark',
    prompt: `Design the most WEARABLE version of a sports media logo mark.

Forget everything about "logo design rules." Think about what mark you'd actually want on a black tee, a snapback, a sticker. Think about marks people ACTUALLY wear: Jordan Jumpman, Vans off-the-wall, Stussy, Palace. Simple. Bold. Attitude.

This mark is for FLICKDAY MEDIA — a grassroots sports media company that shoots volleyball tournaments in Chicago. They're courtside, in the sand, getting the shots nobody else gets.

The mark should combine TWO things and TWO things only:
1. Camera aperture (6 blades) — the tool
2. Explosive motion energy — the action

No viewfinder frames. No metadata readouts. No brackets. No UI elements. Just the MARK. Raw, bold, wearable.

SIZE: Must look good from 1 inch (hat embroidery) to 12 inches (back of tee).
COLORS: Yellow (#facc15) on black. Period.
WEIGHT: Heavy. Confident. No whispy thin lines.

CRITICAL: ABSOLUTELY NO text, letters, words, or typography of any kind. GRAPHIC MARK ONLY. On solid black (#000000) background.`,
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
    console.log(`  → ${filePath}`);
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
