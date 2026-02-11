-- Execute este comando no SQL Editor do seu Supabase para criar a tabela necessária

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  author_name TEXT,
  topic TEXT,
  book_title TEXT,
  sub_title TEXT,
  dedication TEXT,
  
  -- Status
  status TEXT DEFAULT 'IDLE',
  progress INTEGER DEFAULT 0,
  status_message TEXT,
  current_step TEXT DEFAULT 'START',
  
  -- AI Content (Armazenado como texto ou JSON)
  research_context TEXT,
  title_options JSONB DEFAULT '[]',
  structure JSONB DEFAULT '[]',
  marketing JSONB DEFAULT 'null',
  email TEXT
);

-- KV Store for legacy JSON DB migration (Leads, Settings, Orders)
CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS (Row Level Security) mas permitir acesso público para este protótipo
-- Em produção, você restringiria isso apenas ao usuário logado
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON projects
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for all users" ON kv_store
FOR ALL USING (true) WITH CHECK (true);
