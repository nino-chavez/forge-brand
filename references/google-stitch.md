# Google Stitch — Design Reference Audit

> **Source**: https://stitch.withgoogle.com
> **Audited**: 2026-03-23
> **Category**: AI design generation tool (Google Labs)
> **Stack**: Dark mode default, iframe-based app, Gemini 3.0 Flash
> **Screenshots**: `stitch-*.png` in project root

---

## 0. Nino's Stitch Inventory

### Projects (Last Year)
- Club Match Hub (Nov 3, 2025)
- Event/Club Selection (3 iterations, Nov 3, 2025)
- New Project (Nov 3, 2025)
- My Coverage Plan (Nov 3, 2025)
- Dashboard/Timeline View (Nov 1, 2025, Shared)
- Finance Dashboard (Oct 28, 2025)
- Tournament list screen review (Sep 4, 2025)
- Tournament management app design (Sep 2, 2025)

**Note**: Several Rally HQ/tournament-related design explorations already exist here.

---

## 1. Visual Identity

### Color System
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#1A1A1A` | Page background (dark mode) |
| Surface | `#262626` | Sidebar, cards |
| Surface elevated | `#333333` | Input areas, hover states |
| Border | `#444444` | Subtle borders, input outlines |
| Text primary | `#FFFFFF` | Headings, project names |
| Text secondary | `#AAAAAA` | Dates, metadata |
| Text placeholder | `#888888` | Input placeholders |
| Accent | None | No accent color — pure monochrome |
| Suggestion pills | `#333333` bg, `#CCCCCC` border | Prompt suggestion chips |
| Button active | White text on dark bg | Toggle buttons (App/Web) |
| CTA disabled | `#555555` | Generate button when disabled |

### Typography
| Role | Font | Size | Notes |
|------|------|------|-------|
| Welcome heading | Serif (Google Serif/Noto), light weight | ~48px | "Welcome to Stitch.." — very large, elegant |
| Project name | Sans-serif, medium | ~14px | Sidebar list items |
| Section label | Sans-serif, regular | ~13px | "Last Year", "Examples" — gray, not uppercase |
| Date metadata | Sans-serif, regular | ~12px | Gray, with calendar icon |
| Input placeholder | Sans-serif, regular | ~16px | "What native mobile app shall we design?" |
| Badge | Sans-serif, medium | ~11px | "BETA" next to logo, "Shared" next to date |
| Model label | Sans-serif, medium | ~13px | "3.0 Flash" with sparkle icon |

### Key Design Choices
- **No accent color whatsoever** — Even more restrained than Resend. Zero color in the UI. Everything is grayscale.
- **Serif welcome heading** — Same warmth technique as ChatPRD but in a dark context. The large serif "Welcome to Stitch.." creates personality without color.
- **Project thumbnails as identity** — Small (~40px) design preview thumbnails in the project list. Visual recognition replaces text scanning.

---

## 2. Information Architecture

### Layout (Home)
```
┌─────────────────────┬──────────────────────────────────────┐
│ Project Sidebar      │  Welcome Area (centered)            │
│ (~300px)             │                                     │
│                      │  [Announcement banner]              │
│ [My Projects|Shared] │                                     │
│ 🔍 Search projects   │  Welcome to Stitch..               │
│                      │                                     │
│ Last Year            │  [suggestion pill] [pill] [pill]    │
│ • project 1 (thumb)  │                                     │
│ • project 2 (thumb)  │  ┌──────────────────────────────┐  │
│ • project 3          │  │ What shall we design?        │  │
│ ...                  │  │                              │  │
│                      │  │ [+][App][Web]  [⚡][3.0▾][▶] │  │
│ Examples             │  └──────────────────────────────┘  │
│ • example 1 (thumb)  │                                     │
│ • example 2 (thumb)  │                                     │
│ ...                  │                              [☀/🌙] │
└─────────────────────┴──────────────────────────────────────┘
```

### Navigation (Minimal)
```
Top Bar
├── Logo ("Stitch BETA")
├── Docs link
├── Discord link
├── X (Twitter) link
├── What's New button
├── Menu (⋮)
└── Avatar

Sidebar
├── Tab toggle: My Projects | Shared with me
├── Search
├── Time-grouped project list (with thumbnails)
└── Examples section (curated templates)
```

---

## 3. Component Library

### Prompt Input (AI Generation)
```
┌──────────────────────────────────────────────────────┐
│  What native mobile app shall we design?             │
│                                                      │
│                                                      │
│  [+] [App] [Web]           [💬] [3.0 Flash ▾] [📊] [↑] │
└──────────────────────────────────────────────────────┘
```
- Large textarea with placeholder
- Bottom toolbar: file upload, App/Web toggle, chat, model selector, live mode, generate
- Model selector shows current model with sparkle icon
- App/Web as radio toggle (pill-shaped)
- Generate button disabled until text entered
- **Adopt for**: Any AI prompt interface, especially for brand-forge generators

### Suggestion Chips (Prompt Starters)
```
  [Quiz page in a language...] [Make me an app for...] [A mood-based movie...]
```
- Horizontally scrollable pill buttons
- Truncated text with ellipsis
- Dark background, subtle border
- Single click fills the prompt
- **Adopt for**: Any AI feature with prompt suggestions, onboarding quick-starts

### Project List Item
```
┌──────────────────────────────────┐
│ [thumbnail]  Project Name       │
│              📅 Nov 3, 2025     │
│              👥 Shared          │  ← optional
└──────────────────────────────────┘
```
- Thumbnail preview (40x40, rounded corners)
- Project name (medium weight, white)
- Date with calendar icon
- "Shared" badge with people icon (when applicable)
- No hover menu — just click to open
- Time-grouped sections: "Last Year", "Examples" — plain text headers, not uppercase
- **Adopt for**: Design asset lists, saved outputs, template galleries

### Announcement Banner (Dismissible)
```
┌──────────────────────────────────────────────┐
│  Meet the new Stitch  ×                      │  ← Pill-shaped, centered
└──────────────────────────────────────────────┘
```
- Centered above the welcome heading
- Link text + dismiss (×) button
- Pill-shaped, subtle bg
- **Adopt for**: Feature announcements, what's-new notices

### Tab Toggle (Radio Group)
```
  [⊞ My Projects] [👥 Shared with me]
```
- Two options as pill-shaped radio buttons
- Icon + label
- Active state: filled bg
- **Adopt for**: Any binary view toggle (Mine/Shared, Active/Archived, etc.)

### Theme Toggle
```
  [☀]  ← Bottom-right corner, single icon button
```
- Light/dark mode toggle as a single icon in the corner
- Unobtrusive placement
- **Adopt for**: Any app with theme switching

---

## 4. Design Principles Extracted

1. **Zero-color monochrome** — No accent color at all. Not even for CTAs. Everything is white/gray on dark. The content (generated designs) provides the color. The tool stays out of the way.
2. **Serif for soul, sans for structure** — Large serif welcome heading creates warmth and personality. Everything else is utilitarian sans-serif. Same principle as ChatPRD.
3. **Thumbnails as navigation** — Small design previews next to project names. Users find projects by visual recognition, not text scanning. Much faster for visual work.
4. **Prompt-first UX** — The entire home page is a prompt input. No dashboard, no metrics, no settings in the way. The primary action is front and center.
5. **Model as toolbar element** — "3.0 Flash" shown as a dropdown in the input toolbar, not in settings. The model is part of the creative workflow, not configuration.
6. **Examples as onboarding** — Curated example projects in the sidebar teach by showing, not telling. Users see what's possible before they create.
7. **Time grouping over categories** — Projects grouped by "Last Year" rather than by type/category. Recency is the primary organizing principle for creative work.
8. **Minimal nav** — No sidebar nav items beyond the project list. The app has essentially two states: project list and project editor. Simplicity through reduction.

---

## 5. Applicability Matrix

| Pattern | Rally HQ | QuantifAI | 630 Apps | brand-forge |
|---------|----------|-----------|----------|-------------|
| Prompt input with toolbar | No | Maybe | No | Yes (AI generators) |
| Suggestion chips | No | Maybe | No | Yes (preset starters) |
| Project list with thumbnails | Maybe | No | No | Yes (preset gallery) |
| Tab toggle (Mine/Shared) | Yes (My Tournaments/All) | Maybe | Maybe | No |
| Time grouping | Maybe | No | No | Maybe (presets) |
| Serif welcome heading | Consider | Consider | No | Consider |
| Theme toggle placement | Yes | Yes | Yes | N/A |
| Announcement banner | Yes | Yes | Maybe | N/A |
| Zero-color monochrome | No | Consider | No | Consider |

### brand-forge priorities (this project!)
1. Prompt input pattern for AI generator commands
2. Suggestion chips for common generation prompts
3. Project list with thumbnails for preset gallery
4. Serif welcome heading for CLI banner/docs

### Rally HQ priorities
1. Tab toggle (My Tournaments / All Tournaments)
2. Announcement banner for feature updates
3. Theme toggle in consistent corner position

### QuantifAI priorities
1. Prompt input for AI query interface
2. Suggestion chips for common analytics queries
3. Announcement banner for new features

---

## 6. Contrast with Previous References

| Dimension | ChatPRD | Vercel | Resend | Supabase | Stitch |
|-----------|---------|--------|--------|----------|--------|
| Color | Violet accent | Monochrome + blue | Monochrome + semantic | Green brand | Zero color |
| Typography soul | Serif display | Geist pair | Plain sans | Plain sans | Serif welcome |
| Dark mode | No | Optional | No | Default | Default |
| Primary action | Chat input | Search/Add | Send email | Query/Edit | Generate prompt |
| Nav items | 4 | 15+ | 10 | 13 icons | 0 (just project list) |
| Content preview | None | Sparklines | None | Chart bars | Thumbnails |
| Target user | Product managers | Developers | Developers | Database devs | Designers |

**Key insight**: Stitch represents the most radical simplification — the entire UI is essentially a prompt input and a project list. There is no nav, no settings maze, no feature discovery problem. This works because the tool does one thing (generate designs) and does it directly from the home screen. For brand-forge's AI generators, this prompt-first approach is directly applicable.

**Updated progressive complexity model**:
- **Stitch** = prompt-first (one input, no chrome)
- **ChatPRD** = onboarding-first (guide to first action)
- **Resend** = data-first (show what happened)
- **Vercel** = density-first (show everything)
- **Supabase** = depth-first (navigate deep hierarchies)
