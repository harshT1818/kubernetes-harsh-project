# AI Change Request Template

Use this when asking Codex/another AI agent to make changes.

## Goal
Describe the desired outcome in one sentence.

## Relevant area
- frontend / backend / database / ingress / autoscaling / troubleshooting

## Constraints
- Keep current architecture unless necessary.
- Use plain Kubernetes manifests.
- Do not introduce Helm unless explicitly requested.
- Do not expose backend/database publicly.
- Do not hardcode secrets.
- Preserve existing names/labels unless change is required.

## Acceptance criteria
Example:

- Manifest is valid YAML.
- Existing Services continue working.
- Pods reach Ready state.
- Change is explainable in the assignment demo.
- Verification commands are provided.

## Verification
The agent should provide exact commands to prove the change works.

## Expected response from agent
1. Files changed
2. Why each change is needed
3. Patch/code
4. Verification commands
5. Risks/rollback
