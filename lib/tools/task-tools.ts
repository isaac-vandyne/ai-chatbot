import type { SupabaseClient } from "@supabase/supabase-js";
import { tool } from "ai";
import { z } from "zod";

export function taskTools(supabase: SupabaseClient, userId: string) {
  return {
    task_upsert: tool({
      description: `Create or update a task. Tasks can link to goals and support recurring schedules.
Cadence types: 'once' (default), 'daily', 'weekly' (specify days 0-6), 'monthly' (specify dayOfMonth)`,
      inputSchema: z.object({
        id: z.string().uuid().optional(),
        title: z.string().min(1).max(300),
        goal_id: z.string().uuid().optional(),
        due_at: z.string().datetime().optional(),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
        cadence: z
          .discriminatedUnion("type", [
            z.object({ type: z.literal("once") }),
            z.object({ type: z.literal("daily") }),
            z.object({
              type: z.literal("weekly"),
              days: z.array(z.number().min(0).max(6)),
            }),
            z.object({
              type: z.literal("monthly"),
              dayOfMonth: z.number().min(1).max(31),
            }),
          ])
          .optional(),
      }),
      execute: async (params: {
        id?: string;
        title: string;
        goal_id?: string;
        due_at?: string;
        status?: "pending" | "in_progress" | "completed";
        cadence?:
          | { type: "once" }
          | { type: "daily" }
          | { type: "weekly"; days: number[] }
          | { type: "monthly"; dayOfMonth: number };
      }) => {
        const { data, error } = await supabase
          .from("tasks")
          .upsert({ ...params, user_id: userId }, { onConflict: "id" })
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        return {
          success: true,
          task: data,
          message: `Task "${data.title}" ${params.id ? "updated" : "created"}`,
        };
      },
    }),

    task_list: tool({
      description:
        "List tasks with optional filtering by date range, status, or goal",
      inputSchema: z.object({
        date_range: z
          .object({
            start: z.string().datetime(),
            end: z.string().datetime(),
          })
          .optional(),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
        goal_id: z.string().uuid().optional(),
        archived: z.boolean().default(false),
      }),
      execute: async ({
        date_range,
        status,
        goal_id,
        archived,
      }: {
        date_range?: { start: string; end: string };
        status?: "pending" | "in_progress" | "completed";
        goal_id?: string;
        archived: boolean;
      }) => {
        let query = supabase
          .from("tasks")
          .select("id, title, status, due_at, goal_id, cadence")
          .eq("user_id", userId)
          .order("due_at", { ascending: true });

        if (!archived) query = query.is("archived_at", null);
        if (status) query = query.eq("status", status);
        if (goal_id) query = query.eq("goal_id", goal_id);
        if (date_range) {
          query = query
            .gte("due_at", date_range.start)
            .lte("due_at", date_range.end);
        }

        const { data, error } = await query;
        return error
          ? { success: false, error: error.message }
          : { tasks: data };
      },
    }),

    task_get: tool({
      description: "Get a specific task by ID",
      inputSchema: z.object({
        id: z.string().uuid(),
      }),
      execute: async ({ id }: { id: string }) => {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, task: data };
      },
    }),

    task_complete: tool({
      description: "Mark a task as completed",
      inputSchema: z.object({
        id: z.string().uuid(),
      }),
      execute: async ({ id }: { id: string }) => {
        const { data, error } = await supabase
          .from("tasks")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, message: `Task "${data.title}" completed` };
      },
    }),

    task_archive: tool({
      description: "Archive a task (soft delete)",
      inputSchema: z.object({
        id: z.string().uuid(),
      }),
      execute: async ({ id }: { id: string }) => {
        const { data, error } = await supabase
          .from("tasks")
          .update({ archived_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, message: `Task "${data.title}" archived` };
      },
    }),
  };
}
