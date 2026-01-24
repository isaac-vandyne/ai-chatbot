import { ToolLoopAgent, stepCountIs } from 'ai';
import { SupabaseClient } from '@supabase/supabase-js';
import { getLanguageModel } from '@/lib/ai/providers';
import { goalTools, taskTools } from '@/lib/tools';
import { buildContextSummary, UserContext } from '@/lib/context';

export function createQuickAgent(
  supabase: SupabaseClient,
  userId: string,
  context: UserContext
) {
  return new ToolLoopAgent({
    model: getLanguageModel('anthropic/claude-3-5-haiku-20241022'),
    instructions: `You are North, responding to a quick query. Be concise and helpful.

${buildContextSummary(context)}`,
    tools: {
      ...goalTools(supabase, userId),
      ...taskTools(supabase, userId),
    },
    stopWhen: stepCountIs(3),
  });
}
