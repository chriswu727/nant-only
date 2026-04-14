#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// --------------------------------------------------------------------------
// nant-only
//
// An MCP server that injects Anthropic-internal quality directives into
// Claude Code sessions via the MCP instructions mechanism. These directives
// are normally gated behind `process.env.USER_TYPE === 'ant'` in the Claude
// Code source, but MCP server instructions are injected into system-reminder
// blocks and reach the model the same way.
//
// Configurable via NANT_DIRECTIVES env var (comma-separated):
//   all (default), hallucination, sycophancy, laziness, reasoning, edit, verify
//
// Example: NANT_DIRECTIVES=hallucination,reasoning
// --------------------------------------------------------------------------

const DIRECTIVES = {
  hallucination: `ANTI-HALLUCINATION: Report outcomes faithfully. Never fabricate test results or claim success without verification. If you didn't run a check, say so. Never suppress failures to manufacture a green result.`,

  sycophancy: `ANTI-SYCOPHANCY: Push back on wrong premises. Flag adjacent bugs. You're a collaborator, not a yes-machine.`,

  laziness: `ANTI-LAZINESS: Read before editing. Verify after changing. No partial implementations marked as done. If you can't verify, say so explicitly.`,

  reasoning: `DEEP REASONING: Think step by step on non-trivial tasks. Consider what could go wrong, what you're assuming, whether there's a simpler explanation. Never fill uncertainty gaps with plausible fabrications.`,

  edit: `EDIT PRECISION: Use the smallest unique old_string — usually 2-4 lines. Don't grab 10+ lines of context when less suffices.`,

  verify: `VERIFY BEFORE DONE: Run the test, execute the script, check the output. Skipping verification is not "minimum complexity" — it's incomplete work.`,
};

const ALL_KEYS = Object.keys(DIRECTIVES);

function getActiveDirectives() {
  const env = (process.env.NANT_DIRECTIVES || "all").toLowerCase().trim();
  if (env === "all" || env === "") return ALL_KEYS;
  return env.split(",").map(s => s.trim()).filter(k => k in DIRECTIVES);
}

const activeKeys = getActiveDirectives();
const activeDirectives = activeKeys.map(k => DIRECTIVES[k]).join("\n\n");

const INSTRUCTIONS = `NANT-ONLY ACTIVE [${activeKeys.join(", ")}]. Directives sourced from Claude Code internal (ANT-only) build:\n\n${activeDirectives}`;

const server = new McpServer(
  {
    name: "nant-only",
    version: "1.1.0",
  },
  {
    instructions: INSTRUCTIONS,
  }
);

server.tool(
  "check_status",
  "Check which nant-only directives are currently active in this session.",
  {},
  async () => ({
    content: [
      {
        type: "text",
        text: `nant-only v1.1.0 — STATUS ACTIVE

Enabled directives (${activeKeys.length}/${ALL_KEYS.length}):
${activeKeys.map(k => `  [ON]  ${k}`).join("\n")}
${ALL_KEYS.filter(k => !activeKeys.includes(k)).map(k => `  [OFF] ${k}`).join("\n")}

Configuration: ${process.env.NANT_DIRECTIVES ? `NANT_DIRECTIVES="${process.env.NANT_DIRECTIVES}"` : "all (default)"}

Companion layers:
  - ~/CLAUDE.md: ${activeKeys.length === ALL_KEYS.length ? "recommended (full directives at system prompt weight)" : "optional (MCP layer covers selected directives)"}
  - /effort max: recommended (API-level reasoning depth)
  - ultrathink: use in prompts for deep reasoning tasks`,
      },
    ],
  })
);

server.tool(
  "remind_max_effort",
  "Reinforce max-effort directives mid-conversation. Call this when you notice Claude getting lazy, hallucinating, or taking shortcuts.",
  {},
  async () => ({
    content: [
      {
        type: "text",
        text: `MAX EFFORT REMINDER ACTIVE.

Re-read your MCP instructions from nant-only and your CLAUDE.md directives. Key points:
1. NEVER fabricate outcomes. If you didn't verify, say so.
2. NEVER agree with incorrect premises. Push back respectfully.
3. NEVER skip steps. Read before editing. Verify after changing.
4. NEVER produce partial work and call it done.
5. Think deeply before answering. Consider what could go wrong.

Proceed with maximum diligence.`,
      },
    ],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
