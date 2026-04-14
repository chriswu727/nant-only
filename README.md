# nant-only

**Not ANT? Now you are.**

Unlock the full potential of your non-ANT Claude Code. This project replicates Anthropic employee-only (`USER_TYPE === 'ant'`) quality directives — the same ones that prevent hallucinations, force deep reasoning, and eliminate lazy outputs in internal builds.

**Heads up:** This will burn through your tokens significantly faster. The directives push Claude to think deeper, verify more, and never cut corners — all of which cost tokens. Only enable this when you actually need peak performance — complex debugging, critical production code, architectural decisions. For routine tasks, vanilla Claude Code is fine. Don't leave this on 24/7 unless you enjoy hitting rate limits.

## Background

Claude Code's source code gates several critical quality-control prompts behind `process.env.USER_TYPE === 'ant'`. These directives were added after internal research showed Capybara v8 had a **29-30% false-claims rate** (vs v4's 16.7%) and needed prompt-level mitigation.

Anthropic employees get these. You don't. Until now.

## What gets unlocked

| Directive | Source | What it does |
|---|---|---|
| **Faithful Outcome Reporting** | `prompts.ts:237-242` | Prevents hallucinated test results, fabricated success, suppressed failures |
| **Anti-Sycophancy** | `prompts.ts:225-228` | Pushes back on wrong premises, flags adjacent bugs, collaborator not executor |
| **Thoroughness & Verification** | `prompts.ts:210-211` | Must verify work actually runs before reporting complete |
| **Anti-Laziness** | composite | No skipping steps, no partial implementations marked as done |
| **Maximum Reasoning** | composite | Step-by-step thinking, verify before claiming, admit uncertainty |
| **Comment Discipline** | `prompts.ts:205-213` | Only comment the "why", never the "what"; don't remove existing comments blindly |
| **Edit Precision** | `FileEditTool/prompt.ts:17-18` | Use smallest unique old_string, avoid grabbing 10+ lines |
| **Communication Style** | `prompts.ts:404-414` | Write for humans, not logs; flowing prose over fragments |
| **Plan Mode Restraint** | `EnterPlanModeTool/prompt.ts:101-164` | Only plan when genuinely ambiguous; prefer starting work over over-planning |

## What this can't do

These are **API-level parameters**, not prompt-level — no MCP server or CLAUDE.md can change them:

- **Reasoning effort** → run `/effort max` in Claude Code
- **Thinking budget** → type `ultrathink` in your prompt
- **Numeric effort values (1-100)** → ANT-only API feature, no workaround
- **Explore agent model** → ANTs get Opus/Sonnet, you get Haiku for subagents

## How it works

Two-layer injection at different priority levels:

| Layer | File | Weight | Role |
|---|---|---|---|
| **CLAUDE.md** | `~/CLAUDE.md` | Highest — injected into system prompt | Full ANT-only directives, all 9 categories |
| **MCP Server** | `nant-only/index.js` | Medium — injected via `system-reminder` | Condensed reinforcement, fits 2048-char cap |

CLAUDE.md instructions are loaded into the system prompt by Claude Code on every session — this is the same mechanism that project-level instructions use, but at the global (`~/`) level it applies everywhere.

The MCP server provides `instructions` in its `InitializeResult` response, which Claude Code injects as `system-reminder` blocks. This is the same pathway used by first-party MCP servers like Pencil. Having both layers means the directives hit the model from two angles.

## Setup

### 1. CLAUDE.md (system prompt layer)

Copy the provided `CLAUDE.md` to your home directory:

```bash
git clone https://github.com/chriswu727/nant-only.git
cp nant-only/CLAUDE.md ~/CLAUDE.md
```

If you already have a `~/CLAUDE.md`, merge the directives into it manually.

### 2. MCP Server (system-reminder layer)

**Option A: npx (no install needed)**

Add to `~/.claude.json` under `mcpServers`:

```json
{
  "nant-only": {
    "command": "npx",
    "args": ["-y", "nant-only"],
    "env": {},
    "type": "stdio"
  }
}
```

**Option B: from cloned repo**

```bash
cd nant-only
npm install
```

```json
{
  "nant-only": {
    "command": "node",
    "args": ["/absolute/path/to/nant-only/index.js"],
    "env": {},
    "type": "stdio"
  }
}
```

### 3. Selective directives (optional)

Don't want all directives? Set `NANT_DIRECTIVES` to a comma-separated list:

```json
{
  "nant-only": {
    "command": "npx",
    "args": ["-y", "nant-only"],
    "env": {
      "NANT_DIRECTIVES": "hallucination,reasoning"
    },
    "type": "stdio"
  }
}
```

Available directives: `hallucination`, `sycophancy`, `laziness`, `reasoning`, `edit`, `verify`. Default: `all`.

### 4. API-level settings (optional but recommended)

In `~/.claude/settings.json`:

```json
{
  "effortLevel": "max"
}
```

And type `ultrathink` in your prompts for tasks that need deep reasoning.

Restart Claude Code. Everything connects automatically on session start.

## Tools

| Tool | What it does |
|---|---|
| `check_status` | Shows which directives are active, configuration, and companion layer recommendations |
| `remind_max_effort` | Mid-session slap — reinforce all directives when Claude gets lazy |

## The full stack

For maximum effect, combine all layers:

1. **`~/CLAUDE.md`** — prompt-level directives (always active)
2. **nant-only MCP** — reinforcement via system-reminder (always active)
3. **`/effort max`** — API-level reasoning depth (Opus 4.6 only)
4. **`ultrathink`** — extended thinking budget (per-prompt)

## License

MIT
