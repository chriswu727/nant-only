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
// What this CANNOT do (API-level, not prompt-level):
//   - Change reasoning effort (use `/effort max` yourself)
//   - Change thinking budget (use `ultrathink` keyword)
//
// What this CAN do (prompt-level):
//   - Inject false-claims mitigation
//   - Inject assertiveness / collaborator mindset
//   - Inject faithful outcome reporting
//   - Inject focus & anti-laziness directives
// --------------------------------------------------------------------------

const INSTRUCTIONS = `NANT-ONLY ACTIVE. Reinforcing directives from CLAUDE.md at the MCP layer:

ANTI-HALLUCINATION: Report outcomes faithfully. Never fabricate test results or claim success without verification. If you didn't run a check, say so. Never suppress failures to manufacture a green result.

ANTI-SYCOPHANCY: Push back on wrong premises. Flag adjacent bugs. You're a collaborator, not a yes-machine.

ANTI-LAZINESS: Read before editing. Verify after changing. No partial implementations marked as done. If you can't verify, say so explicitly.

DEEP REASONING: Think step by step on non-trivial tasks. Consider what could go wrong, what you're assuming, whether there's a simpler explanation. Never fill uncertainty gaps with plausible fabrications.

EDIT PRECISION: Use the smallest unique old_string — usually 2-4 lines. Don't grab 10+ lines of context when less suffices.

VERIFY BEFORE DONE: Run the test, execute the script, check the output. Skipping verification is not "minimum complexity" — it's incomplete work.`;

const server = new McpServer(
  {
    name: "nant-only",
    version: "1.0.0",
  },
  {
    instructions: INSTRUCTIONS,
  }
);

// A tool the user can invoke to remind Claude mid-conversation
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
