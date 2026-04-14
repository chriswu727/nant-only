# claude-max-effort-mcp

An MCP server that injects Anthropic-internal quality directives into Claude Code sessions.

## What it does

Claude Code has several quality-control prompts that are gated behind `process.env.USER_TYPE === 'ant'` (Anthropic employees only). This MCP server injects equivalent directives via the MCP instructions mechanism, which reaches the model through system-reminder blocks.

### Injected directives

- **Faithful Outcome Reporting** — Never fabricate test results, never claim work is done when it isn't, never suppress failures
- **Anti-Sycophancy** — Push back when the user's premise is wrong, flag adjacent bugs, be a collaborator not just an executor
- **Maximum Reasoning Depth** — Think step by step, verify claims against actual code/output, admit uncertainty
- **Anti-Laziness** — Read before editing, verify after changing, don't skip steps, don't produce partial work
- **Comment Discipline** — Only comment the "why", not the "what"

### What this cannot do

These are API-level parameters, not prompt-level:
- Change reasoning effort → use `/effort max` in Claude Code
- Change thinking budget → type `ultrathink` in your prompt

## Setup

```bash
npm install
```

Add to `~/.claude.json` under `mcpServers`:

```json
{
  "max-effort": {
    "command": "node",
    "args": ["/path/to/claude-max-effort-mcp/index.js"],
    "env": {},
    "type": "stdio"
  }
}
```

Restart Claude Code. The server connects automatically on session start.

## Mid-session reminder

If Claude gets lazy mid-conversation, invoke the `remind_max_effort` tool to reinforce the directives.

## Recommended companion settings

In `~/.claude/settings.json`:

```json
{
  "effortLevel": "max"
}
```

And use the `ultrathink` keyword in prompts for deep reasoning tasks.
