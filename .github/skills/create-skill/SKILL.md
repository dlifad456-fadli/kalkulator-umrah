---
name: create-skill
user-invocable: true
description: "Guide the user through creating a new VS Code agent customization SKILL.md, including scope, file location, frontmatter, workflow steps, and validation checks."
---

# Create Skill

## When to use

Use this skill when you want to author a new `SKILL.md` file for VS Code agent customization and need a structured workflow to:

- choose the correct scope and location
- define the required metadata
- draft the body content and examples
- validate the final file

## Workflow

1. Clarify the outcome
   - What should the skill produce?
   - Is it workspace-scoped or personal user-scoped?
   - Should it be a full multi-step workflow or a lightweight prompt-style helper?
2. Choose the right location
   - Workspace skill: `.github/skills/<name>/SKILL.md`
   - User skill: `{{VSCODE_USER_PROMPTS_FOLDER}}/<name>/SKILL.md`
3. Define the frontmatter
   - `name`: skill identifier, usually matches folder name
   - `user-invocable`: `true` for slash-command availability
   - `description`: concise discovery text that includes trigger keywords
4. Draft the content
   - Describe the goal and expected result
   - List the step-by-step process
   - Include decision points and quality checks
   - Add examples and related customization ideas
5. Validate the file
   - Confirm `SKILL.md` exists in the intended path
   - Verify YAML frontmatter is syntactically correct
   - Ensure `description` is clear and discoverable

## Clarifying questions

- What is the specific role of this new `SKILL.md`?
- Should it create a reusable workflow for authoring skills, instructions, prompts, or agents?
- Do you want it to target the current workspace or your user-level prompt folder?

## Quality checklist

- [ ] Skill name matches the folder path
- [ ] `user-invocable: true` if the skill should appear as a slash command
- [ ] Description contains trigger-worthy keywords such as `create`, `SKILL.md`, `agent customization`
- [ ] Workflow is explicit and actionable
- [ ] Validation steps are included

## Example prompts to try

- `Create a SKILL.md for generating new project-level customization files`
- `Help me write a workspace-scoped skill for authoring agent customization workflows`
- `Review this SKILL.md and make sure it has the right frontmatter and discovery description`

## Related customizations

- `.github/prompts/create-skill.prompt.md` for a simpler prompt-based authoring helper
- `.github/agents/create-skill.agent.md` for a custom agent that isolates this workflow
- `copilot-instructions.md` for global guidance on skill creation
