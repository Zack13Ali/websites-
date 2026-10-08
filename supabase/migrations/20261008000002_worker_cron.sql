-- Every minute, pg_cron calls the app's queue worker so a CSV batch keeps
-- processing after the admin closes the progress page.
--
-- The target URL and secret live in Supabase Vault so nothing
-- environment-specific is committed. Set them once per project (SQL editor):
--
--   select vault.create_secret('https://app.example.com/api/worker', 'worker_url');
--   select vault.create_secret('<same value as CRON_SECRET>', 'worker_secret');
--
-- Until both secrets exist the job is a no-op.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create function public.invoke_import_worker() returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_url    text;
  v_secret text;
begin
  -- Don't wake the app when there's nothing to do.
  if not exists (
    select 1 from public.import_jobs
     where status = 'queued'
        or (status = 'processing' and locked_at < now() - interval '5 minutes')
  ) then
    return;
  end if;

  select decrypted_secret into v_url
    from vault.decrypted_secrets where name = 'worker_url' limit 1;
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'worker_secret' limit 1;

  if v_url is null or v_secret is null then
    return;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    body := jsonb_build_object('source', 'pg_cron'),
    timeout_milliseconds := 55000
  );
end;
$$;

revoke execute on function public.invoke_import_worker() from public, anon, authenticated;

select cron.schedule(
  'minitebuild-import-worker',
  '* * * * *',
  $$select public.invoke_import_worker()$$
);
