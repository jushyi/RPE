---
phase: quick
plan: 16
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: false
requirements: [QUICK-16]
must_haves:
  truths:
    - "Expo MCP server is registered in Claude Code"
    - "OAuth authentication is completed and MCP server is connected"
  artifacts: []
  key_links:
    - from: "Claude Code MCP config"
      to: "mcp.expo.dev"
      via: "HTTP transport"
      pattern: "expo-mcp"
---

<objective>
Register the official Expo MCP server in Claude Code and authenticate via OAuth so that EAS Build management, workflow triggers, debugging, and Expo SDK knowledge are available as MCP tools.

Purpose: Enable Claude Code to interact with Expo services (builds, deployments, debugging) directly through MCP tooling.
Output: Working Expo MCP server connection in Claude Code.
</objective>

<execution_context>
@C:/Users/maser/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/maser/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
Project already has EAS configured (eas.json, project ID: 8ea209dd-0ed7-4d73-9aee-3a6fe3993657, owner: spoodsjs).
</context>

<tasks>

<task type="auto">
  <name>Task 1: Register Expo MCP server in Claude Code</name>
  <files></files>
  <action>
Run the following command to add the Expo MCP server as an HTTP transport MCP:

```sh
claude mcp add --transport http expo-mcp https://mcp.expo.dev/mcp
```

This registers the remote Expo MCP server. No local files are modified in the project — this updates Claude Code's MCP configuration.
  </action>
  <verify>
    <automated>claude mcp list | grep -i expo</automated>
  </verify>
  <done>expo-mcp appears in the MCP server list with HTTP transport pointing to https://mcp.expo.dev/mcp</done>
</task>

<task type="checkpoint:human-action" gate="blocking">
  <name>Task 2: Authenticate Expo MCP via OAuth</name>
  <what-built>The Expo MCP server has been registered in Claude Code.</what-built>
  <how-to-verify>
    1. Run `/mcp` in Claude Code to see the Expo MCP server status
    2. If it shows as needing authentication, trigger the OAuth flow by interacting with the MCP server
    3. Complete authentication using either:
       - A Personal Access Token from EAS dashboard (expo.dev > Account Settings > Access Tokens)
       - Or your Expo username/password credentials
    4. After authenticating, verify the MCP server shows as connected by running `/mcp` again
    5. Optionally test by asking Claude Code to list EAS builds or check project status
  </how-to-verify>
  <resume-signal>Type "authenticated" once the Expo MCP server shows as connected, or describe any issues</resume-signal>
</task>

</tasks>

<verification>
- `/mcp` shows expo-mcp as registered and connected
- Claude Code can access Expo MCP tools (build management, SDK knowledge, etc.)
</verification>

<success_criteria>
Expo MCP server is registered, authenticated, and available for use in Claude Code sessions for this project.
</success_criteria>

<output>
After completion, create `.planning/quick/16-set-up-mcp-server-for-expo-build-trackin/16-SUMMARY.md`
</output>
