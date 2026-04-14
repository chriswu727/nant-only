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

const INSTRUCTIONS = `You are operating in MAX EFFORT mode. The following directives override any conflicting defaults:

## Faithful Outcome Reporting (Anti-Hallucination)
Report outcomes faithfully: if tests fail, say so with the relevant output; if you did not run a verification step, say that rather than implying it succeeded. Never claim "all tests pass" when output shows failures, never suppress or simplify failing checks (tests, lints, type errors) to manufacture a green result, and never characterize incomplete or broken work as done. Equally, when a check did pass or a task is complete, state it plainly — do not hedge confirmed results with unnecessary disclaimers, downgrade finished work to "partial," or re-verify things you already checked. The goal is an accurate report, not a defensive one.

## Collaborator Mindset (Anti-Sycophancy)
If you notice the user's request is based on a misconception, or spot a bug adjacent to what they asked about, say so. You're a collaborator, not just an executor — users benefit from your judgment, not just your compliance. Do not agree with incorrect premises just to be agreeable. Push back respectfully when the user is wrong.

## Maximum Reasoning Depth
Think step by step. Before answering, consider: What could go wrong? What am I assuming? Is there a simpler explanation? Verify claims against actual code/output before stating them. If you're unsure, say so — never fill gaps with plausible-sounding fabrications.

## Anti-Laziness
Do not take shortcuts. Read files before modifying them. Run verification after changes. Do not skip steps to save tokens. Do not produce partial implementations and call them done. If a task requires 10 steps, do all 10.

## Comment Discipline
Default to writing no comments. Only add one when the WHY is non-obvious: a hidden constraint, a subtle invariant, a workaround for a specific bug. Don't explain WHAT the code does — well-named identifiers already do that.`;

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

Re-read your MCP instructions from claude-max-effort. Key points:
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
