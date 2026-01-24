# North Integration Testing Guide

## Overview

This guide provides detailed instructions for testing the North agent system integration into the ai-chatbot application. The integration includes:

- ✅ 19 North tools (goals, tasks, nodes, daily plans, user profiles)
- ✅ 3 specialized agents (onboarding, planning, quick)
- ✅ TypeScript-safe tool definitions with explicit types
- ✅ Supabase Auth + AI Gateway integration

## Prerequisites

### 1. Environment Setup

Ensure your `.env.local` file has:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Gateway (Cloudflare)
AI_GATEWAY_URL=your_gateway_url
AI_GATEWAY_TOKEN=your_gateway_token

# Optional: Redis for stream resumption
REDIS_URL=your_redis_url
```

### 2. Database Setup

Run migrations to create all necessary tables:

```bash
cd /Users/i/Documents/GitHub/ai-chatbot
pnpm db:migrate
```

This creates:
- Original ai-chatbot tables: `Chat`, `Message_v2`, `Document`, `Suggestion`, `Vote`
- North tables: `goals`, `tasks`, `nodes`, `daily_plans`, `user_profiles`

### 3. Start Development Server

```bash
pnpm dev
```

The app should start on `http://localhost:3000`

## Test Scenarios

### Test 1: User Authentication

**Goal**: Verify Supabase authentication works

**Steps**:
1. Navigate to `http://localhost:3000`
2. Click "Sign in" or you should be redirected to the auth page
3. Sign up with email/password or use a provider
4. Verify you're redirected to the chat interface

**Expected Result**:
- ✅ User is successfully authenticated
- ✅ User profile is created in the database
- ✅ Chat interface loads without errors

### Test 2: Basic Chat Functionality

**Goal**: Verify the original ai-chatbot tools still work

**Test Cases**:

#### 2.1 Weather Tool
```
User: "What's the weather in San Francisco?"
```
**Expected**: AI uses `getWeather` tool and returns weather information

#### 2.2 Document Creation
```
User: "Create a document with a Python hello world program"
```
**Expected**: AI uses `createDocument` tool and displays artifact

#### 2.3 Document Update
```
User: "Update the document to print 'Hello North!'"
```
**Expected**: AI uses `updateDocument` tool and shows diff

### Test 3: North Tool Integration - Goals

**Goal**: Verify goal management tools work correctly

#### 3.1 Create a Goal
```
User: "Create a goal to learn TypeScript"
```

**Expected**:
- ✅ AI uses `goal.upsert` tool
- ✅ Returns success message with goal details
- ✅ Goal is saved in database

**Verify in Database**:
```sql
SELECT * FROM goals WHERE user_id = 'your_user_id';
```

#### 3.2 List Goals
```
User: "Show me my goals"
```

**Expected**:
- ✅ AI uses `goal.list` tool
- ✅ Displays all active goals
- ✅ Shows goal titles, status, target dates

#### 3.3 Update a Goal
```
User: "Update my TypeScript goal to add a target date of next month"
```

**Expected**:
- ✅ AI uses `goal.upsert` tool with existing goal ID
- ✅ Updates target_date field
- ✅ Confirms update

#### 3.4 Archive a Goal
```
User: "Archive the TypeScript goal"
```

**Expected**:
- ✅ AI uses `goal.archive` tool
- ✅ Sets archived_at timestamp
- ✅ Goal no longer appears in active goals list

### Test 4: North Tool Integration - Tasks

**Goal**: Verify task management tools work correctly

#### 4.1 Create a Task
```
User: "Create a task to read the TypeScript documentation, due tomorrow"
```

**Expected**:
- ✅ AI uses `task.upsert` tool
- ✅ Sets due_at to tomorrow's date
- ✅ Defaults status to 'pending'

#### 4.2 Create a Recurring Task
```
User: "Create a daily task to review my goals"
```

**Expected**:
- ✅ AI uses `task.upsert` tool with cadence.type = 'daily'
- ✅ Task is created with recurring schedule

#### 4.3 Link Task to Goal
```
User: "Create a task to complete TypeScript basics course, linked to my TypeScript goal"
```

**Expected**:
- ✅ AI uses `goal.list` to find TypeScript goal
- ✅ Uses `task.upsert` with goal_id parameter
- ✅ Task is properly linked

#### 4.4 Complete a Task
```
User: "Mark the documentation reading task as completed"
```

**Expected**:
- ✅ AI uses `task.complete` tool
- ✅ Sets status to 'completed'
- ✅ Records completed_at timestamp

#### 4.5 List Tasks
```
User: "Show me my pending tasks"
```

**Expected**:
- ✅ AI uses `task.list` with status filter
- ✅ Returns only pending tasks

### Test 5: North Tool Integration - Daily Plans

**Goal**: Verify daily planning tools work correctly

#### 5.1 Create Daily Plan
```
User: "Set my compass task for today to the TypeScript course task"
```

**Expected**:
- ✅ AI uses `task.list` to find the task
- ✅ Uses `daily_plan.upsert` with compass_task_id
- ✅ Plan is saved for today's date

#### 5.2 View Daily Plan
```
User: "What's my plan for today?"
```

**Expected**:
- ✅ AI uses `daily_plan.get` for today's date
- ✅ Displays compass task and planned tasks
- ✅ Shows task details

#### 5.3 Update Daily Plan
```
User: "Add the documentation reading task to today's plan"
```

**Expected**:
- ✅ AI uses `daily_plan.get` to retrieve existing plan
- ✅ Uses `daily_plan.upsert` to update task_ids array
- ✅ Both tasks appear in plan

### Test 6: North Tool Integration - Nodes (Notes)

**Goal**: Verify note-taking tools work correctly

#### 6.1 Create a Note
```
User: "Create a note about TypeScript best practices in /learning/typescript/"
```

**Expected**:
- ✅ AI uses `node.create` tool
- ✅ Sets path to /learning/typescript/
- ✅ Saves content

#### 6.2 Search Notes
```
User: "Search my notes for TypeScript"
```

**Expected**:
- ✅ AI uses `node.search` tool
- ✅ Returns matching notes with path and content preview

#### 6.3 Update a Note
```
User: "Update my TypeScript best practices note to add information about never type"
```

**Expected**:
- ✅ AI uses `node.search` to find the note
- ✅ Uses `node.update` to modify content
- ✅ Updates updated_at timestamp

#### 6.4 List Notes by Path
```
User: "Show me all notes in /learning/"
```

**Expected**:
- ✅ AI uses `node.list` with path_prefix
- ✅ Returns all notes under /learning/

### Test 7: North Tool Integration - User Profile

**Goal**: Verify user profile management

#### 7.1 Update Profile
```
User: "Remember that I'm learning TypeScript to build web applications"
```

**Expected**:
- ✅ AI uses `user_profile.update` tool
- ✅ Stores context in content field
- ✅ Profile is retrievable for context

#### 7.2 Profile Context in Responses
```
User: "What should I focus on today?"
```

**Expected**:
- ✅ AI uses `user_profile.get` to load context
- ✅ References user's learning goals in response
- ✅ Provides personalized recommendations

### Test 8: Agent Selection Logic

**Goal**: Verify correct agent is selected based on context

#### 8.1 New User - Onboarding Agent
**Scenario**: First-time user with no goals or profile

```
User: "Hi, I'm new here"
```

**Expected**:
- ✅ System detects isNewUser = true
- ✅ Could use onboarding-focused prompts
- ✅ Helps user set up initial goals

#### 8.2 Simple Query - Quick Response
**Scenario**: User asks a simple question

```
User: "How many goals do I have?"
```

**Expected**:
- ✅ Query complexity = 'simple'
- ✅ Uses minimal tools (goal.list)
- ✅ Quick response without extensive tool loops

#### 8.3 Complex Query - Planning Agent
**Scenario**: User asks for planning help

```
User: "Help me plan my week around my TypeScript learning goal"
```

**Expected**:
- ✅ Query complexity = 'complex'
- ✅ Uses multiple tools (goal.list, task.list, daily_plan.upsert)
- ✅ Provides comprehensive planning support

### Test 9: Multi-Tool Workflows

**Goal**: Verify tools work together in complex scenarios

#### 9.1 Goal → Tasks → Daily Plan Workflow
```
User: "I want to learn React. Break it down into tasks and plan my week."
```

**Expected Sequence**:
1. ✅ `goal.upsert` - Creates "Learn React" goal
2. ✅ `task.upsert` (multiple) - Creates subtasks
3. ✅ `daily_plan.upsert` (multiple) - Plans tasks across week
4. ✅ Returns comprehensive plan

#### 9.2 Task → Note → Profile Workflow
```
User: "Complete the TypeScript basics task and create a summary note of what I learned"
```

**Expected Sequence**:
1. ✅ `task.complete` - Marks task done
2. ✅ `node.create` - Creates summary note
3. ✅ `user_profile.update` - Updates learning progress
4. ✅ Returns confirmation

### Test 10: Error Handling

**Goal**: Verify graceful error handling

#### 10.1 Invalid Tool Parameters
```
User: "Create a goal with an invalid UUID"
```

**Expected**:
- ✅ Zod validation catches error
- ✅ AI provides helpful error message
- ✅ Suggests correct format

#### 10.2 Database Errors
**Scenario**: Temporarily disconnect database

**Expected**:
- ✅ Supabase returns error
- ✅ Tool returns `{ success: false, error: message }`
- ✅ AI explains issue to user

#### 10.3 Missing Required Fields
```
User: "Create a task without a title"
```

**Expected**:
- ✅ AI asks for missing information
- ✅ Does not attempt invalid tool call

### Test 11: Tool Approval Flow

**Goal**: Verify tool approval UI works (if enabled)

**Steps**:
1. Configure tool approval in settings
2. Make a request that uses a tool
3. Verify approval UI appears
4. Approve or reject tool execution

**Expected**:
- ✅ Tool execution waits for approval
- ✅ User can review tool parameters
- ✅ Approved tools execute successfully
- ✅ Rejected tools don't execute

### Test 12: Performance & Limits

**Goal**: Verify system handles limits correctly

#### 12.1 Tool Loop Limit
```
User: "Create 100 tasks for every day of the next 100 days"
```

**Expected**:
- ✅ `stopWhen: stepCountIs(10)` limits iterations
- ✅ Creates some tasks but stops at limit
- ✅ Informs user of completion

#### 12.2 Rate Limiting
**Scenario**: Send many messages quickly

**Expected**:
- ✅ Rate limit check in route.ts
- ✅ Returns 429 error after limit
- ✅ Clear error message to user

## Database Verification Queries

Use these SQL queries to verify tool operations:

### Check Goals
```sql
SELECT id, title, status, target_date, created_at, archived_at 
FROM goals 
WHERE user_id = 'your_user_id' 
ORDER BY created_at DESC;
```

### Check Tasks
```sql
SELECT id, title, status, due_at, cadence, goal_id, completed_at
FROM tasks 
WHERE user_id = 'your_user_id' 
ORDER BY created_at DESC;
```

### Check Daily Plans
```sql
SELECT date, compass_task_id, task_ids, created_at
FROM daily_plans 
WHERE user_id = 'your_user_id' 
ORDER BY date DESC;
```

### Check Nodes
```sql
SELECT id, path, content, meta, created_at
FROM nodes 
WHERE user_id = 'your_user_id' 
ORDER BY created_at DESC;
```

### Check User Profile
```sql
SELECT user_id, content, body, updated_at
FROM user_profiles 
WHERE user_id = 'your_user_id';
```

## Browser DevTools Monitoring

### Network Tab
Monitor API calls to `/api/chat`:
- ✅ POST requests succeed (200)
- ✅ SSE streams remain open
- ✅ No 401/403 auth errors

### Console Tab
Watch for:
- ✅ No JavaScript errors
- ✅ Tool execution logs (if enabled)
- ✅ Streaming messages received

## Common Issues & Solutions

### Issue: Tools not being called
**Symptoms**: AI responds without using tools
**Solution**: 
- Check `experimental_activeTools` array includes tool names
- Verify tools are in the `tools` object
- Check if reasoning model is selected (they don't use tools)

### Issue: TypeScript errors in tools
**Symptoms**: Build fails or runtime errors
**Solution**:
- Verify `inputSchema` is used (not `parameters`)
- Check execute function has explicit type annotations
- Run `pnpm tsc --noEmit lib/tools/*.ts`

### Issue: Database errors
**Symptoms**: Tools return `success: false`
**Solution**:
- Verify Supabase connection in `.env.local`
- Check RLS policies allow authenticated users
- Run migrations: `pnpm db:migrate`

### Issue: Authentication failures
**Symptoms**: 401 errors, redirected to login
**Solution**:
- Check Supabase keys are correct
- Verify JWT is being sent in requests
- Check cookie settings in browser

## Success Criteria

The integration is successful when:

- ✅ All 19 North tools execute without errors
- ✅ Tools correctly interact with Supabase database
- ✅ Original ai-chatbot tools (weather, documents) still work
- ✅ Agent selection logic works correctly
- ✅ Multi-tool workflows complete successfully
- ✅ Error handling is graceful and informative
- ✅ TypeScript compilation has no errors
- ✅ UI updates reflect tool execution results

## Next Steps After Testing

1. **Monitor Logs**: Watch for any runtime errors in production
2. **User Feedback**: Collect feedback on tool usefulness
3. **Performance**: Monitor API response times and tool execution speed
4. **Iteration**: Add new tools based on user needs
5. **Documentation**: Update user-facing docs with North features

## Support

If you encounter issues:
1. Check this testing guide for solutions
2. Review the migration plan at `.cursor/plans/north_to_ai-chatbot_migration_*.plan.md`
3. Check architecture docs in `north-architecture.md`
4. Review tool implementations in `lib/tools/`
