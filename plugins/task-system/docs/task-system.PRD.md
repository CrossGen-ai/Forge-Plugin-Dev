### Product Requirements Document: Obsidian Atomic Task Frontmatter Enforcer Plugin

**1. Title**  
Atomic Task Schema Enforcer

**2. Purpose / Problem**  
Users need consistency in how “atomic tasks” are defined in their vault so that task views, queries, dashboards work reliably. Without schema enforcement, tasks may have missing or inconsistent metadata.

**3. Scope for v1**

- Only deals with markdown files that have `atomic-task: true` in their YAML frontmatter.
    
- Flat schema (no nested objects).
    
- Basic data types: string, date, boolean, list.
    
- Warnings only (no blocking of file save).
    
- User-configurable schema via plugin settings or `data.json`.
    
- Auto-populate certain fields (created_date) at creation time or upon detection if missing.
    

**4. Schema**  
Required frontmatter keys and their types/defaults:

|Key|Type|Required|Default (if missing)|Allowed values / notes|
|---|---|---|---|---|
|atomic-task|boolean|**Yes**|_none_ (user must explicitly set; or default to false)|`true` or `false`|
|title|string|**Yes**|file name (without extension)|non-empty|
|created_date|date|**Yes**|current date (on first save or when plugin detects note becomes atomic)|e.g. ISO YYYY-MM-DD|
|status|enum (string)|**Yes**|`todo`|values: `todo`, `in_progress`, `blocked`, `done`|
|priority|enum (string or number)|No|`medium`|values: `low`, `medium`, `high`|
|due_date|date|No|_none_|must be valid date format|
|tags|list of strings|No|empty list|each tag prefixed by `#` or plain string (decide)|
|dependencies|list of links or strings|No|empty list|optional; may be auto-filled later|
|completed_date|date|No|none|only makes sense if status = `done`|
