# Discord.js Code Editor - AI Copilot Instructions

## Project Overview

**Discord.js Code Bin** is a Next.js web application for sharing, analyzing, and reviewing Discord.js bot code snippets. It provides intelligent suggestions, syntax highlighting, and code persistence via file-based storage.

### Core Architecture

- **Frontend**: React components (TypeScript) with daisyUI + Tailwind CSS 4
- **Backend**: Next.js API routes with file-based paste storage (`/data` directory)
- **Analysis Engine**: Custom regex-based code analyzer detecting Discord.js patterns and errors
- **Editor**: Custom lightweight textarea with real-time syntax highlighting (no Monaco Editor)

## Key Components & Data Flow

### Main Pages

1. **Home (`app/page.tsx`)** → Navbar + EditorPage container
2. **Paste Viewer (`app/paste/[id]/page.tsx`)** → Read-only CodeEditor + metadata display
3. **EditorPage (`components/EditorPage.tsx`)** → Main hub orchestrating:
   - Title/Description inputs (metadata)
   - CodeEditor + SuggestionsPanel (split view)
   - SaveModal for language/visibility settings
   - Footer component

### Data Flow

```
User types code in CodeEditor
  ↓ (500ms debounce)
analyzeDiscordJsCode() runs pattern matching
  ↓
Matches enrich with Discord.js examples from `/api/docs`
  ↓
SuggestionsPanel renders with syntax-highlighted code blocks
  ↓
User clicks "Save & Share" → SaveModal
  ↓
POST /api/paste saves to `/data/*.json`
  ↓
ShareURL copied to clipboard
```

## Styling & UI Patterns

### daisyUI + Tailwind CSS 4 Rules

- **Always use daisyUI semantic colors**: `text-base-content`, `bg-base-100`, `badge-primary` (NOT hardcoded hex/rgb)
- **Modal pattern**: Use exact structure from daisyUI docs - `<dialog className="modal">` + `<div className="modal-box">` + `<div className="modal-action">`
- **Responsive**: Use `lg:` prefix for desktop-specific layouts (e.g., `w-full lg:w-2/5`)
- **No custom CSS**: All styling via daisyUI components or Tailwind utilities
- **Spacing hierarchy**: `m-6` (margins) → `px-4 py-8` (padding) for layout breathing room

### Layout Container

All content wrapped in `EditorPage` with `m-6 rounded-2xl overflow-hidden shadow-xl` creating visual container effect.

## Code Analysis System

### Pattern Matching Files

1. **`lib/analyzer.ts`** - Main entry point

   - Analyzes code for Discord.js issues
   - Returns `Suggestion[]` with message + optional code examples
   - 500ms debounce on keystroke

2. **`lib/analyzer/extractErrors.ts`** - Error detection

   - Reads Discord.js source from `node_modules/discord.js/src`
   - Extracts JSDoc `@example` blocks via regex
   - Maps error patterns to validation checks

3. **`lib/discordJsDocFetcher.ts`** - Example enrichment
   - Loads examples from installed Discord.js package
   - Provides ModalBuilder, SlashCommandBuilder, interaction handling patterns
   - Returns Map<string, DocExample> with `name`, `description`, `example`, `docLink`

### Suggestion Object Structure

```typescript
interface Suggestion {
  message: string; // "Consider adding error handling"
  details?: string; // Additional context
  code?: string; // Example code snippet (enriched from docs)
  docLink?: string | null; // Link to Discord.js docs
}
```

### Key Analysis Rules

- **Intents**: Detects missing `GatewayIntentBits.MessageContent` for message.content
- **Error Handling**: Flags `client.on('error')` and `unhandledRejection` missing
- **Deprecated**: Catches old string-based intents, legacy fetch patterns
- **Best Practices**: Suggests proper event handlers, Collection usage, imports

## Paste Storage

### Schema (`PasteData`)

```typescript
{
  id: string                                    // nanoid(8)
  code: string
  title?: string                                // From EditorPage metadata
  description?: string                          // From EditorPage metadata
  language: 'javascript' | 'typescript' | 'json' // From SaveModal
  createdAt: string                            // ISO timestamp
  views: number                                // Read counter
  isPublic: boolean                            // From SaveModal toggle
}
```

### Storage Location

- **Dev**: `/data/*.json` (file-based, gitignored)
- **API**: `POST /api/paste` (creates) → `GET /api/paste/[id]` (retrieves)
- **Retrieval**: `app/paste/[id]/page.tsx` fetches and displays

## Custom Syntax Highlighter

### Implementation (`components/CodeEditor.tsx`)

- **Zero dependencies** - pure regex pattern matching
- **11 syntax categories**: comments, strings, keywords (5 types), built-ins, functions, numbers, booleans
- **Real-time**: Updates on every keystroke
- **Line numbers**: Synced scroll with textarea overlay

### Pattern Examples

```typescript
const patterns = [
  { regex: /\/\/.*$/gm, class: "text-slate-500 italic" }, // Comments
  {
    regex: /\b(const|let|var|function|async|await)\b/g,
    class: "text-blue-400",
  }, // Keywords
  { regex: /\b(true|false|null|undefined)\b/g, class: "text-purple-400" }, // Booleans
];
```

### Overlap Prevention

- Patterns sorted by position then length
- Early matches skip later overlapping tokens

## File Organization

```
app/
  api/paste/route.ts        # POST/GET paste endpoints
  paste/[id]/page.tsx       # Paste viewer
  layout.tsx                # Root layout with body padding
  globals.css               # Tailwind + daisyUI imports
  page.tsx                  # Home page (redirects to EditorPage)

components/
  CodeEditor.tsx            # Custom textarea + syntax highlighter
  EditorPage.tsx            # Main container, state management
  SaveModal.tsx             # daisyUI modal for language/visibility
  SuggestionsPanel.tsx      # Suggestions panel with markdown rendering
  Footer.tsx                # Multi-column footer
  ThemeSwitcher.tsx         # daisyUI theme controller

lib/
  analyzer.ts               # Main analysis entry
  analyzer/extractErrors.ts # Error pattern extraction
  discordJsDocFetcher.ts    # Doc example enrichment
```

## Development Workflow

### Local Setup

```bash
npm install
npm run dev          # localhost:3000 with Turbopack
```

### Key Commands

- `npm run build` - Next.js production build
- `npm run lint` - ESLint check
- **No type checking** in build (TS types for IDE only)

### Adding Features

1. **New suggestion type**: Add pattern to `lib/analyzer.ts` regex array
2. **New component**: Create in `components/`, use daisyUI + Tailwind only
3. **API endpoint**: Create `app/api/[route]/route.ts` with `export async function POST/GET`
4. **Styling**: Update component classes, never write custom CSS

## Common Patterns & Conventions

### Metadata Split

- **EditorPage level**: Title, Description inputs (always visible)
- **SaveModal level**: Language selector, Public toggle (save-time)
- **Both passed to SaveModal** for enrichment before POST

### Modal Pattern (daisyUI)

```tsx
<dialog ref={dialogRef} className="modal">
  <div className="modal-box">{/* content */}</div>
</dialog>
```

- `useRef` + `useEffect` for `.showModal()/.close()` lifecycle
- `<form method="dialog">` auto-closes on submit
- Use `modal-action` for button grouping

### Responsive Layout

- Desktop: `flex flex-row gap-8` (suggestions left, editor right)
- Mobile: `flex flex-col` (stacked)
- Use `lg:` prefix for breakpoints

## Important Gotchas

1. **daisyUI Modal**: Must use exact structure - NO custom outer padding/flex centering
2. **Syntax Highlighter**: Patterns with `g` flag can't be reused - create new instance each render
3. **Paste Storage**: File-based in `/data` - NOT persisted in production unless migrated to DB
4. **SuggestionsPanel**: Renders markdown from code analyzer - use react-markdown with custom renderers
5. **Body Padding**: Added at layout level (`m-6`) - don't add to EditorPage to avoid double spacing

## Performance Notes

- Code analysis debounced to 500ms (not real-time on every keystroke)
- Syntax highlighting runs on every keystroke (optimized regex patterns)
- Suggestions panel virtualized if list grows beyond ~20 items (future optimization)
- File-based storage scales to ~1000 pastes before slow (recommend DB migration)
