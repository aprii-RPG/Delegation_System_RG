alter table public.profiles
  add column if not exists data jsonb not null default '{}'::jsonb;

alter table public.profiles
  alter column employee_id set default ('doer-' || gen_random_uuid()::text);

update public.profiles
set employee_id = 'owner'
where app_role = 'admin';

drop policy if exists "Users can read own profile or admins can read all"
  on public.profiles;
create policy "Authenticated users can read profiles"
  on public.profiles for select to authenticated
  using (true);

drop policy if exists "Users can update own profile details" on public.profiles;
create policy "Users can update own profile details"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create or replace function public.guard_delegateos_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select public.is_delegateos_admin()) then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.employee_id is distinct from old.employee_id
    or new.email is distinct from old.email
    or new.app_role is distinct from old.app_role
  then
    raise exception 'Only an administrator can change account identity or role.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_delegateos_profile_changes on public.profiles;
create trigger guard_delegateos_profile_changes
  before update on public.profiles
  for each row execute procedure public.guard_delegateos_profile_changes();

create or replace function public.handle_new_delegateos_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, employee_id, email, full_name, data)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'employee_id',
      'doer-' || new.id::text
    ),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    jsonb_build_object(
      'roleTitle', coalesce(new.raw_user_meta_data ->> 'role_title', 'Team Specialist'),
      'department', coalesce(new.raw_user_meta_data ->> 'department', 'Operations'),
      'avatar', coalesce(new.raw_user_meta_data ->> 'avatar', ''),
      'accentColor', coalesce(new.raw_user_meta_data ->> 'accent_color', '#3b82f6')
    )
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        data = excluded.data;
  return new;
end;
$$;

create or replace function public.guard_delegateos_task_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_employee_id text;
begin
  if (select public.is_delegateos_admin()) then
    return new;
  end if;

  current_employee_id := (select public.current_delegateos_employee_id());
  if current_employee_id is null
    or not (current_employee_id = any(old.assignee_employee_ids))
    or new.assignee_employee_ids is distinct from old.assignee_employee_ids
    or new.created_by is distinct from old.created_by
    or new.data -> 'primaryDoerId' is distinct from old.data -> 'primaryDoerId'
    or new.data -> 'secondaryDoerId' is distinct from old.data -> 'secondaryDoerId'
    or new.data -> 'subSecondaryDoerId' is distinct from old.data -> 'subSecondaryDoerId'
    or new.data -> 'title' is distinct from old.data -> 'title'
    or new.data -> 'description' is distinct from old.data -> 'description'
    or new.data -> 'type' is distinct from old.data -> 'type'
    or new.data -> 'priority' is distinct from old.data -> 'priority'
    or new.data -> 'category' is distinct from old.data -> 'category'
    or new.data -> 'dueDate' is distinct from old.data -> 'dueDate'
    or new.data -> 'verificationRecord' is distinct from old.data -> 'verificationRecord'
    or new.data -> 'correctionHistory' is distinct from old.data -> 'correctionHistory'
    or (new.data -> 'latestCorrection') - 'resolved'
      is distinct from (old.data -> 'latestCorrection') - 'resolved'
    or new.data -> 'latestCorrection' is distinct from old.data -> 'latestCorrection'
      and new.data #>> '{latestCorrection,resolved}' is distinct from 'true'
    or new.data -> 'status' is distinct from old.data -> 'status'
      and (
        new.data ->> 'status' <> 'SUBMITTED_FOR_VERIFICATION'
        or old.data ->> 'status' = 'SUBMITTED_FOR_VERIFICATION'
        or new.data -> 'currentSubmission' is not distinct from old.data -> 'currentSubmission'
      )
    or new.data -> 'currentSubmission' is distinct from old.data -> 'currentSubmission'
      and new.data #>> '{currentSubmission,submittedByMemberId}'
        is distinct from current_employee_id
  then
    raise exception 'You are not allowed to make these changes to this task.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_delegateos_task_changes on public.tasks;
create trigger guard_delegateos_task_changes
  before update on public.tasks
  for each row execute procedure public.guard_delegateos_task_changes();

drop policy if exists "Employees can update assigned task submissions"
  on public.tasks;
create policy "Employees can update assigned task submissions"
  on public.tasks for update to authenticated
  using (
    (select public.current_delegateos_employee_id())
      = any (assignee_employee_ids)
  )
  with check (
    (select public.current_delegateos_employee_id())
      = any (assignee_employee_ids)
  );

drop policy if exists "Employees can create owner notifications"
  on public.notifications;
create policy "Employees can create owner notifications"
  on public.notifications for insert to authenticated
  with check (
    recipient_employee_id = 'owner'
    and exists (
      select 1
      from public.tasks
      where tasks.id = notifications.data ->> 'taskId'
        and (select public.current_delegateos_employee_id())
          = any (tasks.assignee_employee_ids)
    )
  );

drop policy if exists "Employees can mark own notifications read"
  on public.notifications;
create policy "Employees can mark own notifications read"
  on public.notifications for update to authenticated
  using (
    recipient_employee_id = (select public.current_delegateos_employee_id())
  )
  with check (
    recipient_employee_id = (select public.current_delegateos_employee_id())
  );

drop policy if exists "Employees can delete own notifications"
  on public.notifications;
create policy "Employees can delete own notifications"
  on public.notifications for delete to authenticated
  using (
    recipient_employee_id = (select public.current_delegateos_employee_id())
  );

create or replace function public.guard_delegateos_notification_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_delegateos_admin())
    and (
      new.id is distinct from old.id
      or new.recipient_employee_id is distinct from old.recipient_employee_id
      or new.data - 'read' is distinct from old.data - 'read'
      or (new.data ->> 'read')::boolean is distinct from
        (old.data ->> 'read')::boolean
    )
  then
    raise exception 'Employees may only mark their own notifications read.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_delegateos_notification_changes
  on public.notifications;
create trigger guard_delegateos_notification_changes
  before update on public.notifications
  for each row execute procedure public.guard_delegateos_notification_changes();

do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles', 'tasks', 'notifications'] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        table_name
      );
    end if;
  end loop;
end;
$$;
