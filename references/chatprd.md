# ChatPRD — Design Reference Audit

> **Source**: https://app.chatprd.ai
> **Audited**: 2026-03-23
> **Category**: AI-powered product management SaaS
> **Stack**: Next.js, Clerk auth, Intercom support, Vercel deploy
> **Screenshots**: `chatprd-*.png` in project root

---

## 1. Visual Identity

### Color System
| Token | Value | Usage |
|-------|-------|-------|
| Primary accent | `~#7C5CFC` (violet) | Sidebar labels, active nav, CTAs, checkmarks |
| CTA gradient | violet → pink | "Get Started with Pro" button only |
| Headline gradient | pink → orange | Hero text accent ("help you today") — used exactly once |
| Surface | `~#FAFAFA` | Main background, very subtle warmth |
| Card border | `~#E5E5E5` | Light gray, 1px, sometimes dashed for empty states |
| Text primary | `~#1A1A1A` | Headings |
| Text secondary | `~#6B7280` | Descriptions, subtitles |
| Success | `~#7C5CFC` (matches accent) | Checkmarks in feature lists |
| Badge green | `~#10B981` | "Save 20%" pricing pills |
| Badge pink | gradient pill | "Most Popular" — only gradient badge in UI |

### Typography
| Role | Style | Notes |
|------|-------|-------|
| Display headings | Serif/display, ~32-40px | "Pick your plan", "How can I help you today?" — gives warmth |
| Section headings | Sans-serif, bold, ~20-24px | "Custom Templates", "Map your products" |
| Body | Sans-serif (Inter-like), regular, ~14-16px | Clean, high readability |
| Sidebar labels | Uppercase, ~11px, accent color | "PROJECTS", "CHATS" — visual grouping without dividers |
| Nav items | Sans-serif, medium, ~14px | Icon + label pairs |

### Spacing
- Sidebar width: ~220px
- Main content padding: ~32-48px
- Card padding: ~24px internal
- Row height in tables: ~72px (generous)
- Action card height: ~64px
- Bottom toolbar height: ~48px

---

## 2. Information Architecture

### Navigation Model
```
Sidebar (persistent, left)
├── Logo + Org Switcher (top)
├── Primary Nav (4 items, icon + label)
│   ├── Chats        → /drive/chats
│   ├── Documents    → /drive/docs
│   ├── Products     → /products
│   └── Templates    → /settings/customize
├── Projects (collapsible section)
│   └── Create a project
├── Chats (collapsible section, with filter dropdown)
│   └── Chat history list
├── Usage meter + Upgrade CTA
└── User profile (pinned bottom, avatar + name + plan)
```

### Page Structures
| Page | Layout | Key Elements |
|------|--------|-------------|
| Chat (home) | Centered welcome + bottom input | Headline, 4 action cards, pinned input bar |
| Documents | Centered empty state | Icon, heading, description, CTA |
| Products | Centered empty state + top-right action | Same empty pattern, "Add Company" button in header |
| Templates/Settings | Tab bar + content sections | Horizontal tabs, card for custom template CTA, data table below |
| Plans | Full-width, 3-column pricing | Toggle (monthly/yearly), 3 tier cards, bottom CTA banner |

---

## 3. Component Library

### Action Card (Chat Welcome)
```
┌─────────────────────────────────────────────────────────┐
│  [icon]  Title text                              [›]    │
│          Subtitle / description text                    │
└─────────────────────────────────────────────────────────┘
```
- Vertical list, not grid
- Each card: colored circle icon (left), two-line text (center), chevron (right)
- Light border, no shadow
- Hover: subtle background change
- **Adopt for**: Onboarding flows, guided entry points, feature selection

### Empty State
```
          ┌───────────┐
          │   [icon]  │   <- Large, soft circle bg
          └───────────┘
         Heading (bold)
      Description text
    (centered, max ~400px)
        ┌──────────┐
        │   CTA    │      <- Single primary button
        └──────────┘
```
- Consistent across all pages
- Dashed border card container (optional)
- **Adopt for**: Every page that can be empty — never show a blank void

### Data Table
```
┌─────────────┬──────────┬──────────────────────┬─────────┐
│ Name        │ Status   │ Description          │ Actions │  <- Header row, no bg
├─────────────┼──────────┼──────────────────────┼─────────┤
│ Row content │          │ Truncated with ...   │   •••   │  <- Overflow menu
│             │          │                      │         │  <- Generous row height
└─────────────┴──────────┴──────────────────────┴─────────┘
```
- No zebra striping
- No heavy borders (light horizontal rules only)
- Overflow menu (three dots) for actions
- **Adopt for**: Preset lists, template management, any tabular data

### Settings Tab Bar
```
  Profile    Customize    Integrations    Account    Billing
  ─────────  ═══════════  ────────────    ───────    ──────
                 ↑ active (underline + accent color)
```
- Horizontal, top of content area
- Active tab: accent color text + bottom border
- **Adopt for**: Multi-section settings/config pages

### Pricing Cards
```
┌──────────────┐  ┌══════════════════┐  ┌──────────────┐
│ Free         │  ║ Pro  [Most Pop.] ║  │ Teams        │
│              │  ║                  ║  │              │
│ $0           │  ║ $15/mo           ║  │ $29/mo/seat  │
│              │  ║                  ║  │              │
│ [Get Start]  │  ║ [Gradient CTA]   ║  │ [Get Start]  │
│              │  ║                  ║  │              │
│ ✓ Feature    │  ║ ✓ Feature        ║  │ ✓ Feature    │
│ ✓ Feature    │  ║ ✓ Feature        ║  │ ✓ Feature    │
└──────────────┘  └══════════════════┘  └──────────────┘
                       ↑ highlighted tier (colored border)
```
- Monthly/Yearly toggle at top
- One tier visually promoted (colored border + gradient CTA + badge)
- Integration logos shown as icon row (Pro tier)
- **Adopt for**: Tier comparison, plan selection

### Bottom Toolbar (Chat Input)
```
┌────────────────────────────────────────────────────────────┐
│  [Send a message...]                              [📎] [▶]│
├────────────────────────────────────────────────────────────┤
│  🌐 No Project ▾  │ 📝 Writing ON ▾ │ ✂ ▾ │ ⚡ Auto ▾   │
└────────────────────────────────────────────────────────────┘
```
- Input area on top, toolbar row below
- Compact dropdown selectors and toggle buttons
- Mode indicators with on/off badges
- **Adopt for**: Multi-mode tool interfaces, chat UIs with context selectors

### Sidebar User Profile
```
┌──────────────────────────┐
│  [avatar]  Name          │  <- Pinned to bottom
│            Plan tier     │
└──────────────────────────┘
```

---

## 4. Design Principles Extracted

1. **One accent, used surgically** — Violet appears in labels, active states, CTAs, and checkmarks. Nothing else competes.
2. **Gradient as personality, not pattern** — Exactly one gradient headline and one gradient CTA. The rest is flat.
3. **Empty states are designed, not defaulted** — Every empty page has an icon, explanation, and action. Users are never stranded.
4. **Generous vertical rhythm** — Table rows, cards, and sections all breathe. Nothing feels cramped.
5. **Progressive disclosure** — Sidebar sections collapse. Settings use tabs. Complexity reveals itself on demand.
6. **Serif display + sans body** — The warmth of a serif headline against clean sans-serif body creates personality without clutter.
7. **Borders over shadows** — Cards and containers use thin borders, not drop shadows. Keeps the UI flat and scannable.
8. **Bottom-anchored toolbars** — Chat input and mode controls pinned to bottom, keeping content area open.

---

## 5. Applicability Matrix

### What to adopt per project

| Pattern | Rally HQ | QuantifAI | 630 Apps | brand-forge |
|---------|----------|-----------|----------|-------------|
| Empty state pattern | Yes | Yes | Yes | N/A (CLI) |
| Action card list (onboarding) | Yes | Yes | Yes | N/A |
| Sidebar section labels (uppercase accent) | Yes | Yes | Yes | N/A |
| Settings tab bar | Yes | Yes | Maybe | N/A |
| Data table (clean, generous rows) | Yes | Yes | Yes | N/A |
| Bottom toolbar (multi-mode) | Maybe | Yes | VB Ranking | N/A |
| Pricing cards | Maybe | Yes | No | N/A |
| Serif display + sans body | Consider | Consider | No (has own type) | Preset option |
| Single-accent discipline | Yes | Yes | Already does this | Enforce in review |
| Gradient-as-personality (1x) | Consider | Consider | Consider | Codify in schema |

### Rally HQ priorities
1. Empty state design for tournament/team views
2. Action card list for dashboard entry points
3. Sidebar label treatment for nav grouping
4. Settings tab bar for admin/config screens

### QuantifAI priorities
1. Bottom toolbar pattern for analytics mode switching
2. Data table style for metrics/reports
3. Pricing cards for tier comparison
4. Empty state pattern for first-run experience

### 630 Apps priorities
1. Empty state pattern across E-Sign, CCI, VB Ranking
2. Action card list for guided workflows ("Start new contract", "Begin assessment")
3. Sidebar section labels (upgrade from current divider style)

---

## 6. Anti-Patterns to Avoid

These are things ChatPRD does *not* do that we should also avoid:

- No card grids for onboarding (uses vertical list instead — more scannable)
- No drop shadows on content cards (borders only)
- No multi-color icon system (icons are monochrome or match accent)
- No dense tables (generous row height prevents visual fatigue)
- No nested sidebar navigation for settings (uses top tab bar instead)
- No floating action buttons (all actions are inline or in toolbars)
