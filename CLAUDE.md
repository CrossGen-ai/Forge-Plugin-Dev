
# Description: 
Canonical metadata for the Forge-Plugin-Dev workspace. All projects in this vault are Obsidian plugins; plugin implementations live in the plugins folder and shared code lives in the packages folder.



## Folders

### Plugin Folders
Forge-Plugin-Dev/
  packages/
    core-lib/              # shared TS utils: vault I/O, schema, queue client, logging
    ui-kit/                   # shared UI helpers (modals, settings builders)
  plugins/
    ai-commands/           # "property change" “push a button" causes do AI stuff” commands + endpoint settings
    task-intake/           # capture inbox, dedupe flagger, due-date parser
    note-intake/          # capture notes, youtube, pdf, 
    external-intake/        # email fe
    contact-crm/           # contact note templates, relations, interaction logs
    queue-bridge/          # file/IPC queue to Claude Code/Python, status viewer
    schema-guard/          # validates frontmatter/types; fix-it actions
    ops-tools/              # housekeeping: link rewriter, attachment mover, audits
build-support/       # support code for building plugins in this repo (not part of the plugins)

### Obsidian Folders
Forge-Plugin-Dev/
	.obsidian/            # obsidian folder for viewing system to view md files of this actual 
	 copilot-custom-prompts/       # prompts for copilot plug in not core to this repo!

### Plugin Subfolders
Each plugin maintains the following minimum structure
*plugin*/
	docs/
		plugin.PRD.md
		plugin.ideas.md
		plugin.lesson-learned.md
		other....
	plugin-agents/          # (claude code agents for plugin symlink to .claude/agents folder)
		plugin.agent-name.md     # various claude code agents for this plugin 
	plugin-commands/          # (claude code slash commands for plugin these symlink to .claude/agents folder)
		plugin.context-prime.md     # context prime for claude code using this plugin 
		plugin.update.md                # command to use to make updates to this project
	tests/       # all project test files
	src/        # unique source files for plugin
		main.ts
		other-files....

---
## Project Architecture & Naming Conventions

This section defines the **standards** for how code is organized, named, and structured in this project.  
Claude and other agents should **follow these rules when creating or editing code**.

### 1. General Naming Principles
- Use **descriptive, unambiguous names**. Avoid cryptic abbreviations.  
- **camelCase** → variables, functions, object keys.  
- **PascalCase** → classes, interfaces, types, enums, React components.  
- **CONSTANT_CASE** → global constants only.  
- Treat **acronyms as words**: `httpClient`, `customerId`, `parseUrl`.  
- Booleans should start with `is`, `has`, `can`, or `should`.

### 2. File & Folder Structure
- Organize code **by feature**, not only by layer.  e.g., `tasks/`, `contacts/`)
- Each file name uses the `feature.type.ts` pattern.

---