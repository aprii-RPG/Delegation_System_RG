create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  employee_id text not null unique default gen_random_uuid()::text,
  email text not null unique,
  full_name text not null default '',
  app_role text not null default 'employee'
    check (app_role in ('admin', 'employee')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  assignee_employee_ids text[] not null default '{}',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id text primary key,
  recipient_employee_id text not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now()
);

insert into public.profiles (id, email, full_name)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', '')
from auth.users
where email is not null
on conflict (id) do update
  set email = excluded.email;

create or replace function public.is_delegateos_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and app_role = 'admin'
  );
$$;

create or replace function public.current_delegateos_employee_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select employee_id
  from public.profiles
  where id = (select auth.uid());
$$;

create or replace function public.handle_new_delegateos_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_delegateos on auth.users;
create trigger on_auth_user_created_delegateos
  after insert on auth.users
  for each row execute procedure public.handle_new_delegateos_user();

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.notifications enable row level security;

revoke all on public.profiles, public.tasks, public.notifications from anon;
grant select, insert, update, delete
  on public.profiles, public.tasks, public.notifications to authenticated;

revoke all on function public.is_delegateos_admin() from public, anon;
revoke all on function public.current_delegateos_employee_id() from public, anon;
grant execute on function public.is_delegateos_admin() to authenticated;
grant execute on function public.current_delegateos_employee_id() to authenticated;

drop policy if exists "Users can read own profile or admins can read all"
  on public.profiles;
create policy "Users can read own profile or admins can read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_delegateos_admin()));

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
  on public.profiles for all to authenticated
  using ((select public.is_delegateos_admin()))
  with check ((select public.is_delegateos_admin()));

drop policy if exists "Admins can manage all tasks" on public.tasks;
create policy "Admins can manage all tasks"
  on public.tasks for all to authenticated
  using ((select public.is_delegateos_admin()))
  with check ((select public.is_delegateos_admin()));

drop policy if exists "Employees can read assigned tasks" on public.tasks;
create policy "Employees can read assigned tasks"
  on public.tasks for select to authenticated
  using (
    (select public.current_delegateos_employee_id())
      = any (assignee_employee_ids)
  );

drop policy if exists "Admins can manage all notifications"
  on public.notifications;
create policy "Admins can manage all notifications"
  on public.notifications for all to authenticated
  using ((select public.is_delegateos_admin()))
  with check ((select public.is_delegateos_admin()));

drop policy if exists "Employees can read own notifications"
  on public.notifications;
create policy "Employees can read own notifications"
  on public.notifications for select to authenticated
  using (
    recipient_employee_id = (select public.current_delegateos_employee_id())
  );
