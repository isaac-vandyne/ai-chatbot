import type { SupabaseClient } from "@supabase/supabase-js";
import { tool } from "ai";
import { z } from "zod";

export function dailyPlanTools(supabase: SupabaseClient, userId: string) {
  return {
    daily_plan_upsert: tool({
      description: "Create or update the daily plan for a specific date",
      inputSchema: z.object({
        date: z.string().date().describe("Date in YYYY-MM-DD format"),
        compass_task_id: z
          .string()
          .uuid()
          .optional()
          .describe("The main focus task for the day"),
        task_ids: z
          .array(z.string().uuid())
          .optional()
          .describe("List of task IDs planned for the day"),
        body: z.record(z.unknown()).optional(),
      }),
      execute: async (params: {
        date: string;
        compass_task_id?: string;
        task_ids?: string[];
        body?: Record<string, unknown>;
      }) => {
        const { data, error } = await supabase
          .from("daily_plans")
          .upsert(
            { ...params, user_id: userId },
            { onConflict: "user_id,date" }
          )
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        return {
          success: true,
          plan: data,
          message: `Daily plan for ${params.date} saved`,
        };
      },
    }),

    daily_plan_get: tool({
      description: "Get the daily plan for a specific date",
      inputSchema: z.object({
        date: z.string().date().describe("Date in YYYY-MM-DD format"),
      }),
      execute: async ({ date }: { date: string }) => {
        const { data, error } = await supabase
          .from("daily_plans")
          .select("*")
          .eq("user_id", userId)
          .eq("date", date)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // No plan exists for this date
            return {
              success: true,
              plan: null,
              message: "No plan exists for this date",
            };
          }
          return { success: false, error: error.message };
        }
        return { success: true, plan: data };
      },
    }),

    daily_plan_list_recent: tool({
      description: "List recent daily plans",
      inputSchema: z.object({
        limit: z
          .number()
          .max(30)
          .default(7)
          .describe("Number of recent plans to fetch"),
      }),
      execute: async ({ limit }: { limit: number }) => {
        const { data, error } = await supabase
          .from("daily_plans")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .limit(limit);

        if (error) return { success: false, error: error.message };
        return { success: true, plans: data };
      },
    }),
  };
}
