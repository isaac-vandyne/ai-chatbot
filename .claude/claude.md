# North - LLM Planning Assistant

**Stack:** Next.js 15 (App Router) + Supabase + Vercel AI SDK

## What it does
Personal planning app where Claude autonomously manages goals, tasks, and notes via tool calls. Agent executes database operations silently while streaming explanations.

## Core Architecture

### Agent System (Vercel AI SDK)
- `ToolLoopAgent` class encapsulates model + tools + behavior
- **Multi-agent routing:** Opus (onboarding), Sonnet (planning), Haiku (quick queries)
- Tools defined with Zod schemas, auto-validated
- Agent executes in server route: `createAgentUIStreamResponse({ agent, messages })`

### Database (Supabase)
```
goals       - hierarchical goal tree (parent_id FK)
tasks       - actionable items, link to goals, support recurrence
nodes       - notes/documents with full-text search
daily_plans - single focus task + task list per day
user_profiles - user context loaded upfront
chats/messages - conversation history
```

### Security (RLS)
- All tables user-scoped via Row Level Security
- **Critical pattern:** `(SELECT auth.uid()) = user_id` caches auth check (10-100x faster)
- Use `createClient()` for user context, `createAdminClient()` to bypass RLS
- Always use `getUser()` not `getSession()` to validate JWT

## Key Patterns

### Tools
```typescript
export function goalTools(supabase: SupabaseClient, userId: string) {
  return {
    'goal.upsert': tool({
      description: 'Create or update a goal',
      parameters: z.object({ title: z.string(), ... }),
      execute: async (input) => {
        const { data, error } = await supabase
          .from('goals')
          .upsert({ ...input, user_id: userId });
        return { success: !error, goal: data };
      }
    })
  };
}
```

### Context Loading
Eager-load stable data (profile, active goals, today's plan) in system prompt. Defer details to tool calls.

### Client Types
Use `InferAgentUIMessage` for type-safe React components:
```typescript
export type PlanningAgentMessage = InferAgentUIMessage<ReturnType<typeof createPlanningAgent>>;
```

## Important Files
- `lib/agents/*.ts` - Agent definitions
- `lib/tools/*.ts` - Database tools (goals, tasks, nodes)
- `lib/context.ts` - Context loading + system prompt builder
- `lib/supabase/server.ts` - User-context client
- `lib/supabase/admin.ts` - Service role client (bypasses RLS)
- `app/api/chat/route.ts` - Main agent endpoint
- `supabase/migrations/*.sql` - Schema + RLS policies

## Gotchas
- JSONB fields (`body`, `meta`, `cadence`) for flexible schema evolution
- Soft deletes via `archived_at` timestamp
- Partial indexes on active records: `WHERE archived_at IS NULL`
- Full-text search uses generated `tsvector` column on nodes
- `@supabase/ssr` for user client, `@supabase/supabase-js` for admin (SSR would override service key)
