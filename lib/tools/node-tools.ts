import type { SupabaseClient } from "@supabase/supabase-js";
import { tool } from "ai";
import { z } from "zod";

export function nodeTools(supabase: SupabaseClient, userId: string) {
  return {
    node_create: tool({
      description: "Create a new note or document in the filesystem",
      inputSchema: z.object({
        path: z
          .string()
          .optional()
          .describe("Folder path like /work/projects/"),
        content: z.string(),
        meta: z.record(z.unknown()).optional(),
      }),
      execute: async (params: {
        path?: string;
        content: string;
        meta?: Record<string, unknown>;
      }) => {
        const { data, error } = await supabase
          .from("nodes")
          .insert({ ...params, user_id: userId })
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, node: data, message: "Note created" };
      },
    }),

    node_search: tool({
      description: "Full-text search across notes and documents",
      inputSchema: z.object({
        query: z.string().min(2),
        path_prefix: z
          .string()
          .optional()
          .describe("Filter by folder path like /work/projects/"),
        limit: z.number().max(20).default(10),
      }),
      execute: async ({
        query,
        path_prefix,
        limit,
      }: {
        query: string;
        path_prefix?: string;
        limit: number;
      }) => {
        const { data, error } = await supabase.rpc("search_nodes", {
          search_query: query,
          folder_path: path_prefix ?? null,
          result_limit: limit,
        });
        return error
          ? { success: false, error: error.message }
          : { nodes: data };
      },
    }),

    node_get: tool({
      description: "Get a specific node by ID",
      inputSchema: z.object({
        id: z.string().uuid(),
      }),
      execute: async ({ id }: { id: string }) => {
        const { data, error } = await supabase
          .from("nodes")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, node: data };
      },
    }),

    node_update: tool({
      description: "Update an existing note",
      inputSchema: z.object({
        id: z.string().uuid(),
        content: z.string().optional(),
        path: z.string().optional(),
        meta: z.record(z.unknown()).optional(),
      }),
      execute: async ({
        id,
        ...updates
      }: {
        id: string;
        content?: string;
        path?: string;
        meta?: Record<string, unknown>;
      }) => {
        const { data, error } = await supabase
          .from("nodes")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, node: data, message: "Note updated" };
      },
    }),

    node_list: tool({
      description: "List notes by folder path",
      inputSchema: z.object({
        path_prefix: z.string().optional(),
        limit: z.number().max(50).default(20),
      }),
      execute: async ({
        path_prefix,
        limit,
      }: {
        path_prefix?: string;
        limit: number;
      }) => {
        let query = supabase
          .from("nodes")
          .select("id, path, content, meta, created_at")
          .eq("user_id", userId)
          .is("archived_at", null)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (path_prefix) {
          query = query.like("path", `${path_prefix}%`);
        }

        const { data, error } = await query;
        return error
          ? { success: false, error: error.message }
          : { nodes: data };
      },
    }),
  };
}
