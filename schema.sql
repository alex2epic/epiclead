-- EpicLead.ai — Supabase Schema
-- Run this against your Supabase project to set up the leads table.

-- Nuke existing
DROP TABLE IF EXISTS leads CASCADE;

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  business_type TEXT,
  status TEXT DEFAULT 'form_started',
  source TEXT,
  retell_call_id TEXT,
  calendly_uid TEXT,
  calendly_event_uri TEXT,
  notes TEXT,
  call_scheduled_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Anon can insert (form submissions from the frontend)
CREATE POLICY "Allow anon insert" ON leads
  FOR INSERT TO anon WITH CHECK (true);

-- Service role has full access (edge functions)
CREATE POLICY "Allow service role full access" ON leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at);
