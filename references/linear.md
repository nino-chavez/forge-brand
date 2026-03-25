# Linear — Design Reference Audit

> **Source**: https://linear.app
> **Audited**: 2026-03-23
> **Category**: Issue tracker / project management (developer-focused)
> **Stack**: Custom renderer, dark mode default, keyboard-first
> **Screenshots**: `linear-*.png` in project root

---

## 0. Nino's Linear Inventory

- **Workspace**: lpo-bracket-app
- **Teams**: Lpo-bracket-app (LPO prefix)
- **Active issues**: 0 (empty state shown)
- **Status**: "What's new — UI refresh" banner visible

---

## 1. Visual Identity

### Color System
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#101010` | Deep dark background |
| Surface | `#1A1A1A` | Sidebar, cards |
| Surface hover | `#222222` | Hover states |
| Surface active | `#2A2A2A` | Active nav item (subtle) |
| Border | `#2A2A2A` | Subtle borders, almost invisible |
| Text primary | `#F2F2F2` | Headings, issue titles |
| Text secondary | `#858585` | Metadata, section labels |
| Text muted | `#555555` | Disabled, inactive |
| Accent purple | `#7B68EE` | Primary CTA ("Create new issue"), active tab |
| Accent purple hover | `#6C5CE7` | CTA hover state |
| Tab active | White bg | "Active" tab pill — inverted |
| Tab inactive | Transparent | "All issues", "Backlog" — just text |
| Status icons | Multi-colored circles | Empty/partial/filled circles for issue status |
| What's new banner | `#1A1A1A` bg | Bottom-left announcement |

### Typography
| Role | Font | Size | Notes |
|------|------|------|-------|
| Team name | Sans-serif (Inter), semibold | ~16px | "Lpo-bracket-app" in content header |
| Nav item | Sans-serif, medium | ~14px | "Inbox", "My Issues", etc. |
| Section label | Sans-serif, regular | ~12px | "Workspace", "Your teams", "Try" — gray with ▾ |
| Empty state heading | Sans-serif, semibold | ~20px | "Active issues" |
| Empty state body | Sans-serif, regular | ~14px | Description text, gray |
| Tab | Sans-serif, medium | ~13px | "All issues", "Active", "Backlog" |
| Button | Sans-serif, medium | ~14px | "Create new issue", "Documentation" |
| Banner | Sans-serif | ~12px | "What's new" (gray), "UI refresh" (white, bold) |

---

## 2. Information Architecture

### Navigation Model
```
Top Bar (compact)
├── Workspace switcher (icon + name + chevron)
├── Search (🔍)
├── New issue (+) — quick create
├── Notifications (🔔) — right side

Sidebar (left, ~200px)
├── Global
│   ├── Inbox
│   └── My Issues
├── Workspace ▾
│   ├── Projects
│   ├── Views
│   └── ••• More
├── Your teams ▾
│   └── Team Name ▾
│       ├── Issues (active)
│       ├── Projects
│       └── Views
├── Try ▾
│   ├── Import issues
│   └── + Invite people
└── Footer
    └── "What's new — UI refresh" banner
```

### Content Area
```
┌────────────────────────────────────────────────────────────┐
│ [team-icon] Team Name                           [🔔]      │
├────────────────────────────────────────────────────────────┤
│ [All issues] [Active] [Backlog] [+]    [≡] [⚙] [⏱]      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                  [status icon grid]                         │
│                                                            │
│              Active issues                                 │
│              Active issues represent work that is           │
│              currently in flight or should be               │
│              worked on next...                              │
│                                                            │
│        [Create new issue ⌘C]  [Documentation]             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Component Library

### Tab Bar (View Switcher)
```
  [All issues] [█Active█] [Backlog] [+]          [≡] [⚙] [⏱]
                  ↑ active: white bg pill, bold text
```
- Horizontal tabs as pill buttons
- Active tab: filled white bg on dark, stands out clearly
- Inactive tabs: transparent, gray text
- [+] to add custom views
- Right side: layout, settings, and time tracking icons
- **Adopt for**: Any multi-view list (All/Active/Done, All/Mine/Shared)

### Empty State (Issue Tracker)
```
          ○ ◑
          ◕ ◐          ← Status icon illustration (4 partial circles)

      Active issues

      Active issues represent work that
      is currently in flight or should be
      worked on next. There are currently
      no active issues in this team...

  [Create new issue ⌘C]  [Documentation]
```
- Abstract icon illustration using the product's own visual language (status circles)
- Bold heading + explanatory paragraph
- Primary CTA (purple, with keyboard shortcut shown) + secondary link
- Keyboard shortcut visible in the button — teaches users instantly
- **Adopt for**: Any empty list state, especially for task/issue/event lists

### Sidebar Section with Label
```
  Workspace ▾           ← Collapsible section header with chevron
    Projects
    Views
    ••• More            ← Overflow as "More" link
```
- Section headers are plain gray text with ▾ toggle
- Items nested underneath
- "More" as an overflow — hides less-used items
- **Adopt for**: Grouped sidebar navigation

### Team Dropdown
```
  [🟣] Lpo-bracket-app ▾     ← Team icon (colored) + name + dropdown
        Issues                 ← Active (highlighted bg)
        Projects
        Views
```
- Colored team icon (square, rounded)
- Dropdown to switch teams
- Sub-items for team-specific views
- **Adopt for**: Multi-team/multi-org sidebar sections

### What's New Banner
```
┌──────────────────────────┐
│  What's new              │
│  **UI refresh**          │
└──────────────────────────┘
```
- Bottom-left of sidebar, non-intrusive
- Small label ("What's new") + bold feature name
- Clickable to see details
- **Adopt for**: Changelog/feature announcements, less aggressive than a top banner

### Keyboard Shortcut in Button
```
  [Create new issue  ⌘C]    ← Shortcut shown directly in button label
```
- Keyboard shortcut appended to button text
- Teaches shortcuts passively — users learn by seeing
- **Adopt for**: Any primary action that has a keyboard shortcut

---

## 4. Design Principles Extracted

1. **Dark by conviction** — Linear's dark mode isn't an option, it's the brand. Deep `#101010` background creates focus. The UI disappears; the content remains.
2. **Keyboard shortcuts as first-class UI** — Shortcuts shown in buttons, tooltips, and empty states. The entire app is navigable without a mouse. This creates speed for power users.
3. **Status as visual language** — The empty state illustration uses Linear's own status icons (circles in various fill states). The product's visual language is self-referential and iconic.
4. **Sections collapse with ▾ not ▸** — Downward chevron for expanded, sideways for collapsed. Subtle but consistent.
5. **Purple as the single accent** — `#7B68EE` for CTAs and active states only. Everything else is monochrome. More disciplined than even Resend.
6. **Team as organizational unit** — Teams have their own icon, color, and sub-navigation. Workspace > Team > Issues/Projects/Views is the hierarchy.
7. **"Try" section for onboarding** — A dedicated sidebar section for actions that help new users get started (Import, Invite). Disappears once used.
8. **View as first-class concept** — "Views" appears at both workspace and team level. Users create custom filtered/sorted views and save them as named items in the sidebar.
9. **Tabs + toolbar, not separate pages** — "All issues", "Active", "Backlog" are tabs on the same page, not different routes. The toolbar (filter, sort, layout) persists across tabs.
10. **What's new as ambient awareness** — Bottom-left banner, always visible but never blocking. Users notice it on their own time.

---

## 5. Applicability Matrix

| Pattern | Rally HQ | QuantifAI | 630 Apps | brand-forge |
|---------|----------|-----------|----------|-------------|
| Tab bar (All/Active/Backlog) | Yes (All/Live/Upcoming/Past) | Yes (All/Active/Archived) | Yes (Pending/Signed/Expired) | N/A |
| Empty state with shortcuts | Yes | Yes | Yes | N/A |
| Keyboard shortcuts in buttons | Consider | Yes | No | Maybe (CLI) |
| Team as org unit | Yes (clubs/orgs) | Maybe | No | N/A |
| Views as saved filters | Yes (custom tournament views) | Yes (saved analytics views) | No | N/A |
| "Try" onboarding section | Yes | Yes | Consider | N/A |
| What's new banner | Yes | Yes | Consider | N/A |
| Purple single accent | Consider | Consider | No (own accents) | Consider |
| Dark by default | Consider | Yes | No | N/A |
| Tabs + persistent toolbar | Yes | Yes | Maybe | N/A |

### Rally HQ priorities
1. Tab bar: All Tournaments / Live / Upcoming / Past / Archived
2. Empty state with keyboard shortcut in CTA
3. Team/club as organizational unit with colored icon
4. Saved views for custom tournament filters
5. "Try" onboarding section for new organizers

### QuantifAI priorities
1. Tab bar for metric view states
2. Saved views as named sidebar items
3. Keyboard shortcuts surfaced in buttons
4. Dark mode as default for analytics
5. What's new banner for feature updates

### 630 Apps priorities
1. Tab bar: E-Sign (Pending/Signed/Expired), CCI (In Progress/Completed), VB Ranking (Active/Historical)
2. Empty states with clear CTAs and explanatory text

---

## 6. Contrast with All References

| Dimension | ChatPRD | Vercel | Resend | Supabase | Stitch | Notion | Figma | Linear |
|-----------|---------|--------|--------|----------|--------|--------|-------|--------|
| Accent | Violet | None | None | Green | None | Blue | Blue | **Purple** |
| Dark mode | No | Opt-in | No | Default | Default | No | No | **Default (brand)** |
| Empty state | Illustrated | Minimal | N/A | Advisor | N/A | N/A | N/A | **Status icons + shortcut** |
| Tab pattern | None | None | Sending/Receiving | None | App/Web | View tabs | View tabs | **Issue state tabs** |
| Keyboard | Hidden | "F" key | "F" key | ⌘K | None | Slash cmd | None | **In buttons** |
| Nav density | 4 items | 15+ | 10 | 13 icons | 0 | ~15 (tree) | ~5 | **~8 + teams** |

**Key insight**: Linear is the most opinionated product in this reference set. Where others offer choice (light/dark, grid/list), Linear makes decisions (dark, keyboard-first, purple). This creates a cohesive brand identity that feels intentional rather than generic. For Rally HQ's tournament management, Linear's **tab bar + saved views + keyboard shortcuts** pattern is the most directly applicable model for power-user tournament directors.

**Final progressive complexity model**:
- **Stitch** = prompt-first (one input, no chrome)
- **ChatPRD** = onboarding-first (guide to first action)
- **Figma** = browse-first (thumbnails, find your file)
- **Notion** = composition-first (blocks, flexible layout)
- **Resend** = data-first (show what happened)
- **Linear** = action-first (keyboard shortcuts, status workflows)
- **Vercel** = density-first (show everything)
- **Supabase** = depth-first (navigate deep hierarchies)
