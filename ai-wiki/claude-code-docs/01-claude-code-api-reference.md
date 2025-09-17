# Claude Code API Reference

Comprehensive reference for Claude Code CLI, SDK, and configuration options based on official Anthropic documentation.

## CLI Commands

### Basic Usage
- `claude` - Start interactive session
- `claude "task description"` - Execute one-time task
- `claude -p "prompt"` - Continue previous conversation
- `claude -c` - Continue most recent conversation
- `claude -r` - Reset conversation context
- `claude commit` - Perform git commit with AI assistance

### CLI Options
- `--allowedTools` - Specify tools Claude can use without permission
- `--disallowedTools` - Specify tools Claude cannot use
- `--permission-mode` - Set permission mode (plan, interactive, etc.)
- `--permission-prompt-tool` - MCP tool for permission prompts
- `--global` - Apply settings globally vs project-specific

### Interactive Commands
- `/clear` - Clear current conversation
- `/help` - Show help information
- `/agents` - Manage subagents
- `exit` - Exit Claude Code session

## Slash Commands

### Command Structure
```
/<command-name> [arguments]
```

### Built-in Commands
- `/clear` - Clear conversation history
- `/help` - Display help information
- `/agents` - Interactive subagent management

### MCP Commands
```
/mcp__<server-name>__<prompt-name> [arguments]
```

### Custom Commands
Commands are defined as Markdown files:
- Personal: `~/.claude/commands/command-name.md`
- Project: `.claude/commands/command-name.md`

### Command Frontmatter
```yaml
---
allowed-tools: Bash(git add:*), Bash(git status:*)
argument-hint: [message]
description: Create a git commit
model: claude-3-5-haiku-20241022
---
```

### Command Arguments
- `$ARGUMENTS` - All arguments as single string
- `$1, $2, $3...` - Individual positional arguments
- `!command` - Execute bash command and include output

### File References
- `@filename` - Include file content in command context
- `@server:protocol://resource/path` - Reference MCP resources

## Tools

### Core Tools
- **Read** - Read file contents
- **Write** - Write/create files
- **Edit** - Edit existing files
- **Bash** - Execute shell commands
- **Grep** - Search through files
- **Glob** - File pattern matching

### Tool Permissions
```json
{
  "allowedTools": ["Bash(git diff:*)", "Read"],
  "disallowedTools": ["Write"]
}
```

## Configuration

### Settings File Location
- Global: `~/.claude/settings.json`
- Project: `.claude/settings.json`

### Configuration Management
```bash
claude config list                    # List all settings
claude config get <key>              # Get specific setting
claude config set <key> <value>      # Set configuration value
claude config add <key> <value>      # Add to list setting
claude config remove <key> <value>   # Remove from list setting
```

### Status Line Configuration
```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "padding": 0
  }
}
```

## MCP (Model Context Protocol)

### Adding MCP Servers
```bash
# HTTP server
claude mcp add --transport http <name> <url>

# Stdio server
claude mcp add <name> <command> [args...]

# With environment variables
claude mcp add airtable --env AIRTABLE_API_KEY=YOUR_KEY \
  -- npx -y airtable-mcp-server
```

### MCP Configuration File
```json
{
  "mcpServers": {
    "api-server": {
      "type": "sse",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

### Popular MCP Servers
- `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp`
- `claude mcp add --transport http socket https://mcp.socket.dev/`
- `claude mcp add --transport http hugging-face https://huggingface.co/mcp`
- `claude mcp add --transport http notion https://mcp.notion.com/mcp`

## Hooks

### Hook Types
- **PreToolUse** - Execute before tool usage
- **PostToolUse** - Execute after tool usage
- **User Prompt Submit** - Execute on user input

### Hook Configuration
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Running command...'"
          }
        ]
      }
    ]
  }
}
```

### Hook Output Format
```json
{
  "decision": "approve|block",
  "reason": "Explanation for decision",
  "suppressOutput": true,
  "hookSpecificOutput": {
    "additionalContext": "Context for Claude"
  }
}
```

## TypeScript SDK

### Basic Query
```typescript
import { query } from "@anthropic-ai/claude-code";

for await (const message of query({
  prompt: "Analyze this code",
  options: {
    maxTurns: 3,
    allowedTools: ["Read", "Grep"]
  }
})) {
  if (message.type === "result") {
    console.log(message.result);
  }
}
```

### Custom Tools
```typescript
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-code";
import { z } from "zod";

const customServer = createSdkMcpServer({
  name: "my-tools",
  version: "1.0.0",
  tools: [
    tool(
      "calculate_interest",
      "Calculate compound interest",
      {
        principal: z.number(),
        rate: z.number(),
        time: z.number()
      },
      async (args) => {
        const amount = args.principal * Math.pow(1 + args.rate, args.time);
        return {
          content: [{
            type: "text",
            text: `Result: $${amount.toFixed(2)}`
          }]
        };
      }
    )
  ]
});
```

### Permission Control
```typescript
for await (const message of query({
  prompt: "Analyze user data",
  options: {
    canUseTool: async (toolName, input) => {
      if (toolName.startsWith("mcp__analytics__")) {
        const hasPermission = await checkUserPermissions(toolName);
        return hasPermission
          ? { behavior: "allow", updatedInput: input }
          : { behavior: "deny", message: "Insufficient permissions" };
      }
      return { behavior: "allow", updatedInput: input };
    }
  }
})) {
  // Handle messages
}
```

## Environment Variables

### API Configuration
- `ANTHROPIC_API_KEY` - Anthropic API key
- `ANTHROPIC_BASE_URL` - Custom API base URL
- `CLAUDE_CODE_API_KEY` - Claude Code specific API key

### MCP Variables
- `${VAR}` - Environment variable expansion
- `${VAR:-default}` - Environment variable with default

## Cloud Integrations

### AWS Bedrock
Configure via AWS credentials and region settings.

### Google Vertex AI
```bash
gcloud config set project YOUR-PROJECT-ID
gcloud services enable aiplatform.googleapis.com
```

### LLM Gateway
```json
{
  "apiKeyHelper": "~/bin/get-litellm-key.sh"
}
```

## Subagents

### Agent Management
- Use `/agents` command for interactive management
- Agents stored in `.claude/agents/` directory
- Each agent has specific tool permissions and system prompts

### Agent Configuration
Agents are defined as markdown files with frontmatter specifying:
- Allowed tools
- System prompts
- Model preferences
- Description and usage instructions

## Git Integration

### Automatic Git Operations
Claude Code includes built-in git awareness:
- Automatic commit message generation
- Status checking before operations
- Branch management
- Diff analysis for context

### Git Commands
- `claude commit` - AI-assisted commit creation
- Built-in awareness of git status, diff, and log operations
- Automatic staging of relevant files

## Error Handling

### Common Issues
- Permission denied errors - Check `allowedTools` configuration
- MCP server connection issues - Verify server URLs and credentials
- Tool execution failures - Review hook configurations

### Debugging
- Check transcript files in `.claude/projects/`
- Review hook outputs and logs
- Verify MCP server status and connectivity