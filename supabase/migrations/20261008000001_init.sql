-- Minitebuild initial schema.
--
-- Access model: every table has RLS enabled and NO policies for the anon or
-- authenticated roles, so the publishable key can read or write nothing.
-- All reads and writes go through server code that uses the secret key
-- (service_role, which bypasses RLS) after checking the caller:
--   * admin pages/actions verify the Supabase session email == ADMIN_EMAIL
--   * public pages use a server-only function that selects only the
--     columns a site needs
--   * the queue worker and billing webhook verify a shared secret / signature

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.business_status as enum ('preview', 'live', 'paused');
create type public.job_status as enum ('queued', 'processing', 'done', 'failed');
create type public.batch_status as enum ('queued', 'processing', 'completed');

-- ---------------------------------------------------------------------------
-- import_batches: one row per CSV upload
-- ---------------------------------------------------------------------------

create table public.import_batches (
  id            uuid primary key default gen_random_uuid(),
  filename      text not null,
  total         integer not null default 0 check (total >= 0),
  done          integer not null default 0 check (done >= 0),
  failed        integer not null default 0 check (failed >= 0),
  status        public.batch_status not null default 'queued',
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

-- ---------------------------------------------------------------------------
-- businesses: one row per lead / site
-- ---------------------------------------------------------------------------

create table public.businesses (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique
                        check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  name                text not null check (length(name) between 1 and 200),
  city                text not null default '',
  trade               text not null default 'general_contractor',

  -- Business details. Seeded from Google Places (or the CSV when Google has
  -- no match) and confirmed or edited by the admin.
  phone               text,
  address             text,
  hours               jsonb not null default '[]'::jsonb,  -- array of "Monday: 8 AM - 5 PM"
  category            text,
  place_id            text,
  website_url         text,                                -- existing site, per Google
  places_verified     boolean not null default false,      -- false = "unverified" tag
  places_fetched_at   timestamptz,
  owner_confirmed     boolean not null default false,
  owner_confirmed_at  timestamptz,

  -- Site
  template            text not null default 'bold'
                        check (template in ('bold', 'classic', 'split')),
  content             jsonb,                               -- validated by the app's Zod schema
  photos              jsonb not null default '{}'::jsonb,  -- { slot: storage path }
  status              public.business_status not null default 'preview',
  custom_domain       text unique,
  generation_status   text not null default 'pending'
                        check (generation_status in ('pending', 'ready', 'failed')),
  last_error          text,

  -- Sales
  notes               text not null default '',
  lead_tags           text[] not null default '{}'
                        check (lead_tags <@ array['called', 'texted', 'paid']::text[]),

  batch_id            uuid references public.import_batches (id) on delete set null,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index businesses_created_at_idx on public.businesses (created_at desc);
create index businesses_status_idx on public.businesses (status);
create index businesses_batch_idx on public.businesses (batch_id);
-- One site per Google listing; a re-imported lead links to the existing site.
create unique index businesses_place_id_key on public.businesses (place_id) where place_id is not null;

-- ---------------------------------------------------------------------------
-- import_jobs: one row per CSV row. This table IS the queue.
-- ---------------------------------------------------------------------------

create table public.import_jobs (
  id           uuid primary key default gen_random_uuid(),
  batch_id     uuid not null references public.import_batches (id) on delete cascade,
  row_number   integer not null,
  input        jsonb not null,          -- { name, city, phone }
  status       public.job_status not null default 'queued',
  attempts     integer not null default 0,
  error        text,
  business_id  uuid references public.businesses (id) on delete set null,
  locked_at    timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (batch_id, row_number)
);

create index import_jobs_queue_idx on public.import_jobs (status, created_at);
create index import_jobs_batch_idx on public.import_jobs (batch_id, row_number);

-- ---------------------------------------------------------------------------
-- subscriptions / billing_events
-- ---------------------------------------------------------------------------

create table public.subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references public.businesses (id) on delete cascade,
  provider            text not null,               -- 'stub', 'manual', later 'paddle' / 'lemonsqueezy'
  provider_ref        text not null,               -- provider's subscription id
  plan                text not null default 'monthly' check (plan in ('monthly', 'yearly')),
  status              text not null
                        check (status in ('active', 'past_due', 'canceled')),
  current_period_end  timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (provider, provider_ref)
);

create index subscriptions_business_idx on public.subscriptions (business_id);

create table public.billing_events (
  id            uuid primary key default gen_random_uuid(),
  provider      text not null,
  event_id      text not null,
  type          text not null,
  business_id   uuid references public.businesses (id) on delete set null,
  payload       jsonb not null,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  unique (provider, event_id)   -- each provider event is processed only once
);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger businesses_touch before update on public.businesses
  for each row execute function public.touch_updated_at();
create trigger import_jobs_touch before update on public.import_jobs
  for each row execute function public.touch_updated_at();
create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Queue functions (called by the worker with the secret key only)
-- ---------------------------------------------------------------------------

-- Atomically claim up to p_limit jobs. Jobs stuck in 'processing' for more
-- than 5 minutes (a worker died mid-row) are reclaimed; after 3 attempts
-- they are failed instead.
create function public.claim_import_jobs(p_limit integer default 3)
returns setof public.import_jobs
language plpgsql security definer set search_path = '' as $$
begin
  -- Give up on rows that keep killing the worker.
  with dead as (
    update public.import_jobs
       set status = 'failed',
           error = coalesce(error, 'Timed out 3 times while generating'),
           locked_at = null
     where status = 'processing'
       and locked_at < now() - interval '5 minutes'
       and attempts >= 3
    returning batch_id
  )
  update public.import_batches b
     set failed = b.failed + d.n
    from (select batch_id, count(*)::int as n from dead group by batch_id) d
   where b.id = d.batch_id;

  return query
  update public.import_jobs j
     set status = 'processing',
         locked_at = now(),
         attempts = j.attempts + 1
   where j.id in (
     select id from public.import_jobs
      where status = 'queued'
         or (status = 'processing' and locked_at < now() - interval '5 minutes')
      order by created_at, row_number
      limit greatest(1, least(p_limit, 20))
      for update skip locked
   )
  returning j.*;
end;
$$;

-- Mark a job done (p_error is null) or failed, and bump the batch counters
-- in the same transaction.
create function public.finish_import_job(
  p_job_id uuid,
  p_business_id uuid,
  p_error text
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_batch uuid;
begin
  update public.import_jobs
     set status = case when p_error is null then 'done' else 'failed' end::public.job_status,
         business_id = p_business_id,
         error = p_error,
         locked_at = null
   where id = p_job_id and status = 'processing'
  returning batch_id into v_batch;

  if v_batch is null then
    return;  -- already finished by another worker
  end if;

  update public.import_batches
     set done   = done   + case when p_error is null then 1 else 0 end,
         failed = failed + case when p_error is null then 0 else 1 end,
         status = 'processing'
   where id = v_batch;

  update public.import_batches
     set status = 'completed', completed_at = now()
   where id = v_batch and done + failed >= total;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row-level security: on everywhere, no anon/authenticated policies.
-- ---------------------------------------------------------------------------

alter table public.import_batches enable row level security;
alter table public.businesses     enable row level security;
alter table public.import_jobs    enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.billing_events enable row level security;

revoke all on public.import_batches, public.businesses, public.import_jobs,
              public.subscriptions, public.billing_events
  from anon, authenticated;

revoke execute on function public.claim_import_jobs(integer) from public, anon, authenticated;
revoke execute on function public.finish_import_job(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
grant execute on function public.claim_import_jobs(integer) to service_role;
grant execute on function public.finish_import_job(uuid, uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- Storage: owner photos. Public read (live sites show them), and no insert /
-- update / delete policies, so only the secret key can write.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-photos', 'business-photos', true, 8388608,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
