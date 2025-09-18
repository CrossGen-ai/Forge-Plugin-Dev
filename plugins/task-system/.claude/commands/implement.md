Take the user's input for implementation.

User_input = $ARGUMENTS

## Setup Phase
1. **Generate Session UUID**: Create a unique 8-character UUID for this implementation session
2. **Extract Plugin Name**: Determine plugin name from current directory path or user context

## Feature Folder Structure
All implementation documents will be stored in feature-specific folders within docs/:
- Feature folder format: `docs/{feature-name}/`
- The user should create the feature folder and place the PRD there first
- All generated documents will be stored in the same feature folder

## Naming Convention
All documents will follow: `{feature-name}.{document-type}.{uuid}.md`

## Implementation Process

1. **Feature Folder Setup**: Confirm the user has created a feature folder in docs/ and placed the PRD there. Extract the feature name from the folder structure.

2. **Comprehensive Planning**: Develop a thorough plan by ultra-thinking and writing down the plan to accomplish this tasklist. You will use special agents to help.

3. **Codebase Research**: Call @codebase-research-analyst to research the codebase for what is actually in place that relates to the user request. That agent will write down a markdown file with the research findings in the feature folder as:
   - `docs/{feature-name}/{feature-name}.research.{uuid}.md`

4. **Implementation Planning**: Pass the research findings as well as other task descriptions to @obsidian-plugin-planner. That agent will develop a high-level plan as well as a task list and pseudo code. It will save the plan as:
   - `docs/{feature-name}/{feature-name}.implementation-plan.{uuid}.md`

5. **Implementation**: Implement the plan from the results of the agents and their respective markdown files.

6. **Recommendations**: If you have ideas for improvement that are outside of the specific task asked by the user, write them as:
   - `docs/{feature-name}/{feature-name}.recommendations.{uuid}.md`

7. **Validation**: Once all items are done and accomplished based on your assessment, go back and reassess using @obsidian-plugin-validator. Have it assess the plan that you just completed. Be sure to give it the file name so it can read it. This agent should report back any findings and proactively uncheck any items that were not fully implemented.

8. **Remediation**: After using the validator agent, reassess the todo plan list markdown file. For any items that were unchecked, implement them. Make sure you fully read the task that was unchecked to gain a full understanding.

9. **Validation Loop**: If you had items that you just had to fix, use the Validator agent again and continue in the loop (steps 7-9) until all items are finished completion.

10. **Final Summary**: Write a summary report that is concise and clear in the feature folder as:
    - `docs/{feature-name}/{feature-name}.implementation-summary.{uuid}.md`

    Include text-based flow charts to explain workflows. Call out specific files that were changed with brief descriptions of what was changed.

## Tracking Requirements
- Update the todo list in the documents folder as items are accomplished
- Do not wait until the end to update the todo list - do it as each task is accomplished
- Use the same UUID throughout the entire session for all generated documents
- Ensure all documents follow the consistent naming convention

## File Naming Examples
For feature "schema-enforcement" with UUID "a1b2c3d4":
- `docs/schema-enforcement/schema-enforcement.research.a1b2c3d4.md`
- `docs/schema-enforcement/schema-enforcement.implementation-plan.a1b2c3d4.md`
- `docs/schema-enforcement/schema-enforcement.recommendations.a1b2c3d4.md`
- `docs/schema-enforcement/schema-enforcement.implementation-summary.a1b2c3d4.md`

## Workflow Instructions for Agents
Agents should:
1. Extract feature name from the PRD location (e.g., if PRD is in `docs/schema-enforcement/`, feature name is "schema-enforcement")
2. Store ALL generated documents in the same feature folder
3. Use the consistent naming pattern with the shared UUID