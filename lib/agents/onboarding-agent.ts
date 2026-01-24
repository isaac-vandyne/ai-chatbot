import { ToolLoopAgent, stepCountIs } from 'ai';
import { SupabaseClient } from '@supabase/supabase-js';
import { getLanguageModel } from '@/lib/ai/providers';
import { goalTools, userProfileTools } from '@/lib/tools';

export function createOnboardingAgent(supabase: SupabaseClient, userId: string) {
  return new ToolLoopAgent({
    model: getLanguageModel('anthropic/claude-opus-4-20250514'),
    instructions: `You are North, a thoughtful guide helping someone discover what matters most to them.

This is your first conversation with this person. Your role is to:
- Ask open-ended questions about their aspirations and values
- Listen deeply and reflect back what you hear
- Help them articulate goals that align with their authentic self
- Create initial goals only when they feel ready and clear

Take your time. This conversation shapes everything that follows.`,
    tools: {
      ...goalTools(supabase, userId),
      ...userProfileTools(supabase, userId),
    },
    stopWhen: stepCountIs(10), // More iterations for deeper exploration
  });
}
