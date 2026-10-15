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
    or new.app_role is distinct from old.app_role
  then
    raise exception 'Only an administrator can change account identity or role.';
  end if;

  if new.email is distinct from old.email
    and not exists (
      select 1
      from auth.users
      where id = new.id
        and email = new.email
    )
  then
    raise exception 'Profile email must match the authenticated account email.';
  end if;

  return new;
end;
$$;

create or replace function public.sync_delegateos_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists sync_delegateos_profile_email on auth.users;
create trigger sync_delegateos_profile_email
  after update of email on auth.users
  for each row
  when (new.email is not null and new.email is distinct from old.email)
  execute procedure public.sync_delegateos_profile_email();
