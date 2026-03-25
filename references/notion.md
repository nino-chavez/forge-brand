# Notion — Design Reference Audit

> **Source**: https://www.notion.so
> **Audited**: 2026-03-23
> **Category**: All-in-one workspace (docs, databases, wikis, AI)
> **Stack**: Custom renderer, block-based, light mode default
> **Screenshots**: `notion-*.png` in project root

---

## 0. Nino's Notion Inventory

- **Workspace**: Nino Chavez's Workspace
- **Teamspace**: Nino Chavez's Workspace HQ (with Wiki)
- **Private pages**: Introducing Feed for Databases, New database
- **Agents**: Beta section, "New agent" available
- **Notion apps**: Mail, Calendar, Desktop
- **Inbox**: 1 unread notification

---

## 1. Visual Identity

### Color System
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#FFFFFF` | Page background (light mode) |
| Sidebar bg | `#F7F7F5` | Warm off-white, very subtle |
| Sidebar active | `#EFEFEF` | Active page highlight |
| Surface hover | `#E8E8E5` | Hover states |
| Border | `#E3E2DE` | Subtle, warm-toned borders |
| Text primary | `#37352F` | Headings, body text — warm near-black |
| Text secondary | `#787774` | Metadata, section labels, dates |
| Text placeholder | `#B4B4B0` | Input placeholders |
| Accent blue | `#2383E2` | Links, "New" button, active toggles |
| Badge red | `#EB5757` | Notification count (Inbox 1) |
| Callout bg | `#F1F1EF` | Callout/note blocks (warm gray) |
| Inline code | `#EB5757` text on `#F7F6F3` bg | `/feed` code snippets |
| Cover/icon area | Transparent | Optional cover image + emoji/icon |

### Typography
| Role | Font | Size | Notes |
|------|------|------|-------|
| Page title | Serif (Notion serif), bold | ~40px | "Introducing Feed for Databases" — large, warm |
| Section heading | Sans-serif, semibold | ~24px | "Getting started with Feed" |
| Feed card title | Sans-serif, semibold | ~20px | "Add Feed view to existing databases" |
| Body text | Sans-serif, regular | ~16px | Content blocks, descriptions |
| Sidebar item | Sans-serif, medium | ~14px | Nav items, page names |
| Section label | Sans-serif, regular | ~12px | "Recents", "Private", "Teamspaces", "Notion apps" — gray, not uppercase |
| Badge text | Sans-serif, bold | ~11px | "Beta" badge, notification count |
| Date | Sans-serif, regular | ~13px | "08/01/2025" in feed cards |
| Button | Sans-serif, medium | ~14px | "New", "Share", "Filter", "Sort" |

### Key Palette Insight
Notion's palette is **warm** — `#37352F` (not `#000`) for text, `#F7F7F5` (not `#F5F5F5`) for sidebar, `#E3E2DE` for borders. This warmth is subtle but pervasive. It makes the tool feel approachable despite its density.

---

## 2. Information Architecture

### Navigation Model (Sidebar)
```
Sidebar (persistent, resizable, left)
├── Workspace Switcher (top — icon + name + close/new/more)
├── Global Actions
│   ├── Search
│   ├── Home
│   ├── Meetings
│   ├── Notion AI
│   ├── Inbox (with notification badge)
│   └── Library
├── Collapsible Sections (user content)
│   ├── Recents (auto-populated, tree)
│   ├── Agents (Beta badge)
│   ├── Private (user's private pages, tree)
│   └── Teamspaces (shared spaces, nested trees)
├── Notion Apps
│   ├── Notion Mail
│   ├── Notion Calendar
│   └── Notion Desktop
├── Admin
│   ├── Settings
│   ├── Marketplace
│   └── Trash
└── Footer
    ├── Help/What's New (bottom-left icon)
    └── Invite Members (dismissible CTA)
```

**Key insight**: Notion separates **system nav** (Search, Home, Inbox) from **user content** (Recents, Private, Teamspaces) from **admin** (Settings, Trash). Three zones, but in a single sidebar. The collapsible sections with tree views handle arbitrary depth.

### Page Structure
```
┌──────────────────────────────────────────────────────────┐
│ Top Bar: [Page title breadcrumb] [Private ▾] [Share] [★] [⋯] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [icon/emoji]                                            │
│  Page Title (serif, large)                               │
│                                                          │
│  [Add cover] [Add comment]     ← hover-revealed actions  │
│                                                          │
│  Block 1: text                                           │
│  Block 2: callout                                        │
│  Block 3: inline database (with view toolbar)            │
│    ┌──────────────────────────────────────────────────┐  │
│    │ [title] [+ view]                                │  │
│    │ [filter][sort][⚡][🔍][↗][⚙] [New ▾]           │  │
│    │ ┌─────────────────────────────────┐             │  │
│    │ │ Feed card 1 (author, date)     │             │  │
│    │ │ Title + description + media    │             │  │
│    │ │ [react] [comment]              │             │  │
│    │ ├─────────────────────────────────┤             │  │
│    │ │ Feed card 2                    │             │  │
│    │ └─────────────────────────────────┘             │  │
│    └──────────────────────────────────────────────────┘  │
│  Block N: text                                           │
│                                                          │
│                                            [AI button] ↘ │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Component Library

### Block-Based Content (Core Pattern)
```
  │ Text block — just text, any formatting
  │ Heading block — H1/H2/H3
  │ Callout block — icon + background + text
  │ Database block — inline table/board/list/gallery/feed
  │ Image block — full-width media
  │ Toggle block — collapsible content
  │ Code block — syntax-highlighted
```
- Every piece of content is a "block" that can be dragged, rearranged, and nested
- Blocks have a drag handle (⠿) on hover, left side
- Slash command (`/`) to insert any block type
- **Adopt for**: Any content editor, report builder, customizable dashboard

### Database View Toolbar
```
  [Database Title] [+ Add view]
  [≡ Filter] [↕ Sort] [⚡ Automations] [🔍 Search] [↗ Full page] [⚙ Settings] [New ▾]
```
- Icon buttons for filter, sort, automations, search, expand, settings
- "New" as primary CTA (blue) with dropdown for more add options
- View tabs would appear left of the toolbar for Table/Board/Timeline/Calendar/Feed/Chart
- Compact — all controls in one row
- **Adopt for**: Any data view with filtering/sorting needs

### Feed Card (Database View)
```
┌────────────────────────────────────────────────────────┐
│  [avatar] Author Name                    Date          │
│                                                        │
│  Card Title (semibold, ~20px)                          │
│                                                        │
│  Description text that can span multiple lines...      │
│                                                        │
│  [image/media embed]                                   │
│                                                        │
│  [😀 React]  [💬 avatar  Add a comment...]             │
└────────────────────────────────────────────────────────┘
```
- Author line: avatar monogram + name + date (right-aligned)
- Title as link (clickable, opens full page)
- Rich content (text, images, embeds)
- Reactions button + inline comment input
- Cards separated by generous whitespace
- **Adopt for**: Activity feeds, announcement streams, changelog views

### Sidebar Section (Collapsible Tree)
```
  ▾ Recents                        ← Section header (gray, clickable toggle)
    📄 Page Name 1                  ← Tree items with emoji/icon
    📄 Page Name 2
  ▾ Private                        ← Another section
    📄 Page 3
    📊 Database 1
    + Add new                       ← Action button at bottom
  ▾ Teamspaces
    ▾ 🏠 Workspace HQ  [⚙] [+]    ← Nested tree with inline actions
      📖 Wiki
      + Add new
```
- Sections as collapsible groups with ▾/▸ toggle
- Section headers: plain gray text (not uppercase, not bold)
- Tree items: emoji/icon + name, truncated with ellipsis
- "Add new" button at bottom of each section
- Teamspaces have inline action buttons (settings, add) on hover
- Resize handle between sidebar and content
- **Adopt for**: Any hierarchical content navigation

### Top Bar (Page Context)
```
  [📄 Page Title]  [🔒 Private ▾]                [🌐 Share ▾] [★] [⋯]
```
- Page title as breadcrumb (clickable)
- Visibility indicator ("Private" with lock icon, dropdown)
- Share button (with icon)
- Favorite (star) toggle
- Actions menu (three dots)
- Clean, minimal — no heavy decoration
- **Adopt for**: Page-level context bar on any detail view

### Notification Badge
```
  📥 Inbox [1]     ← Red circle badge with count
```
- Small red circle with white number
- Only appears when count > 0
- On the nav item, not as a separate element
- **Adopt for**: Any notification/inbox indicator

### AI Button (Floating)
```
                                              [✨]  ← Bottom-right, persistent
```
- Small floating button, bottom-right corner
- Sparkle/face icon (Notion AI branding)
- Opens AI assistant overlay
- **Adopt for**: Any AI feature entry point

### Inline Comment
```
  [avatar]  Add a comment...   [📎] [@ ] [▶]
```
- Inline with content (not in a separate panel)
- Avatar + text input + attach + mention + send
- Collapsed by default, expands on focus
- **Adopt for**: Collaborative annotation on any content

### Callout Block
```
  ┌─────────────────────────────────────────────────────┐
  │ ℹ️  Important text with a warm gray background.     │
  │     Can contain multiple lines and rich content.    │
  └─────────────────────────────────────────────────────┘
```
- Icon (emoji) + background color + text
- Warm gray background by default
- Used for announcements, tips, warnings
- **Adopt for**: Inline alerts, tips, feature callouts

---

## 4. Design Principles Extracted

1. **Warm neutrals, not cold grays** — Text is `#37352F` (warm), borders are `#E3E2DE` (warm), sidebar is `#F7F7F5` (warm). This subtle warmth makes a dense tool feel human. Compare to Vercel's cold `#EAEAEA` or Supabase's `#333`.
2. **Serif titles, sans everything else** — Page titles use a serif font for personality. All other text is sans-serif for clarity. Same pattern as ChatPRD and Stitch, but Notion does it for every page title, not just the welcome screen.
3. **Everything is a block** — Content is composed of typed blocks (text, heading, database, image, code, callout). Blocks can be reordered, nested, and converted. This composability is Notion's core innovation.
4. **Inline databases** — Databases live inside pages as blocks, not as separate app sections. A page can have text, then a database, then more text. Content and data coexist.
5. **Section labels are quiet** — "Recents", "Private", "Teamspaces" are small, gray, plain text. No uppercase, no bold, no accent color. The content matters, not the labels.
6. **Hover to reveal** — Drag handles, "Add cover", page actions all appear only on hover. The default state is clean. Actions reveal on intent.
7. **Slash commands as UX** — Type `/` to see all block types and actions. Keyboard-first creation without leaving the content flow. Power user and beginner friendly simultaneously.
8. **Reactions + inline comments** — Social features (react, comment) appear directly on content items, not in a separate panel. Collaboration is ambient.
9. **Resize everything** — Sidebar width is resizable via drag handle. Database columns are resizable. Content width adapts. User controls their density.
10. **AI as companion, not mode** — The AI button floats persistently but unobtrusively. AI is available everywhere but never takes over the interface.

---

## 5. Applicability Matrix

| Pattern | Rally HQ | QuantifAI | 630 Apps | brand-forge |
|---------|----------|-----------|----------|-------------|
| Warm neutral palette | Yes | Consider | Consider | Consider in presets |
| Sidebar collapsible trees | Yes (tournaments/divisions) | Maybe | Maybe | N/A |
| Database view toolbar | Yes (match lists) | Yes (metric views) | Maybe | N/A |
| Feed card (activity stream) | Yes (match activity) | Yes (pipeline events) | Maybe (E-Sign activity) | N/A |
| Block-based content | Consider | No | No | N/A |
| Inline comments | Yes (match notes) | Maybe | Yes (E-Sign comments) | N/A |
| Notification badge | Yes | Yes | Yes | N/A |
| Hover-to-reveal actions | Yes | Yes | Yes | N/A |
| Callout blocks | Yes (tournament rules) | Yes (alerts) | Yes (instructions) | N/A |
| Slash commands | Consider | Consider | No | Maybe (CLI already) |
| AI floating button | No | Consider | No | N/A |
| Serif page titles | Consider | Consider | No (own type system) | Consider |

### Rally HQ priorities
1. Warm neutral palette — shift from cold grays to warm tones
2. Collapsible tree sidebar for tournament > division > team hierarchy
3. Database view toolbar for match lists (filter, sort, search in one row)
4. Feed card pattern for match activity stream
5. Inline comments for match notes and official communications

### QuantifAI priorities
1. Database view toolbar for analytics views (same filter/sort pattern)
2. Feed card for pipeline event activity
3. Hover-to-reveal for dense metric interfaces
4. Callout blocks for threshold alerts and insights

### 630 Apps priorities
1. Notification badge for pending actions across E-Sign, CCI, VB Ranking
2. Hover-to-reveal for cleaner default states
3. Callout blocks for instructions and form guidance
4. Inline comments for E-Sign contract discussions

---

## 6. Contrast with Previous References

| Dimension | ChatPRD | Vercel | Resend | Supabase | Stitch | Notion |
|-----------|---------|--------|--------|----------|--------|--------|
| Palette temp | Neutral | Cold | Neutral | Cold (dark) | Cold (dark) | **Warm** |
| Nav structure | Flat sidebar | Grouped sidebar | Flat sidebar | 3-layer | Project list | Tree sidebar |
| Content model | Chat | Project cards | Data table | Code/tables | Generated designs | **Blocks** |
| Data views | None | None | Table | Table + charts | None | **Multi-view** (table/board/feed/calendar) |
| Collaboration | None | Preview comments | None | None | Shared projects | **Inline comments + reactions** |
| Customization | Templates | None | Templates | None | Prompts | **Slash commands + blocks** |
| Typography | Serif display | Geist | Plain sans | Plain sans | Serif welcome | **Serif titles** |
| AI integration | Chat-first | Agent | None | Assistant | Generate-first | **Floating companion** |

**Key insight**: Notion is the only reference that treats content as composable blocks rather than fixed page layouts. This is the most flexible model for Rally HQ where tournament pages might need text + database + media + comments in any arrangement. The warm palette is also a differentiator — it proves you can have a dense, productive tool that still feels approachable.

**Updated progressive complexity model**:
- **Stitch** = prompt-first (one input, no chrome)
- **ChatPRD** = onboarding-first (guide to first action)
- **Notion** = composition-first (blocks, flexible layout)
- **Resend** = data-first (show what happened)
- **Vercel** = density-first (show everything)
- **Supabase** = depth-first (navigate deep hierarchies)
