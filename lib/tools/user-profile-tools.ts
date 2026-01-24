import type { SupabaseClient } from "@supabase/supabase-js";
import { tool } from "ai";
import { z } from "zod";

export function userProfileTools(supabase: SupabaseClient, userId: string) {
  return {
    user_profile_update: tool({
      description:
        "Update the user profile with values, preferences, or context",
      inputSchema: z.object({
        content: z
          .string()
          .optional()
          .describe("Free-form text content about the user"),
        body: z.record(z.unknown()).optional().describe("Structured metadata"),
      }),
      execute: async (params: {
        content?: string;
        body?: Record<string, unknown>;
      }) => {
        const { data, error } = await supabase
          .from("user_profiles")
          .upsert(
            {
              ...params,
              user_id: userId,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          )
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, profile: data, message: "Profile updated" };
      },
    }),

    user_profile_get: tool({
      description: "Get the current user profile",
      inputSchema: z.object({}),
      execute: async (_params: Record<string, never>) => {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // No profile exists yet
            return {
              success: true,
              profile: null,
              message: "No profile exists yet",
            };
          }
          return { success: false, error: error.message };
        }
        return { success: true, profile: data };
      },
    }),
  };
}
