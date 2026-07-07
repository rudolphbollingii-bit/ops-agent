-- ══════════════════════════════════════════════════════════════════
-- OPS AGENT — Paste this entire file into:
-- Supabase Dashboard → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- Your 6 life/business domains
create table domains (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  color      text not null,
  sort_order int default 0
);

insert into domains (name, color, sort_order) values
  ('Real Estate',      'blue',   1),
  ('Fleet / Vehicles', 'green',  2),
  ('Investing',        'amber',  3),
  ('Home Improvement', 'purple', 4),
  ('Family',           'pink',   5),
  ('CVS / Day Job',    'gray',   6);

-- Tasks
create table tasks (
  id                 uuid primary key default uuid_generate_v4(),
  title              text not null,
  description        text,
  domain_id          uuid references domains(id),
  priority           text check (priority in ('high','medium','low')) default 'medium',
  status             text check (status in ('open','done')) default 'open',
  due_date           date,
  estimated_minutes  int,
  created_at         timestamptz default now()
);

-- Seed with your current real tasks
insert into tasks (title, description, domain_id, priority, due_date, estimated_minutes)
select 'Luzerne deed transfer search — estate heirs',
       'Landex Webstore — filter estates, cross-ref probate. Sale coming up.',
       id, 'high', current_date + 11, 180
from domains where name = 'Real Estate';

insert into tasks (title, description, domain_id, priority, estimated_minutes)
select 'Review /CL crude oil position + adjust stops',
       'Check thinkorswim before market open. Geopolitical situation active.',
       id, 'high', 30
from domains where name = 'Investing';

insert into tasks (title, description, domain_id, priority, estimated_minutes)
select 'Arkansas dealer license — next application step',
       'Out-of-state path to unlock Manheim/ADESA/Copart auction access.',
       id, 'medium', 60
from domains where name = 'Fleet / Vehicles';

insert into tasks (title, description, domain_id, priority, estimated_minutes)
select 'MooveTrax V3 install on 2 remaining fleet vehicles',
       'GPS kill switch. Two vehicles still need it.',
       id, 'medium', 120
from domains where name = 'Fleet / Vehicles';

insert into tasks (title, description, domain_id, priority, estimated_minutes)
select 'Son golf practice — scholarship program research',
       'Look into junior golf programs for 12yo, schedule a session.',
       id, 'low', 45
from domains where name = 'Family';

insert into tasks (title, description, domain_id, priority, estimated_minutes)
select 'Well water pH retest — Dickson City property',
       'Post water treatment install check. Fleck 5600SXT + pH neutralizer.',
       id, 'low', 30
from domains where name = 'Home Improvement';

-- Alerts
create table alerts (
  id         uuid primary key default uuid_generate_v4(),
  title      text not null,
  body       text not null,
  severity   text check (severity in ('high','medium','info')) default 'info',
  domain_id  uuid references domains(id),
  url        text,
  read       boolean default false,
  created_at timestamptz default now()
);

-- Seed with current real alerts
insert into alerts (title, body, severity, domain_id)
select 'Crude oil up 2.3% — geopolitical trigger',
       'US-Iran tensions escalated overnight. Your /CL position needs attention before market open. Check and adjust stops on thinkorswim.',
       'high', id
from domains where name = 'Investing';

insert into alerts (title, body, severity, domain_id)
select 'Turo updated host protection policy',
       'New insurance coverage terms take effect next month. Review against your current ABI Period X coverage to check for TrustedWheels fleet gaps.',
       'medium', id
from domains where name = 'Fleet / Vehicles';

-- Schedule blocks
create table schedule_blocks (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  block_type  text check (block_type in ('deep_work','admin','family','health','buffer')) default 'deep_work',
  date        date not null,
  start_time  time not null,
  end_time    time not null,
  domain_id   uuid references domains(id),
  protected   boolean default false,
  notes       text,
  created_at  timestamptz default now()
);

-- Seed today's schedule with good defaults
insert into schedule_blocks (title, block_type, date, start_time, end_time, domain_id, protected)
select 'Morning deep work — deed research', 'deep_work', current_date, '05:30', '07:00', id, false
from domains where name = 'Real Estate';

insert into schedule_blocks (title, block_type, date, start_time, end_time, protected)
values ('Family time — Jenelle + kids', 'family', current_date, '18:00', '20:00', true);

-- Conversation history (AI agent stores chats here)
create table conversations (
  id         uuid primary key default uuid_generate_v4(),
  messages   jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
