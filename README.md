# nant-only

**Not ANT? Now you are.**

An MCP server that unlocks Anthropic employee-only (`USER_TYPE === 'ant'`) quality directives in Claude Code — for everyone.

## Background

Claude Code's source code gates several critical quality-control prompts behind `process.env.USER_TYPE === 'ant'`. These directives were added after internal research showed Capybara v8 had a **29-30% false-claims rate** (vs v4's 16.7%) and needed prompt-level mitigation.

Anthropic employees get these. You don't. Until now.

This MCP server injects the same directives via the MCP instructions mechanism, which reaches the model through `system-reminder` blocks — the same pathway the original prompts use.

## What gets unlocked

| Directive | Source | What it does |
|---|---|---|
| **Faithful Outcome Reporting** | `prompts.ts:237-242` | Prevents hallucinated test results, fabricated success, suppressed failures |
| **Anti-Sycophancy** | `prompts.ts:225-228` | Pushes back on wrong premises, flags adjacent bugs, collaborator not executor |
| **Anti-Laziness** | composite | No skipping steps, no partial implementations marked as done |
| **Maximum Reasoning** | composite | Step-by-step thinking, verify before claiming, admit uncertainty |
| **Comment Discipline** | `prompts.ts:205-208` | Only comment the "why", never the "what" |

## What this can't do

These are **API-level parameters**, not prompt-level — no MCP server can change them:

- **Reasoning effort** → run `/effort max` in Claude Code
- **Thinking budget** → type `ultrathink` in your prompt
- **Numeric effort values (1-100)** → ANT-only API feature, no workaround

## Setup

```bash
git clone https://github.com/chriswu727/nant-only.git
cd nant-only
npm install
```

Add to `~/.claude.json` under `mcpServers`:

```json
{
  "nant-only": {
    "command": "node",
    "args": ["/path/to/nant-only/index.js"],
    "env": {},
    "type": "stdio"
  }
}
```

Restart Claude Code. The server connects automatically on every session.

## Mid-session reminder

Claude getting lazy? Invoke the `remind_max_effort` tool to slap it back into shape.

## Recommended companion settings

In `~/.claude/settings.json`:

```json
{
  "effortLevel": "max"
}
```

For the full stack: `nant-only` (prompt-level) + `/effort max` (API-level) + `ultrathink` (thinking budget).

## How it works

MCP servers can provide `instructions` in their `InitializeResult` response. Claude Code injects these into `system-reminder` blocks that reach the model alongside the system prompt. This is the same mechanism used by first-party MCP servers like Pencil.

The instructions are capped at 2048 characters by Claude Code's MCP client, so the directives are carefully condensed to fit.

## License

MIT
