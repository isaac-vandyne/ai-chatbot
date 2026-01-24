# Tool Naming Fix - AI Gateway Compatibility

## Issue
AI Gateway validation error when using tool names with dots (`.`):

```
Error: Value 'goal.upsert' at 'toolConfig.tools.5.member.toolSpec.name' 
failed to satisfy constraint: Member must satisfy regular expression 
pattern: [a-zA-Z0-9_-]+
```

## Root Cause
AI Gateway (and AWS Bedrock) requires tool names to match the pattern `[a-zA-Z0-9_-]+`, which means:
- ✅ Letters (a-z, A-Z)
- ✅ Numbers (0-9)
- ✅ Underscores (_)
- ✅ Hyphens (-)
- ❌ Dots (.)
- ❌ Other special characters

## Solution
Renamed all North tools to use underscores instead of dots:

### Before (Invalid)
```typescript
{
  'goal.upsert': tool({ ... }),
  'goal.list': tool({ ... }),
  'task.complete': tool({ ... }),
  // etc.
}
```

### After (Valid)
```typescript
{
  goal_upsert: tool({ ... }),
  goal_list: tool({ ... }),
  task_complete: tool({ ... }),
  // etc.
}
```

## Changed Tool Names

### Goal Tools
- `goal.upsert` → `goal_upsert`
- `goal.list` → `goal_list`
- `goal.get` → `goal_get`
- `goal.archive` → `goal_archive`

### Task Tools
- `task.upsert` → `task_upsert`
- `task.list` → `task_list`
- `task.get` → `task_get`
- `task.complete` → `task_complete`
- `task.archive` → `task_archive`

### Node Tools
- `node.create` → `node_create`
- `node.search` → `node_search`
- `node.get` → `node_get`
- `node.update` → `node_update`
- `node.list` → `node_list`

### Daily Plan Tools
- `daily_plan.upsert` → `daily_plan_upsert`
- `daily_plan.get` → `daily_plan_get`
- `daily_plan.list_recent` → `daily_plan_list_recent`

### User Profile Tools
- `user_profile.update` → `user_profile_update`
- `user_profile.get` → `user_profile_get`

## Files Modified
- `lib/tools/goal-tools.ts`
- `lib/tools/task-tools.ts`
- `lib/tools/node-tools.ts`
- `lib/tools/daily-plan-tools.ts`
- `lib/tools/user-profile-tools.ts`
- `STATUS.md` (documentation)
- `QUICK_START_TEST.md` (documentation)
- `COMPLETION_SUMMARY.md` (documentation)

## Verification
After the fix, the tools should register successfully with AI Gateway and the chat API should work without validation errors.

Test with:
```bash
pnpm dev
# Navigate to http://localhost:3000
# Send a message like "Create a goal to learn React"
# Should see tool execution without errors
```

## References
- AI SDK Documentation: https://ai-sdk.dev/docs/reference/ai-sdk-core/tool
- Tool naming constraints are enforced by AWS Bedrock/AI Gateway
- Similar patterns used by other AI providers (Anthropic, OpenAI accept dots, but gateway normalizes to AWS constraints)
