import { SupabaseClient } from '@supabase/supabase-js';

export interface UserContext {
  profile: { user_id: string; content: string | null; body: Record<string, unknown> };
  activeGoals: Array<{ id: string; title: string; status: string; target_date: string | null }>;
  todaysPlan: { compass_task_id: string | null; task_ids: string[] } | null;
  recentTasks: Array<{ id: string; title: string; status: string }>;
}

export async function loadUserContext(
  userId: string,
  supabase: SupabaseClient
): Promise<UserContext> {
  const today = new Date().toISOString().split('T')[0];

  // Parallel fetch for independent data
  const [profileResult, goalsResult, planResult, tasksResult] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    supabase
      .from('goals')
      .select('id, title, status, target_date')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('daily_plans')
      .select('compass_task_id, task_ids')
      .eq('user_id', userId)
      .eq('date', today)
      .single(),
    supabase
      .from('tasks')
      .select('id, title, status')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return {
    profile: profileResult.data ?? { user_id: userId, content: null, body: {} },
    activeGoals: goalsResult.data ?? [],
    todaysPlan: planResult.data,
    recentTasks: tasksResult.data ?? [],
  };
}

export function buildSystemPrompt(context: UserContext): string {
  return `You are North, a personal planning assistant.

<current_state>
Active Goals (${context.activeGoals.length}):
${context.activeGoals.map(g => `- ${g.title}${g.target_date ? ` (due: ${g.target_date})` : ''}`).join('\n') || '- No goals yet'}

${
  context.todaysPlan
    ? `Today's Focus: ${context.todaysPlan.compass_task_id || 'Not set'}
Planned Tasks: ${context.todaysPlan.task_ids.length} items`
    : 'No daily plan set yet.'
}

Recent Tasks:
${context.recentTasks.map(t => `- [${t.status}] ${t.title}`).join('\n') || '- No active tasks'}
</current_state>

<behavior>
- Execute tools silently to read/write data, then explain what you did
- Break down large goals into actionable tasks
- When updating goals or tasks, confirm the change inline (e.g., "✓ Updated goal")
- For complex planning, think step by step before making changes
- Proactively suggest daily planning if none exists
</behavior>`;
}

export function buildContextSummary(context: UserContext): string {
  return `Goals: ${context.activeGoals.length} active. Tasks: ${context.recentTasks.length} pending.`;
}

export function classifyQueryComplexity(content: string): 'simple' | 'complex' {
  const simplePatterns = [
    /^(list|show|what('s| is)|how many)/i,
    /^(check|status|did i)/i,
  ];
  return simplePatterns.some(p => p.test(content)) ? 'simple' : 'complex';
}
