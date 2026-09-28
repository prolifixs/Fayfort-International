-- LANDED database, for Supabase project uswsmbhkedbehkotxngm (created 28 September 2026 to replace
-- uxbakpeeqydatgvvdyaa, which nobody could sign in to). Built from what the code reads and writes;
-- the old project never had its schema checked in.
--
-- One transaction: if any step fails, nothing changes. Safe to run again.
--
-- Who can do what (docs/SECURITY-REVIEW.md):
--   Customers (signed in; the "authenticated" role)
--     requests          see their own; send their own, as pending; withdraw their own while pending
--     status_history    see the history of their own requests
--     invoices          see their own
--     notifications     see their own; mark them read
--     users             see their own profile. Never set a role or status: every new profile is a
--                       customer, and confirming the email makes it active.
--     finance_waitlist  join it, and see their own entry
--     products, categories, product_media   browse
--   Signed-out visitors ("anon"): nothing. Product images are public files in the products bucket.
--   FAYFORT staff work in Fayfort Ops with the secret key, which these rules do not limit; roles that
--   grant access in the site itself live in app_metadata, which only that key can set.

begin;

-- Updated-at timestamps.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Profiles. One per auth user, created by the database at sign-up.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'customer' check (role in ('admin', 'customer', 'supplier')),
  status text not null default 'pending' check (status in ('pending', 'active', 'inactive')),
  notification_preferences jsonb not null default '{}',
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- The code joins products to categories through products_category_id_fkey, the default name.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category_id uuid references public.categories (id) on delete set null,
  price_range text,
  image_url text,
  availability boolean not null default true,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  is_primary boolean not null default false,
  order_index integer not null default 0,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

-- Sourcing enquiries. customer_id defaults to the signed-in user because some request forms don't
-- send it. A deleted account or product leaves the enquiry in place (Fayfort Ops shows "Account
-- deleted" or "A product since removed"). The code joins through requests_customer_id_fkey and
-- requests_product_id_fkey, the default names.
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid default auth.uid() references public.users (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  quantity integer not null check (quantity > 0),
  budget numeric(12, 2) not null default 0 check (budget >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'fulfilled', 'shipped', 'rejected', 'notified', 'resolved')),
  resolution_status text not null default 'pending' check (resolution_status in ('pending', 'notified', 'resolved')),
  invoice_status text not null default 'unpaid' check (invoice_status in ('paid', 'unpaid')),
  notes text,
  notification_sent boolean not null default false,
  notification_type text,
  last_notification_date timestamptz,
  tracking_number text,
  carrier text,
  shipping_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists requests_customer_id_idx on public.requests (customer_id);
create index if not exists requests_created_at_idx on public.requests (created_at desc);
create index if not exists requests_status_idx on public.requests (status);

create table if not exists public.status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  status text not null,
  notes text,
  updated_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists status_history_request_id_idx on public.status_history (request_id);

-- Invoices are accounting records: a request that has one can't be deleted (restrict). Withdrawing
-- a pending request still works, because pending requests have no invoice.
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete restrict,
  user_id uuid references public.users (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'cancelled')),
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists invoices_request_id_idx on public.invoices (request_id);
create index if not exists invoices_user_id_idx on public.invoices (user_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null default 'info',
  content text not null,
  reference_id text,
  reference_type text,
  metadata jsonb,
  read_status boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);

create table if not exists public.finance_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid references public.users (id) on delete cascade,
  source text,
  notification_preferences jsonb not null default '{}',
  created_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array['users', 'products', 'requests', 'invoices', 'notifications'] loop
    execute format('drop trigger if exists %1$s_updated_at on public.%1$I', t);
    execute format('create trigger %1$s_updated_at before update on public.%1$I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Sign-up creates the profile as a customer, whatever the sign-up form sent. It is active straight
-- away when the email is already confirmed (e.g. Google sign-in), and pending otherwise.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, email, name, status)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    case when new.email_confirmed_at is null then 'pending' else 'active' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Confirming the email activates the profile.
create or replace function public.activate_confirmed_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.users set status = 'active' where id = new.id and status = 'pending';
  return new;
end $$;

drop trigger if exists on_auth_email_confirmed on auth.users;
create trigger on_auth_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.activate_confirmed_profile();

-- Profiles created or changed from the browser are always customers, and customers never change
-- their own role or status. Only the secret key (Fayfort Ops, or FAYFORT in the dashboard) can.
create or replace function public.keep_profiles_customer()
returns trigger language plpgsql set search_path = '' as $$
declare
  caller text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '');
begin
  if caller not in ('anon', 'authenticated') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.role := 'customer';
    new.status := 'pending';
  else
    new.role := old.role;
    new.status := old.status;
  end if;
  return new;
end $$;

drop trigger if exists keep_profiles_customer on public.users;
create trigger keep_profiles_customer
  before insert or update on public.users
  for each row execute function public.keep_profiles_customer();

-- Every status a request passes through is recorded, by whoever changed it (null for Fayfort Ops and
-- the dashboard). Customers can't write history themselves.
create or replace function public.record_request_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.status_history (request_id, status, notes, updated_by)
    values (
      new.id,
      new.status,
      case when tg_op = 'INSERT' then 'Request created' end,
      (select id from public.users where id = auth.uid())
    );
  end if;
  return new;
end $$;

drop trigger if exists record_request_status on public.requests;
create trigger record_request_status
  after insert or update of status on public.requests
  for each row execute function public.record_request_status();

-- Access. Start from nothing for the browser roles, then grant back only what customers need.
do $$
declare
  t record;
  pol record;
begin
  for t in select c.relname from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p', 'v', 'm') loop
    execute format('revoke all on public.%I from public, anon, authenticated', t.relname);
  end loop;
  for t in select c.relname from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p') loop
    execute format('alter table public.%I enable row level security', t.relname);
    for pol in select policyname from pg_policies where schemaname = 'public' and tablename = t.relname loop
      execute format('drop policy %I on public.%I', pol.policyname, t.relname);
    end loop;
  end loop;
end $$;

grant select, delete on public.requests to authenticated;
grant insert (customer_id, user_id, product_id, quantity, budget, notes, status) on public.requests to authenticated;
create policy "Customers see their own requests" on public.requests
  for select to authenticated using (customer_id = (select auth.uid()));
create policy "Customers send their own requests, as pending" on public.requests
  for insert to authenticated
  with check (customer_id = (select auth.uid()) and status = 'pending' and (user_id is null or user_id = (select auth.uid())));
create policy "Customers withdraw their own pending requests" on public.requests
  for delete to authenticated using (customer_id = (select auth.uid()) and status = 'pending');

-- Withdrawing a request clears its history by cascade; the page also deletes it first, which only
-- works for the customer's own pending requests.
grant select, delete on public.status_history to authenticated;
create policy "Customers see the history of their own requests" on public.status_history
  for select to authenticated
  using (exists (select 1 from public.requests r where r.id = request_id and r.customer_id = (select auth.uid())));
create policy "Customers clear the history of a request they withdraw" on public.status_history
  for delete to authenticated
  using (exists (select 1 from public.requests r
                 where r.id = request_id and r.customer_id = (select auth.uid()) and r.status = 'pending'));

-- The page deletes a withdrawn request's invoices first; a pending request never has one, so this
-- grant can only ever delete nothing for customers.
grant select, delete on public.invoices to authenticated;
create policy "Customers see their own invoices" on public.invoices
  for select to authenticated
  using (user_id = (select auth.uid())
         or exists (select 1 from public.requests r where r.id = request_id and r.customer_id = (select auth.uid())));
create policy "Customers clear the invoice of a request they withdraw" on public.invoices
  for delete to authenticated
  using (status = 'draft' and exists (select 1 from public.requests r
         where r.id = request_id and r.customer_id = (select auth.uid()) and r.status = 'pending'));

grant select on public.notifications to authenticated;
grant update (read_status) on public.notifications to authenticated;
create policy "Customers see their own notifications" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Customers mark their own notifications read" on public.notifications
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- auth/callback creates the profile if sign-up somehow didn't; the trigger keeps it a customer.
grant select, insert on public.users to authenticated;
create policy "Customers see their own profile" on public.users
  for select to authenticated using (id = (select auth.uid()));
create policy "Customers create their own profile" on public.users
  for insert to authenticated with check (id = (select auth.uid()));

grant select, insert on public.finance_waitlist to authenticated;
create policy "Customers see their own waitlist entry" on public.finance_waitlist
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Customers join the finance waitlist" on public.finance_waitlist
  for insert to authenticated
  with check (user_id = (select auth.uid()) and email = (select auth.jwt() ->> 'email'));

grant select on public.products, public.categories, public.product_media to authenticated;
create policy "Signed-in customers browse products" on public.products for select to authenticated using (true);
create policy "Signed-in customers browse categories" on public.categories for select to authenticated using (true);
create policy "Signed-in customers see product media" on public.product_media for select to authenticated using (true);

-- Functions that run with their owner's rights skip row-level security: the browser roles can't
-- call any of them directly.
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

-- Live updates on the customer's dashboard (row-level security still applies to them).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'requests') then
      alter publication supabase_realtime add table public.requests;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications') then
      alter publication supabase_realtime add table public.notifications;
    end if;
  end if;
end $$;

-- Product images: a public bucket, so the catalog can show them; only the secret key uploads.
insert into storage.buckets (id, name, public) values ('products', 'products', true)
on conflict (id) do update set public = true;

commit;
