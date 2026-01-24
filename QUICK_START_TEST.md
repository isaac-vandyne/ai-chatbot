# Quick Start Testing Guide

> **Quick reference for testing North integration**. See `TESTING_GUIDE.md` for comprehensive details.

## Setup (5 minutes)

```bash
cd /Users/i/Documents/GitHub/ai-chatbot

# 1. Ensure environment variables are set
cat .env.local  # Should have Supabase + AI Gateway credentials

# 2. Run database migrations
pnpm db:migrate

# 3. Start dev server
pnpm dev
```

Open `http://localhost:3000` and sign in.

## Core Features Test (10 minutes)

### Test 1: Create a Goal
```
User: "Create a goal to learn React"
```
**Expected**: AI creates goal, returns confirmation with goal ID

### Test 2: Create Linked Tasks
```
User: "Create 3 tasks for this goal: 1) Read React docs, 2) Build a todo app, 3) Deploy to Vercel"
```
**Expected**: AI creates 3 tasks linked to the React goal

### Test 3: Daily Planning
```
User: "Set my focus task for today to 'Read React docs'"
```
**Expected**: AI creates daily plan with compass task

### Test 4: Create a Note
```
User: "Create a note in /learning/react/ with key concepts I should focus on"
```
**Expected**: AI creates note with structured content

### Test 5: Multi-Tool Workflow
```
User: "What's my plan for today and what should I work on first?"
```
**Expected**: AI uses multiple tools (daily_plan.get, task.list, goal.list) to provide comprehensive answer

## Verify in Database

```bash
# Open Supabase Studio
open "https://supabase.com/dashboard/project/YOUR_PROJECT/editor"

# Or query directly:
psql $DATABASE_URL
```

```sql
-- Check goals
SELECT * FROM goals WHERE user_id = 'YOUR_USER_ID';

-- Check tasks
SELECT * FROM tasks WHERE user_id = 'YOUR_USER_ID';

-- Check daily plans
SELECT * FROM daily_plans WHERE user_id = 'YOUR_USER_ID';

-- Check notes
SELECT * FROM nodes WHERE user_id = 'YOUR_USER_ID';
```

## Quick Diagnostics

### Check Tool Execution
Open browser DevTools → Network tab → Filter by "chat"
- Look for POST to `/api/chat`
- Should see tool calls in the streaming response
- No 401/403 errors

### Check Console
Press F12 → Console tab
- No red error messages
- Should see tool execution logs (if verbose mode enabled)

### Check Database
Run migrations worked if these tables exist:
- ✅ `goals`
- ✅ `tasks`
- ✅ `nodes`
- ✅ `daily_plans`
- ✅ `user_profiles`

## Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check Supabase keys in `.env.local` |
| Tools not called | Verify model isn't a reasoning model |
| Database errors | Run `pnpm db:migrate` |
| TypeScript errors | Run `pnpm tsc --noEmit` |

## Tools Available (23 total)

### Original (4)
- getWeather
- createDocument, updateDocument
- requestSuggestions

### North (19)
- **Goals**: goal_upsert, goal_list, goal_get, goal_archive
- **Tasks**: task_upsert, task_list, task_get, task_complete, task_archive
- **Nodes**: node_create, node_search, node_get, node_update, node_list
- **Plans**: daily_plan_upsert, daily_plan_get, daily_plan_list_recent
- **Profile**: user_profile_update, user_profile_get

## Success Criteria ✅

Integration works if:
- All 5 test queries execute successfully
- Database tables are populated
- No TypeScript errors
- No runtime errors in console
- Tools stream results back to chat

## Full Testing

See `TESTING_GUIDE.md` for:
- 12 detailed test scenarios
- Error handling tests
- Performance tests
- Multi-tool workflow tests

## Next Steps

1. ✅ Complete quick tests above
2. ✅ Verify database entries
3. ✅ Run full test suite from `TESTING_GUIDE.md`
4. ✅ Test with real user scenarios
5. ✅ Deploy to staging/production

---

**Need help?** Check:
- `TESTING_GUIDE.md` - Comprehensive testing
- `COMPLETION_SUMMARY.md` - What was built
- `.cursor/plans/north_to_ai-chatbot_migration_*.plan.md` - Migration details
