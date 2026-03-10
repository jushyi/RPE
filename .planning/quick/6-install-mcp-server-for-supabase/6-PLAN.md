---
phase: quick
plan: 6
type: execute
wave: 1
depends_on: []
files_modified: [.mcp.json]
autonomous: false
requirements: [QUICK-6]
must_haves:
  truths:
    - "Claude Code can query Supabase tables via MCP tools"
    - "MCP server connects to the correct Supabase project"
  artifacts:
    - path: ".mcp.json"
      provides: "Supabase MCP server configuration"
      contains: "supabase"
  key_links:
    - from: ".mcp.json"
      to: "Supabase project gwyxupopptefstemsrwv"
      via: "MCP server connection"
---

<objective>
Install and configure the Supabase MCP server for Claude Code so that Claude can directly query and interact with the Supabase database during development sessions.

Purpose: Enable Claude to inspect schema, run queries, and manage the Supabase project without manual context-sharing.
Output: Working .mcp.json configuration at project root.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
Supabase project URL: https://gwyxupopptefstemsrwv.supabase.co
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create .mcp.json with Supabase MCP server config</name>
  <files>.mcp.json</files>
  <action>
Create `.mcp.json` at the project root with the Supabase MCP server configuration.

Use the official `@supabase/mcp-server-supabase` package via npx:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "USER_MUST_REPLACE_THIS"
      }
    }
  }
}
```

Notes:
- Use `--read-only` flag for safety (prevents destructive operations). The user can remove this flag later if write access is needed.
- The SUPABASE_ACCESS_TOKEN is a personal access token (PAT) from the Supabase dashboard, NOT the anon key. The user must generate one.
- Do NOT hardcode any real token values. Use a placeholder.
  </action>
  <verify>
    <automated>cat .mcp.json | node -e "const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(j.mcpServers.supabase ? 'VALID' : 'INVALID')"</automated>
  </verify>
  <done>.mcp.json exists at project root with valid JSON containing supabase MCP server config</done>
</task>

<task type="checkpoint:human-action" gate="blocking">
  <what-built>Supabase MCP server configuration file (.mcp.json)</what-built>
  <how-to-verify>
    1. Generate a Supabase Personal Access Token (PAT):
       - Go to https://supabase.com/dashboard/account/tokens
       - Click "Generate new token"
       - Give it a name (e.g., "Claude Code MCP")
       - Copy the token
    2. Open `.mcp.json` in the project root
    3. Replace `USER_MUST_REPLACE_THIS` with your actual PAT
    4. Restart Claude Code (exit and re-open) for MCP changes to take effect
    5. Verify by asking Claude to list your Supabase tables
  </how-to-verify>
  <resume-signal>Type "done" once you have replaced the token and restarted Claude Code</resume-signal>
</task>

</tasks>

<verification>
- .mcp.json exists and is valid JSON
- Contains supabase MCP server entry with correct package name
- Token placeholder is present (user replaces manually)
</verification>

<success_criteria>
- .mcp.json created with Supabase MCP server configuration
- User has been instructed on how to add their PAT
- After user setup, Claude Code can use Supabase MCP tools
</success_criteria>

<output>
After completion, create `.planning/quick/6-install-mcp-server-for-supabase/6-SUMMARY.md`
</output>
