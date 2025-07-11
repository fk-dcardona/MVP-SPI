# Supabase MCP Protocol

## Overview

The Supabase MCP (Model Context Protocol) server is the official bridge between AI assistants (like Cursor, Claude, etc.) and your Supabase project. It standardizes how LLMs interact with your database, migrations, and project configuration, exposing a set of "tools" for schema management, querying, branching, debugging, and more.

---

## Setup

### Prerequisites
- Node.js (LTS) installed
- Supabase personal access token (PAT) from your Supabase dashboard

### MCP Client Configuration
Add this to your `.mcp.json`:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=<your-project-ref>"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<your-personal-access-token>"
      }
    }
  }
}
```
- Replace `<your-project-ref>` with your Supabase project ref (from your project’s API settings).
- Replace `<your-personal-access-token>` with your PAT.

### Running the MCP Server
To start the MCP server and connect your AI tool, run:
```bash
npx -y @supabase/mcp-server-supabase@latest --project-ref=<your-project-ref> --access-token <your-personal-access-token>
```

---

## Usage Protocols

### Common Tool Calls
- **List tables:**
  ```bash
  npx mcp run supabase list_tables
  ```
- **Apply migration:**
  ```bash
  npx mcp run supabase apply_migration --file path/to/migration.sql
  ```
- **Execute SQL:**
  ```bash
  npx mcp run supabase execute_sql "SELECT * FROM your_table;"
  ```
- **List migrations:**
  ```bash
  npx mcp run supabase list_migrations
  ```
- **Get logs:**
  ```bash
  npx mcp run supabase get_logs --service=postgres
  ```

### Security Protocols
- Use a development or staging project, not production.
- Use read-only mode (`--read-only`) if you only want to allow SELECTs.
- Scope the MCP server to a specific project with `--project-ref`.
- Never share your PAT or MCP config with untrusted parties.

---

## Golden Rule
**For all future Supabase challenges, default to using MCP for migrations, schema management, and debugging.**

---

## References
- [Supabase MCP Blog](https://supabase.com/blog/mcp-server)
- [Supabase MCP GitHub](https://github.com/supabase-community/supabase-mcp.git) 