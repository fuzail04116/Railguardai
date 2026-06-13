-- ============================================================
-- Railway Guardian AI — Supabase Database Setup
-- ============================================================
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Create alerts table
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  camera_id text not null,
  risk_score float not null,
  risk_level text not null,              -- 'low' | 'medium' | 'high' | 'critical'
  incident_type text not null,           -- 'crowd' | 'security' | 'distress' | 'compound'
  agent_outputs jsonb not null default '{}'::jsonb,
  sop_clause text,                       -- e.g. "SOP-SEC-01"
  sop_text text,
  recommendation text not null,
  frame_url text,
  duration_seconds int default 0,
  resolved boolean default false
);

-- 2. Create incident_state table (temporal tracker)
create table if not exists public.incident_state (
  id uuid primary key default gen_random_uuid(),
  camera_id text not null,
  incident_type text not null,
  first_detected_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  duration_seconds int default 0,
  escalation_level int default 0,       -- 0=new, 1=persistent, 2=critical
  active boolean default true,
  unique(camera_id, incident_type)
);

-- 3. Create indexes for performance
create index if not exists idx_alerts_created_at on public.alerts (created_at desc);
create index if not exists idx_alerts_camera_id on public.alerts (camera_id);
create index if not exists idx_alerts_risk_level on public.alerts (risk_level);
create index if not exists idx_incident_state_camera on public.incident_state (camera_id, incident_type);
create index if not exists idx_incident_state_active on public.incident_state (active) where active = true;

-- 4. Enable Row Level Security (RLS)
alter table public.alerts enable row level security;
alter table public.incident_state enable row level security;

-- 5. Create RLS policies (permissive for MVP — allows all operations)
-- Alerts: anyone can read, authenticated service role can write
create policy "Allow public read on alerts"
  on public.alerts for select
  using (true);

create policy "Allow service role insert on alerts"
  on public.alerts for insert
  with check (true);

create policy "Allow service role update on alerts"
  on public.alerts for update
  using (true);

-- Incident state: service role only
create policy "Allow all on incident_state"
  on public.incident_state for all
  using (true);

-- 6. Enable Realtime on alerts table
-- This allows the frontend to subscribe to INSERT events
alter publication supabase_realtime add table public.alerts;

-- 7. Create storage bucket for incident frames
insert into storage.buckets (id, name, public)
values ('incident-frames', 'incident-frames', true)
on conflict (id) do nothing;

-- Storage policy: allow public read, service role upload
create policy "Allow public read on incident-frames"
  on storage.objects for select
  using (bucket_id = 'incident-frames');

create policy "Allow authenticated upload to incident-frames"
  on storage.objects for insert
  with check (bucket_id = 'incident-frames');

-- ============================================================
-- VERIFICATION: Run these queries to confirm setup
-- ============================================================
-- select count(*) from public.alerts;          -- should return 0
-- select count(*) from public.incident_state;  -- should return 0
-- ============================================================
