# Deterministic UI Generator

An AI-powered application that converts natural language UI descriptions into working React interfaces using a **fixed component system** and a **multi-step AI agent pipeline**.

Built with Next.js (App Router), React, plain CSS Modules, `lucide-react` icons, and Google Gemini via `@google/genai`.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                      Browser (Client)                     │
│  ┌─────────────┐    ┌──────────┐    ┌─────────────────┐  │
│  │  Chat Panel  │    │  Code    │    │  Live Preview   │  │
│  │  (Left)      │    │  Editor  │    │  (Right)        │  │
│  └──────┬───────┘    └────┬─────┘    └────────▲────────┘  │
│         │                 │                    │           │
│         │   POST /api/generate                 │           │
│         ▼                 │        React render │           │
│  ┌──────────────┐         │         from code  │           │
│  │  API Route   │─────────┘                    │           │
│  └──────┬───────┘                              │           │
│         │                                      │           │
└─────────┼──────────────────────────────────────┼───────────┘
          │                                      │
          ▼                                      │
┌──────────────────────────────────────────────────────────┐
│                   Agent Pipeline (Server)                  │
│                                                           │
│  ┌──────────┐    ┌───────────┐    ┌──────────────┐       │
│  │ Planner  │───▶│ Generator │───▶│  Explainer   │       │
│  │ (Step 1) │    │ (Step 2)  │    │  (Step 3)    │       │
│  └────┬─────┘    └─────┬─────┘    └──────┬───────┘       │
│       │                │                  │               │
│   validate          validate           return             │
│    plan               code          explanation            │
│       │                │                  │               │
│       ▼                ▼                  ▼               │
│  ┌────────────────────────────────────────────────┐      │
│  │           Version Store (In-Memory)             │      │
│  └────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────┘
```

---

## Agent Design

### Step 1: Planner

**Input:** User message + current UI plan (if iterating)

**Output:** Structured JSON plan:
```json
{
  "layout": "sidebar-main",
  "components": [
    { "type": "Sidebar", "props": { "title": "Menu", "items": ["Home", "Users"] } },
    { "type": "Table", "props": { "title": "Users", "columns": ["Name", "Email"] } }
  ]
}
```

**Behavior:**
- Converts natural language into a deterministic plan
- When a plan already exists, modifies incrementally
- Only selects from the 8 allowed components
- Output is validated against the component whitelist

### Step 2: Generator

**Input:** Structured plan + previous code (if iterating)

**Output:** React JSX code

**Behavior:**
- Generates complete React components using only allowed imports
- Preserves existing code structure during modifications
- Imports components from `../components`
- Only uses allowed HTML elements for layout (div, main, p, h1-h6, span)

### Step 3: Explainer

**Input:** Plan + generated code + previous plan

**Output:** Plain English explanation

**Behavior:**
- Explains layout decisions
- Describes component choices
- Highlights changes from previous version (if applicable)

---

## Prompt Templates

### Planner System Prompt
```
You are the Planner agent in a deterministic UI generation system.
Your job is to convert natural language UI descriptions into a structured JSON plan.

STRICT RULES:
1. You may ONLY use these components: Button, Card, Input, Table, Modal, Sidebar, Navbar, Chart
2. You cannot create new components
3. Your output must be valid JSON only

OUTPUT FORMAT:
{ "layout": "...", "components": [...] }
```

### Generator System Prompt
```
You are the Generator agent in a deterministic UI generation system.
Your job is to generate React JSX code from a structured plan.

STRICT RULES:
1. Only use allowed components (imported from '../components')
2. No inline CSS for styling (only layout positioning)
3. No external UI libraries
4. Component must be named "GeneratedUI" and exported as default
5. When modifying existing code, preserve as much as possible
```

### Explainer System Prompt
```
You are the Explainer agent. Explain in plain English what the generated UI
contains, why certain decisions were made, and what changed from previous versions.
```

---

## Component System

### Fixed Component Library

| Component | Description | Key Props |
|-----------|-------------|-----------|
| `Button` | Action button | `variant`, `size`, `children`, `fullWidth` |
| `Card` | Content container | `title`, `subtitle`, `padding` |
| `Input` | Form input | `label`, `placeholder`, `type`, `error` |
| `Table` | Data table | `title`, `columns`, `rows`, `striped` |
| `Modal` | Dialog overlay | `title`, `open`, `onClose`, `size` |
| `Sidebar` | Side navigation | `title`, `items`, `activeItem` |
| `Navbar` | Top navigation | `title`, `items`, `actions` |
| `Chart` | Data chart (mock) | `title`, `type`, `data`, `height` |

### Rules
- **No inline styles** (except layout wrappers in generated code)
- **No AI-generated CSS** — all styling comes from CSS Modules in the component library
- **No Tailwind class generation by AI**
- **No external UI libraries**
- AI **cannot create new components** — only select, arrange, and pass props

---

## Versioning Logic

- **In-memory storage** using a `Map<sessionId, Version[]>`
- Each generation creates a new version with:
  - Version ID (auto-incrementing)
  - Timestamp
  - User message
  - Plan (JSON)
  - Generated code
  - Explanation
- **Rollback** creates a new version that copies the target version's data
- History is displayed in the left panel
- Versions persist for the duration of the server process

---

## Safety Measures

### Component Whitelist Enforcement
- Planner output is validated: only `Button`, `Card`, `Input`, `Table`, `Modal`, `Sidebar`, `Navbar`, `Chart` allowed
- Generated code is scanned for non-allowed capitalized JSX tags

### Code Validation
Forbidden patterns detected and rejected:
- `styled-components`, `emotion`, `@emotion`
- External UI library imports (`@mui`, `@chakra`, `antd`, etc.)
- `dangerouslySetInnerHTML`, `<script>`, `eval()`, `Function()`
- `document.write`, `window.location`

### Prompt Injection Protection
User messages are scanned for patterns like:
- "ignore previous instructions"
- "you are now"
- "bypass the safety"
- "override the rules"

Suspicious messages generate warnings but are still processed.

### Error Handling
- Each agent step has try/catch with meaningful error messages
- Generator has retry logic if initial code fails validation
- Explainer failure is non-fatal (won't block generation)
- API returns structured error responses

---

## Known Limitations

1. **No persistent storage** — versions are lost on server restart
2. **No real-time collaboration** — single-user sessions only
3. **Preview rendering** is pattern-based (not full JSX eval) — complex nested structures may not render perfectly
4. **Mock LLM** fallback is keyword-based — real LLM provides much better results
5. **No authentication** — anyone can access the app
6. **Code editor** is a textarea, not a full IDE (Monaco could be added)
7. **No undo** for code editor changes (only version rollback)
8. **Session data** is not shared across server instances

---

## Improvements With More Time

- **Monaco Editor** integration for syntax highlighting, autocomplete
- **Persistent storage** with SQLite or PostgreSQL
- **Streaming responses** for real-time generation feedback
- **Component prop editor** — visual prop editing alongside code
- **Export to file** — download generated code as a project
- **Multiple LLM providers** -- switch between Gemini, OpenAI, Anthropic, etc.
- **Preview sandboxing** — use iframe with sandboxed React runtime
- **Responsive design** preview at different breakpoints
- **Component composition** — support nested component trees in the plan
- **Testing** — unit tests, integration tests, E2E tests
- **Authentication** — user accounts, saved sessions
- **Rate limiting** — protect API from abuse

---

## Setup Instructions

### Prerequisites

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- (Optional) **Gemini API key** for real LLM responses

### Installation

```bash
# Clone / navigate to the project
cd deterministic-ui-generator

# Install dependencies
npm install

# (Optional) Set up environment variables
# Create a .env.local file:
echo "GEMINI_API_KEY=your-key-here" > .env.local

# Start development server
npm run dev
```

The app will be available at **http://localhost:3000**.

### Without an API Key

The app works **without an API key** using a built-in mock LLM that generates deterministic responses based on keyword detection. This is suitable for testing and demos.

---

## Deployment Instructions (Vercel)

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add GEMINI_API_KEY
```

### Option 2: Vercel Dashboard

1. Push your code to a GitHub/GitLab/Bitbucket repository
2. Go to [vercel.com](https://vercel.com) and click "New Project"
3. Import your repository
4. Set environment variables:
   - `GEMINI_API_KEY` -- your Google Gemini API key
5. Click "Deploy"

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No* | Google Gemini API key |
| `GEMINI_MODEL` | No | Model name (default: `gemini-2.0-flash`) |

*The app works without an API key using the built-in mock LLM.

---

## Project Structure

```
/app
  /api
    /generate
      route.js          # API endpoint for generate/rollback/history
  page.jsx              # Main page with chat, editor, preview
  layout.jsx            # Root layout
  globals.css           # Global styles

/components
  Button.jsx            # Button component
  Button.module.css
  Card.jsx              # Card component
  Card.module.css
  Input.jsx             # Form input component
  Input.module.css
  Table.jsx             # Data table component
  Table.module.css
  Modal.jsx             # Modal dialog component
  Modal.module.css
  Sidebar.jsx           # Sidebar navigation component
  Sidebar.module.css
  Navbar.jsx            # Top navigation component
  Navbar.module.css
  Chart.jsx             # Chart component (mock data)
  Chart.module.css
  index.js              # Component barrel export

/agents
  planner.js            # Step 1: Converts intent to JSON plan
  generator.js          # Step 2: Converts plan to React code
  explainer.js          # Step 3: Generates explanation
  agent.js              # Orchestrator: runs all steps

/lib
  llm.js                # LLM abstraction (Google Gemini via @google/genai)
  validator.js          # Whitelist enforcement & validation
  versionStore.js       # In-memory version storage

README.md
package.json
next.config.js
jsconfig.json
```
