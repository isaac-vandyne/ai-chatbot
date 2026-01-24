import { ToolLoopAgent, stepCountIs } from 'ai';
import { SupabaseClient } from '@supabase/supabase-js';
import { getLanguageModel } from '@/lib/ai/providers';
import { goalTools, taskTools, nodeTools, dailyPlanTools, userProfileTools } from '@/lib/tools';
import { buildSystemPrompt, UserContext } from '@/lib/context';

export function createPlanningAgent(
  supabase: SupabaseClient,
  userId: string,
  context: UserContext
) {
  return new ToolLoopAgent({
    model: getLanguageModel('anthropic/claude-sonnet-4-20250514'),
    instructions: buildSystemPrompt(context),
    tools: {
      ...goalTools(supabase, userId),
      ...taskTools(supabase, userId),
      ...nodeTools(supabase, userId),
      ...dailyPlanTools(supabase, userId),
      ...userProfileTools(supabase, userId),
    },
    stopWhen: stepCountIs(5), // Allow up to 5 tool iterations
  });
}
