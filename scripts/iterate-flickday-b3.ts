import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const apiKey = process.env.OPENROUTER_API_KEY;
const model = 'google/gemini-2.5-flash-image';
const outputDir = './output/flickday-iterate/direction-b3';
fs.mkdirSync(outputDir, { recursive: true });

// Courtside-badge had the right VIBE: editorial, earned, action sports media, debris/energy field
// Wrong CONCEPT: abstract shapes, not connected to what the brand actually does
//
// What the brand does: shoots grassroots volleyball. Courtside. In the sand. Fast turnaround.
// The mark needs to say "action sports media" not "camera company" or "photography studio"

const VARIANTS = [
  {
    id: 'shutter-impact',
    prompt: `Design a sports media logo mark.

VIBE REFERENCE: The energy of courtside-badge — editorial action sports, debris field, explosive moment, earned-not-given attitude. Like something you'd see on a photographer's vest at the X Games or on Overtime's merch.

CONCEPT: A camera shutter blade arrangement (6 blades) caught in the MOMENT OF IMPACT — not gently open, but SNAPPING shut like a jaw. The blades have weight and velocity. Around the shutter: impact debris — small geometric fragments, speed particles, energy dots flying outward from the snap point. Like the shutter itself just hit something.

NOT an aperture sitting pretty. A shutter ATTACKING. Fast. Violent. Decisive.

The overall silhouette should be ASYMMETRIC — leaning forward, angled, like it's in motion. Not centered and balanced. Logos that feel static feel corporate. This leans into the action.

WEIGHT: Heavy fills. No thin outlines. Screen print at 3 inches minimum.
COLORS: Yellow (#facc15) on solid black (#000000). Two-color only.
NO TEXT. NO LETTERS. GRAPHIC MARK ONLY.`,
  },
  {
    id: 'flash-burst',
    prompt: `Design a logo mark for a grassroots action sports media company.

CONCEPT: The FLASH — the moment a camera flash fires during a peak action play. Not a gentle light — an EXPLOSION of light freezing a moment in time.

The mark is a camera aperture at the center of a directional flash burst. The burst is NOT symmetrical — it's angled, like the photographer is shooting from below (courtside angle, looking UP at a spike). Energy radiates upward and outward, heavy on one side.

This should feel like a freeze-frame from an action sports highlight reel — the exact frame where the flash catches the peak moment.

ATTITUDE: This mark goes on black tees that volleyball players actually buy. It goes on stickers that end up on Hydro Flasks. It's not precious — it's BOLD.

EXECUTION: Chunky shapes. Confident fills. No filigree. Would survive embroidery at 2 inches.
COLORS: Yellow (#facc15) and white (#ffffff) on solid black (#000000).
NO TEXT. NO LETTERS. MARK ONLY.`,
  },
  {
    id: 'motion-capture',
    prompt: `Design a logo mark that IS the act of capturing fast action.

CONCEPT: Camera aperture blades forming a claw/grab — like the shutter is REACHING OUT to grab the moment. The blades extend forward asymmetrically, creating a dynamic forward-motion shape. Behind the aperture: motion streaks suggesting the photographer is RUNNING with the play, not standing still.

Think about what makes action sports photography different from studio photography: MOVEMENT. The photographer moves. The subjects move. The camera moves. Nothing is static.

The mark should have a clear direction — it's GOING somewhere. Top-right diagonal momentum. Like a Nike swoosh has directionality, this mark leans forward.

Silhouette test: If you saw this mark at 50 feet on a black hoodie, you'd think "sports" before "camera."

WEIGHT: Bold. Athletic. Chunky. NOT delicate.
COLORS: Yellow (#facc15) on solid black (#000000).
NO TEXT. NO LETTERS. MARK ONLY.`,
  },
  {
    id: 'frame-smash',
    prompt: `Design a logo mark for an action sports media brand.

CONCEPT: A camera viewfinder frame being BROKEN THROUGH from the inside — the action is so intense it can't be contained by the frame. The rectangular viewfinder brackets are cracking/shattering at the corners, and aperture-blade energy is bursting through the breaks.

This is about the tension between the camera (structured, mechanical, precise) and the sport (chaotic, explosive, human). The mark captures that collision.

The viewfinder frame gives structure. The burst gives energy. Together they say "we capture what can't be contained."

This should read as a SPORTS MEDIA mark, not a tech company logo. Think: if Red Bull had a media production arm that only shot volleyball. That energy level.

EXECUTION: Bold shapes, heavy fills. Fragments should be chunky, not dust. Works at 2 inches embroidered.
COLORS: Yellow (#facc15) on solid black (#000000). Maybe small white (#ffffff) accents for the break points.
NO TEXT. NO LETTERS. MARK ONLY.`,
  },
  {
    id: 'aperture-strike',
    prompt: `Design the simplest, boldest possible mark for a sports media company.

CONSTRAINT: Maximum 4 shapes total. That's it. 4 shapes that say "action sports media."

CONCEPT: A camera aperture (simplified to 3-4 blades, not 6) with ONE aggressive speed line or motion trail. The aperture is tilted 15-20 degrees off-axis — it's not sitting level, it's been THROWN into motion. The speed element is thick, confident, directional.

This is the "swoosh test" — can you draw it in 3 seconds? Can you recognize it at 20 feet? Does it have attitude?

Reference attitude: Palace Skateboards triangle. Stussy S. Thrasher flame. Not refined — RAW.

The mark should feel like it was spray-painted on a wall, not designed in Illustrator. Even though it IS clean vector art, the ENERGY should feel street-level, grassroots, independent.

COLORS: Yellow (#facc15) on solid black (#000000). Single color mark.
NO TEXT. NO LETTERS. 4 SHAPES MAXIMUM. MARK ONLY.`,
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
