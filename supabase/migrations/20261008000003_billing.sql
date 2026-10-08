-- Applies a normalized billing event exactly once, in one transaction:
--   payment_succeeded     -> subscription active,   business live (owner confirmed, tagged "paid")
--   payment_failed        -> subscription past_due, business paused
--   subscription_canceled -> subscription canceled, business paused
-- Returns 'applied', 'duplicate' (event id already processed) or
-- 'unknown_business'.

create function public.apply_billing_event(
  p_provider         text,
  p_event_id         text,
  p_type             text,
  p_business_id      uuid,
  p_subscription_ref text,
  p_plan             text,
  p_period_end       timestamptz,
  p_payload          jsonb
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_exists boolean;
  v_sub_status text;
begin
  if p_type not in ('payment_succeeded', 'payment_failed', 'subscription_canceled') then
    raise exception 'unknown billing event type %', p_type;
  end if;

  select exists (select 1 from public.businesses where id = p_business_id) into v_exists;

  insert into public.billing_events (provider, event_id, type, business_id, payload, processed_at)
  values (p_provider, p_event_id, p_type, case when v_exists then p_business_id end, p_payload, now())
  on conflict (provider, event_id) do nothing;
  if not found then
    return 'duplicate';
  end if;

  if not v_exists then
    return 'unknown_business';
  end if;

  v_sub_status := case p_type
    when 'payment_succeeded' then 'active'
    when 'payment_failed' then 'past_due'
    else 'canceled'
  end;

  insert into public.subscriptions (business_id, provider, provider_ref, plan, status, current_period_end)
  values (p_business_id, p_provider, p_subscription_ref, coalesce(p_plan, 'monthly'), v_sub_status, p_period_end)
  on conflict (provider, provider_ref) do update
    set status = excluded.status,
        plan = coalesce(p_plan, public.subscriptions.plan),
        current_period_end = coalesce(excluded.current_period_end, public.subscriptions.current_period_end);

  if p_type = 'payment_succeeded' then
    update public.businesses
       set status = 'live',
           published_at = coalesce(published_at, now()),
           owner_confirmed = true,
           owner_confirmed_at = coalesce(owner_confirmed_at, now()),
           lead_tags = array(select distinct t from unnest(lead_tags || array['paid']) as t order by t)
     where id = p_business_id;
  else
    update public.businesses set status = 'paused' where id = p_business_id;
  end if;

  return 'applied';
end;
$$;

revoke execute on function public.apply_billing_event(text, text, text, uuid, text, text, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function public.apply_billing_event(text, text, text, uuid, text, text, timestamptz, jsonb)
  to service_role;
