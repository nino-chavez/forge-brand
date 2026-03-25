# Figma — Design Reference Audit

> **Source**: https://www.figma.com
> **Audited**: 2026-03-23
> **Category**: Collaborative design tool / file browser
> **Stack**: Custom WebGL renderer, light mode default
> **Screenshots**: `figma-*.png` in project root

---

## 0. Nino's Figma Inventory

- **Team**: Nino Chavez's team (Free plan)
- **Recent files**: DMS Crawl/Walk/Run — Phase Wireframes (edited 1 month ago), DMS Guided Resolution - Prototype (edited 1 month ago)
- **Starred**: Section visible but empty in screenshot

---

## 1. Visual Identity

### Color System
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#FFFFFF` | Clean white |
| Sidebar bg | `#F5F5F5` | Very light gray |
| Sidebar active | `#E8E8E8` with blue text | Active nav item |
| Text primary | `#333333` | Headings, file names |
| Text secondary | `#999999` | Metadata (dates, authors, counts) |
| Accent blue | `#0D99FF` | Active states, CTAs, "View plans" button |
| Product pills | Various branded colors | Design (green), FigJam (purple), Slides (orange), Buzz (coral), Site (teal), Make (indigo) |
| Free badge | `#0D99FF` text | "Free" label next to team name |
| Thumbnail bg | `#F5F5F5` | File preview card background |
| Community card | Branded colors | Recommended resource thumbnails |

### Typography
| Role | Font | Size | Notes |
|------|------|------|-------|
| Page title | Sans-serif, medium | ~16px | "Recents" — simple, not large |
| File name | Sans-serif, medium | ~14px | Below thumbnail |
| Author/meta | Sans-serif, regular | ~12px | "by bright · ♡ 3.4k 👤 108k" |
| Nav item | Sans-serif, medium | ~14px | Sidebar items |
| Team name | Sans-serif, medium | ~14px | With plan badge |
| Section label | Sans-serif, regular | ~12px | "Starred" — plain, gray |
| Tab | Sans-serif, medium | ~13px | "Recently viewed", "Shared files", "Shared projects" |

---

## 2. Information Architecture

### Navigation Model
```
Top Bar (horizontal)
├── Workspace switcher (avatar + name + chevron)
├── Search (🔍)
├── Notifications (🔔)
├── Product switchers: [Design] [FigJam] [Slides] [Buzz] [Site] [Make] [✓]
│   └── Each is a pill with branded icon + color

Sidebar (left)
├── Recents (active)
├── Community
├── Team Section
│   ├── Team Name + Plan badge (Free/Pro)
│   ├── Drafts
│   ├── All projects
│   ├── Resources
│   └── Trash
├── Upsell Card
│   └── "Ready to go beyond this free plan?" + [View plans]
└── Starred (collapsible)
```

### Content Area Layout
```
┌────────────────────────────────────────────────────────────┐
│  Recommended resources from Community          [↻] [×]    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│  │ [preview]  │ │ [preview]  │ │ [preview]  │ See more   │
│  │ Title      │ │ Title      │ │            │ resources  │
│  │ by author  │ │ by author  │ │            │            │
│  └────────────┘ └────────────┘ └────────────┘            │
├────────────────────────────────────────────────────────────┤
│  [Recently viewed] [Shared files] [Shared projects]       │
│  [All organizations ▾] [All files ▾] [Last viewed ▾] ⊞≡  │
│                                                            │
│  ┌──────────────────────┐  ┌──────────────────────┐       │
│  │                      │  │                      │       │
│  │  [file thumbnail]    │  │  [file thumbnail]    │       │
│  │                      │  │                      │       │
│  ├──────────────────────┤  ├──────────────────────┤       │
│  │ [icon] File Name     │  │ [icon] File Name     │       │
│  │ Edited 1 month ago   │  │ Edited 1 month ago   │       │
│  └──────────────────────┘  └──────────────────────┘       │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Component Library

### Product Switcher (Top Bar Pills)
```
  [◯ Design] [◻ FigJam] [◻ Slides] [◻ Buzz] [◻ Site] [◻ Make] [✓]
```
- Horizontal pill buttons, each with branded icon + color
- Active state: filled background
- **Adopt for**: Multi-product or multi-mode top bar (Rally HQ: Tournaments/Matches/Teams)

### File Card (Grid View)
```
┌──────────────────────────────┐
│                              │
│       [design preview]       │  ← Large thumbnail (~180px tall)
│                              │
├──────────────────────────────┤
│ [product-icon] File Name     │
│ Edited 1 month ago           │
└──────────────────────────────┘
```
- Large thumbnail preview dominates
- Product icon (Design/FigJam/etc.) before file name
- Relative timestamp
- Grid/list toggle available (⊞/≡)
- **Adopt for**: Any asset browser, design file gallery, brand-forge preset viewer

### Filter Bar (Content Area)
```
  [Recently viewed] [Shared files] [Shared projects]
  [All organizations ▾] [All files ▾] [Last viewed ▾]  [⊞] [≡]
```
- Tab row for view type
- Filter dropdowns below (composable)
- Grid/list view toggle (right-aligned)
- **Adopt for**: Any filterable content gallery

### Community Resource Card
```
┌──────────────────────────────┐
│                              │
│   [branded preview image]    │
│                              │
├──────────────────────────────┤
│ Resource Title               │
│ by Author · ♡ 3.4k 👤 108k  │
└──────────────────────────────┘
```
- Full-width branded preview
- Author + social proof (likes, users)
- Dismissible section with refresh button
- **Adopt for**: Template/resource recommendations, marketplace items

### Sidebar Upsell Card
```
┌──────────────────────────────┐
│         [↑ icon]             │
│ Ready to go beyond this      │
│ free plan? Upgrade to        │
│ premium features.            │
│ [════ View plans ════]       │
└──────────────────────────────┘
```
- Centered text + full-width CTA button (blue)
- Subtle, not aggressive
- **Adopt for**: Plan upgrade prompts, feature gates

### Grid/List Toggle
```
  [⊞] [≡]    ← Icon-only toggle pair
```
- Two small icon buttons, grouped
- Grid = default for visual files
- List = compact alternative
- **Adopt for**: Any content that can be viewed as cards or rows

---

## 4. Design Principles Extracted

1. **Product-colored pills** — Each Figma product (Design, FigJam, Slides, Buzz, Site, Make) has its own branded color and icon in the top bar. Products are peers, not nested.
2. **Thumbnail dominance** — File cards are 70% thumbnail, 30% metadata. Visual recognition is the primary navigation mechanism for design files.
3. **Social proof on community content** — Likes and user counts shown on recommended resources. Builds trust for community-sourced templates.
4. **Grid/list as user choice** — Same content, two display modes. Grid for visual browsing, list for scanning. User picks their density.
5. **Composable filters as dropdowns** — Organization, file type, sort order as independent dropdowns. Same pattern as Resend.
6. **Plan badge inline** — "Free" badge right next to team name in sidebar. Persistent but non-intrusive awareness of plan limitations.
7. **Minimal sidebar** — Only 5 items under the team (Drafts, All projects, Resources, Trash) plus Recents and Community at top. The product complexity is in the editor, not the file browser.
8. **Dismissible recommendations** — Community resources section has refresh and dismiss (×). Helpful but not permanent.

---

## 5. Applicability Matrix

| Pattern | Rally HQ | QuantifAI | 630 Apps | brand-forge |
|---------|----------|-----------|----------|-------------|
| Product switcher pills | Yes (Tournaments/Leagues/Teams) | Maybe (Dashboard/Reports) | Yes (E-Sign/CCI/VBRanking) | N/A |
| File card with thumbnail | Maybe (event flyers) | No | No | Yes (preset gallery) |
| Grid/list toggle | Yes (tournament list) | Yes (metric views) | Maybe | Yes (presets) |
| Composable filter dropdowns | Yes | Yes | Yes | N/A |
| Social proof (likes/users) | Maybe (popular events) | No | No | N/A |
| Sidebar upsell card | Consider | Consider | No | N/A |
| Plan badge inline | Consider | Consider | No | N/A |
| Dismissible recommendations | Yes (featured events) | No | No | N/A |

---

## 6. Key Takeaway

Figma's file browser is intentionally simple because the real product is the editor. The lesson: **don't over-design the navigation layer when the content/editor is the star**. The file browser's job is to get you to a file fast (thumbnails + recents + search). Everything else stays out of the way.

For brand-forge specifically, the **file card with thumbnail** pattern is directly applicable to a preset gallery view where users browse brand kits visually.
