-- North planning app tables (excluding chats/messages which come from Drizzle)

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  parent_id UUID REFERENCES goals(id),
  target_date TIMESTAMPTZ,
  body JSONB DEFAULT '{}',
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  archived_at TIMESTAMPTZ
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  goal_id UUID REFERENCES goals(id),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_at TIMESTAMPTZ,
  cadence JSONB,
  body JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- Nodes table (for notes/documents)
CREATE TABLE IF NOT EXISTS nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  path TEXT DEFAULT '/',
  content TEXT,
  meta JSONB DEFAULT '{}',
  fts TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(content, ''))
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  archived_at TIMESTAMPTZ
);

-- Daily plans table
CREATE TABLE IF NOT EXISTS daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  compass_task_id UUID REFERENCES tasks(id),
  task_ids UUID[] DEFAULT '{}',
  body JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  content TEXT,
  body JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using SELECT wrapper for performance)
CREATE POLICY "Users access own goals" ON goals
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users access own tasks" ON tasks
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users access own nodes" ON nodes
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users access own daily_plans" ON daily_plans
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users access own profile" ON user_profiles
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Indexes for performance
-- User scoping (CRITICAL for RLS performance)
CREATE INDEX idx_goals_user_id ON goals (user_id);
CREATE INDEX idx_tasks_user_id ON tasks (user_id);
CREATE INDEX idx_nodes_user_id ON nodes (user_id);
CREATE INDEX idx_daily_plans_user_id ON daily_plans (user_id);

-- Hierarchical queries
CREATE INDEX idx_goals_parent_id ON goals (parent_id);

-- Common listing queries (partial indexes exclude soft-deleted)
CREATE INDEX idx_goals_user_active ON goals (user_id, status, created_at DESC)
  WHERE archived_at IS NULL;
CREATE INDEX idx_tasks_user_due ON tasks (user_id, due_at)
  WHERE archived_at IS NULL;
CREATE INDEX idx_tasks_user_goal ON tasks (user_id, goal_id, status)
  WHERE archived_at IS NULL;

-- Full-text search
CREATE INDEX idx_nodes_fts ON nodes USING gin (fts);
CREATE INDEX idx_nodes_path ON nodes (path text_pattern_ops);

-- Daily plans
CREATE INDEX idx_daily_plans_user_date ON daily_plans (user_id, date DESC);

-- Full-text search function
CREATE OR REPLACE FUNCTION search_nodes(
  search_query TEXT,
  folder_path TEXT DEFAULT NULL,
  result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  path TEXT,
  snippet TEXT,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.path,
    ts_headline('english', coalesce(n.content, ''),
                websearch_to_tsquery('english', search_query),
                'MaxWords=30, MinWords=15') as snippet,
    ts_rank(n.fts, websearch_to_tsquery('english', search_query)) as rank
  FROM nodes n
  WHERE n.user_id = (SELECT auth.uid())
    AND n.fts @@ websearch_to_tsquery('english', search_query)
    AND n.archived_at IS NULL
    AND (folder_path IS NULL OR n.path LIKE folder_path || '%')
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$;
