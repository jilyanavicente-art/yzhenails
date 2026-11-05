-- YZHE NAILS booking database
-- Run this entire file in Supabase SQL Editor.

create table if not exists public.booking_slots (
  id text primary key,
  booking_date date not null,
  slot_time time not null,
  status text not null default 'available'
    check (status in ('available','booked','closed','full')),
  customer_name text,
  customer_first_name text,
  customer_phone text,
  created_at timestamptz,
  unique (booking_date, slot_time)
);

create table if not exists public.booking_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.booking_slots enable row level security;
alter table public.booking_admins enable row level security;

create or replace function public.is_booking_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.booking_admins where user_id = auth.uid()
  );
$$;

-- Admins can read and manage all booking records.
drop policy if exists "Admins can manage slots" on public.booking_slots;
create policy "Admins can manage slots"
on public.booking_slots for all
to authenticated
using (public.is_booking_admin())
with check (public.is_booking_admin());

-- Customers read only the safe public view, never the base table.
create or replace view public.public_booking_slots as
select id, booking_date, slot_time, status, customer_first_name
from public.booking_slots;

grant select on public.public_booking_slots to anon, authenticated;

-- Atomic booking: only one request can change an available slot to booked.
create or replace function public.book_nail_slot(
  p_slot_id text,
  p_customer_name text,
  p_customer_phone text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
  first_name text;
begin
  if length(trim(coalesce(p_customer_name,''))) < 2 then
    return json_build_object('success', false, 'message', 'Please enter your name.');
  end if;
  if length(trim(coalesce(p_customer_phone,''))) < 7 then
    return json_build_object('success', false, 'message', 'Please enter a valid contact number.');
  end if;

  first_name := split_part(trim(p_customer_name), ' ', 1);

  update public.booking_slots
  set status = 'booked',
      customer_name = trim(p_customer_name),
      customer_first_name = first_name,
      customer_phone = trim(p_customer_phone),
      created_at = now()
  where id = p_slot_id and status = 'available';

  get diagnostics updated_count = row_count;

  if updated_count = 1 then
    return json_build_object('success', true, 'message', 'Appointment confirmed.');
  end if;

  return json_build_object('success', false, 'message', 'This time slot is no longer available. Please select another slot.');
end;
$$;

grant execute on function public.book_nail_slot(text,text,text) to anon, authenticated;

-- Seed all 31 dates and five appointment times.
insert into public.booking_slots (id, booking_date, slot_time, status)
select
  to_char(d::date, 'YYYY-MM-DD') || '-' || replace(t::text, ':', ''),
  d::date,
  t::time,
  'available'
from generate_series(date '2026-12-01', date '2026-12-31', interval '1 day') as d
cross join (values (time '09:00'), (time '11:00'), (time '13:00'), (time '15:00'), (time '17:00')) as times(t)
on conflict (booking_date, slot_time) do nothing;

-- Owner-provided starting availability:
-- Dec 14 and 15: fully booked (blocked as FULL, without fake customer bookings).
update public.booking_slots set status = 'full'
where booking_date in (date '2026-12-14', date '2026-12-15')
  and status = 'available';

-- Dec 25 and 26: closed.
update public.booking_slots set status = 'closed'
where booking_date in (date '2026-12-25', date '2026-12-26')
  and status = 'available';

-- After creating your Supabase Auth user, add its UUID as an admin:
-- insert into public.booking_admins (user_id) values ('YOUR-AUTH-USER-UUID');
