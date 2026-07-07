-- ══════════════════════════════════════════════════════════════════
-- MIGRATION: Add Calendar + SMS support
-- Paste this into Supabase → SQL Editor → New Query → Run
-- (This is SEPARATE from the original schema — run this after)
-- ══════════════════════════════════════════════════════════════════

-- Store Google Calendar tokens + any other app settings
create table if not exists app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz default now()
);

-- Track whether an alert has been texted to your phone
alter table alerts
  add column if not exists sms_sent boolean default false;

-- Track Google Calendar event ID on schedule blocks (for sync/delete)
alter table schedule_blocks
  add column if not exists gcal_event_id text;
