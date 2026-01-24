import { InferAgentUIMessage } from 'ai';
import { createPlanningAgent } from '@/lib/agents/planning-agent';

// Infer the UIMessage type from your agent for type-safe client components
export type PlanningAgentMessage = InferAgentUIMessage<ReturnType<typeof createPlanningAgent>>;
