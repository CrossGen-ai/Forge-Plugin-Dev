# Claude Code Snippets

Ready-to-use code examples and configurations for Claude Code development workflows.

## CLI Usage Snippets

### Basic Commands
```bash
# Start interactive session
claude

# Execute one-time task
claude "fix the build error"

# Continue previous conversation
claude -p "explain this function"

# Continue most recent conversation
claude -c

# Reset conversation context
claude -r

# Git commit with AI assistance
claude commit

# Plan mode (read-only analysis)
claude --permission-mode plan
```

### Configuration Management
```bash
# List all settings
claude config list

# Get specific setting
claude config get allowedTools

# Set configuration value
claude config set statusLine.command "~/.claude/statusline.sh"

# Add to list setting
claude config add allowedTools "Bash(git log:*)"

# Remove from list setting
claude config remove disallowedTools "Write"

# Global configuration
claude config set --global apiKey "your-key"
```

## Slash Commands

### Custom Command Creation

**Personal Command** (`~/.claude/commands/security-review.md`)
```markdown
---
allowed-tools: Read, Grep
description: Review code for security vulnerabilities
---
Review this code for security vulnerabilities, focusing on:
- Input validation
- Authentication and authorization
- Data sanitization
- Error handling
- Sensitive data exposure

$ARGUMENTS
```

**Project Command with Arguments** (`.claude/commands/fix-issue.md`)
```markdown
---
allowed-tools: Read, Edit, Bash(git add:*), Bash(git status:*)
argument-hint: [issue-number] [priority]
description: Fix GitHub issue following coding standards
---
Fix issue #$1 with priority $2. Follow these steps:

1. Read the issue description and understand requirements
2. Locate relevant code in the codebase
3. Implement solution following our coding standards
4. Add appropriate tests if needed
5. Stage changes for commit

Current context: !`git status`
Recent commits: !`git log --oneline -5`
```

**Command with File References** (`.claude/commands/compare-implementations.md`)
```markdown
---
description: Compare two implementation approaches
---
Compare the implementations in @$1 and @$2:

1. Analyze architectural differences
2. Evaluate performance implications
3. Assess maintainability and readability
4. Recommend the better approach with reasoning
```

### MCP Commands Usage
```bash
# GitHub integration
/mcp__github__list_prs
/mcp__github__pr_review 456

# Jira integration
/mcp__jira__create_issue "Bug in login flow" high

# Notion integration
/mcp__notion__search_pages "project documentation"

# Database queries
/mcp__postgres__query "SELECT * FROM users LIMIT 10"
```

## Configuration Files

### Basic Settings (`.claude/settings.json`)
```json
{
  "allowedTools": [
    "Read",
    "Edit",
    "Bash(git status:*)",
    "Bash(git diff:*)",
    "Bash(git log:*)",
    "Bash(git add:*)",
    "Bash(npm test:*)",
    "Bash(npm run lint:*)"
  ],
  "disallowedTools": [
    "Bash(rm:*)",
    "Bash(sudo:*)",
    "Bash(chmod:*)"
  ],
  "model": "claude-3-5-sonnet-20241022",
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "padding": 1
  }
}
```

### MCP Server Configuration (`.mcp.json`)
```json
{
  "mcpServers": {
    "github": {
      "type": "sse",
      "url": "https://mcp.github.com",
      "headers": {
        "Authorization": "Bearer ${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "type": "stdio",
      "command": "docker",
      "args": [
        "exec", "-i", "postgres-container",
        "psql", "-U", "${DB_USER}", "-d", "${DB_NAME}"
      ]
    },
    "local-tools": {
      "type": "stdio",
      "command": "node",
      "args": ["./tools/mcp-server.js"]
    }
  }
}
```

### Hooks Configuration
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo '[$(date)] Executing: $TOOL_INPUT_COMMAND' >> ~/.claude/audit.log"
          }
        ]
      },
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/backup-file.sh",
            "timeout": 5000
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash(git commit:*)",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/post-commit-hook.sh"
          }
        ]
      }
    ]
  }
}
```

## TypeScript SDK Examples

### Basic Query
```typescript
import { query } from "@anthropic-ai/claude-code";

async function analyzeCode() {
  for await (const message of query({
    prompt: "Analyze this codebase for performance issues",
    options: {
      allowedTools: ["Read", "Grep", "Bash(find:*)"],
      maxTurns: 5
    }
  })) {
    if (message.type === "result") {
      console.log("Analysis:", message.result);
    } else if (message.type === "tool_use") {
      console.log("Using tool:", message.tool_name);
    }
  }
}
```

### Custom MCP Server
```typescript
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-code";
import { z } from "zod";

const analyticsServer = createSdkMcpServer({
  name: "analytics-tools",
  version: "1.0.0",
  tools: [
    tool(
      "calculate_metrics",
      "Calculate performance metrics from log data",
      {
        logFile: z.string().describe("Path to log file"),
        timeRange: z.string().optional().describe("Time range filter")
      },
      async ({ logFile, timeRange }) => {
        // Implementation here
        const metrics = await processLogFile(logFile, timeRange);

        return {
          content: [{
            type: "text",
            text: JSON.stringify(metrics, null, 2)
          }]
        };
      }
    ),

    tool(
      "generate_report",
      "Generate analysis report",
      {
        data: z.object({}).passthrough(),
        format: z.enum(["json", "markdown", "html"])
      },
      async ({ data, format }) => {
        const report = await generateReport(data, format);

        return {
          content: [{
            type: "text",
            text: report
          }]
        };
      }
    )
  ]
});

// Use in query
for await (const message of query({
  prompt: "Analyze server performance from logs",
  options: {
    mcpServers: {
      "analytics": analyticsServer
    }
  }
})) {
  // Handle messages
}
```

### Permission Control
```typescript
import { query } from "@anthropic-ai/claude-code";

async function secureQuery() {
  for await (const message of query({
    prompt: "Review user authentication code",
    options: {
      allowedTools: ["Read", "Grep"],
      canUseTool: async (toolName, input) => {
        // Custom permission logic
        if (toolName === "Read") {
          const filePath = input.file_path;

          // Allow reading source files but not config files
          if (filePath.includes("config") || filePath.includes(".env")) {
            return {
              behavior: "deny",
              message: "Cannot read configuration files"
            };
          }
        }

        return { behavior: "allow", updatedInput: input };
      }
    }
  })) {
    // Process messages
  }
}
```

## Hook Scripts

### Pre-Tool Use Validation (`scripts/validate-tool-use.py`)
```python
#!/usr/bin/env python3
import json
import sys
import os

def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(1)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})

    # Auto-approve safe operations
    if tool_name in ["Read", "Grep", "Glob"]:
        output = {
            "decision": "approve",
            "suppressOutput": True
        }
        print(json.dumps(output))
        sys.exit(0)

    # Require confirmation for file modifications
    if tool_name in ["Write", "Edit"]:
        file_path = tool_input.get("file_path", "")

        # Block modifications to critical files
        critical_files = [".env", "package.json", "tsconfig.json"]
        if any(critical in file_path for critical in critical_files):
            output = {
                "decision": "block",
                "reason": f"Modifications to {file_path} require manual approval"
            }
            print(json.dumps(output))
            sys.exit(0)

    # Default: allow with logging
    with open(os.path.expanduser("~/.claude/tool-audit.log"), "a") as f:
        f.write(f"Tool: {tool_name}, Input: {json.dumps(tool_input)}\n")

    sys.exit(0)

if __name__ == "__main__":
    main()
```

### Status Line Script (`~/.claude/statusline.sh`)
```bash
#!/bin/bash

# Git status
if git rev-parse --git-dir > /dev/null 2>&1; then
    branch=$(git branch --show-current 2>/dev/null || echo "detached")

    # Check for uncommitted changes
    if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
        git_status="🔴 $branch"
    else
        git_status="🟢 $branch"
    fi
else
    git_status="📁"
fi

# Node.js version if available
if command -v node > /dev/null; then
    node_version="⚡ $(node --version)"
else
    node_version=""
fi

# Current time
current_time=$(date '+%H:%M')

# Combine status elements
echo "$git_status $node_version 🕒 $current_time"
```

## Environment Setup

### Environment Variables (`.env`)
```bash
# API Configuration
ANTHROPIC_API_KEY=your_api_key_here
CLAUDE_CODE_MODEL=claude-3-5-sonnet-20241022

# MCP Server Configuration
GITHUB_TOKEN=your_github_token
DATABASE_URL=postgresql://user:pass@localhost:5432/db
API_BASE_URL=https://api.example.com

# Development Tools
NODE_ENV=development
DEBUG=claude:*
```

### Shell Aliases (`.bashrc` or `.zshrc`)
```bash
# Claude Code shortcuts
alias cc="claude"
alias ccp="claude --permission-mode plan"
alias ccr="claude -r"
alias ccc="claude -c"
alias cccommit="claude commit"

# Common workflows
alias ccreview="claude '/security-review'"
alias ccopt="claude '/optimize'"
alias cctest="claude 'run tests and fix any failures'"
alias ccdocs="claude 'generate documentation for recent changes'"
```

## Project Templates

### Basic Project Setup (`.claude/commands/setup-project.md`)
```markdown
---
allowed-tools: Write, Bash(mkdir:*), Bash(npm:*)
description: Set up new project with Claude Code integration
---
Set up a new project with Claude Code integration:

1. Create `.claude/` directory structure
2. Initialize basic settings.json with sensible defaults
3. Create common custom commands (test, lint, deploy)
4. Set up git hooks if requested
5. Initialize package.json if Node.js project
6. Create basic README with Claude Code usage instructions

Project type: $1 (web, api, library, etc.)
Additional requirements: $ARGUMENTS
```

### Testing Integration (`.claude/commands/test-and-fix.md`)
```markdown
---
allowed-tools: Bash(npm test:*), Bash(npm run:*), Read, Edit
description: Run tests and fix failures
---
Run tests and fix any failures:

1. Execute test suite: !`npm test`
2. If tests fail, analyze error output
3. Identify root causes of failures
4. Fix failing tests or underlying code
5. Re-run tests to verify fixes
6. Report summary of changes made

Test scope: $ARGUMENTS
```

This collection of snippets provides ready-to-use examples for common Claude Code workflows and configurations.