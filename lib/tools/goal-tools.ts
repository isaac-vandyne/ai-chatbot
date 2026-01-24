import type { SupabaseClient } from "@supabase/supabase-js";
import { tool } from "ai";
import { z } from "zod";

export function goalTools(supabase: SupabaseClient, userId: string) {
  return {
    goal_upsert: tool({
      description:
        "Create or update a goal. Use for new goals or modifying existing ones.",
      inputSchema: z.object({
        id: z.string().uuid().optional().describe("Omit for new goals"),
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        parent_id: z.string().uuid().optional(),
        target_date: z.string().datetime().optional(),
        meta: z
          .object({
            priority: z.enum(["low", "medium", "high"]).optional(),
            tags: z.array(z.string()).optional(),
          })
          .optional(),
      }),
      execute: async (input: {
        id?: string;
        title: string;
        description?: string;
        parent_id?: string;
        target_date?: string;
        meta?: { priority?: "low" | "medium" | "high"; tags?: string[] };
      }) => {
        const { data, error } = await supabase
          .from("goals")
          .upsert({ ...input, user_id: userId }, { onConflict: "id" })
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        return {
          success: true,
          goal: data,
          message: `Goal "${data.title}" saved`,
        };
      },
    }),

    goal_list: tool({
      description: "List user goals, optionally filtered by status or parent",
      inputSchema: z.object({
        status: z.enum(["active", "completed", "archived"]).optional(),
        parent_id: z.string().uuid().nullable().optional(),
        limit: z.number().max(50).default(20),
      }),
      execute: async ({
        status,
        parent_id,
        limit,
      }: {
        status?: "active" | "completed" | "archived";
        parent_id?: string | null;
        limit: number;
      }) => {
        let query = supabase
          .from("goals")
          .select("id, title, status, target_date, meta, parent_id")
          .eq("user_id", userId)
          .is("archived_at", null)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (status) query = query.eq("status", status);
        if (parent_id !== undefined) query = query.eq("parent_id", parent_id);

        const { data, error } = await query;
        return error
          ? { success: false, error: error.message }
          : { goals: data };
      },
    }),

    goal_get: tool({
      description: "Get a specific goal by ID with full details",
      inputSchema: z.object({
        id: z.string().uuid(),
      }),
      execute: async ({ id }: { id: string }) => {
        const { data, error } = await supabase
          .from("goals")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, goal: data };
      },
    }),

    goal_archive: tool({
      description: "Archive a goal (soft delete)",
      inputSchema: z.object({
        id: z.string().uuid(),
      }),
      execute: async ({ id }: { id: string }) => {
        const { data, error } = await supabase
          .from("goals")
          .update({ archived_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, message: `Goal "${data.title}" archived` };
      },
    }),
  };
}
