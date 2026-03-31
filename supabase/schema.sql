create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  status text not null default 'Applied' check (status in ('Saved', 'Applied', 'Interview', 'Offer', 'Rejected')),
  applied_date date,
  job_link text,
  location text,
  salary_range text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_descriptions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();

drop trigger if exists set_applications_updated_at on public.applications;
create trigger set_applications_updated_at before update on public.applications for each row execute function public.handle_updated_at();

drop trigger if exists set_job_descriptions_updated_at on public.job_descriptions;
create trigger set_job_descriptions_updated_at before update on public.job_descriptions for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create index if not exists idx_applications_user_id on public.applications(user_id);
create index if not exists idx_job_descriptions_user_id on public.job_descriptions(user_id);
create index if not exists idx_job_descriptions_application_id on public.job_descriptions(application_id);

alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.job_descriptions enable row level security;

create policy if not exists "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy if not exists "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy if not exists "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy if not exists "Users can view own applications" on public.applications for select using (auth.uid() = user_id);
create policy if not exists "Users can insert own applications" on public.applications for insert with check (auth.uid() = user_id);
create policy if not exists "Users can update own applications" on public.applications for update using (auth.uid() = user_id);
create policy if not exists "Users can delete own applications" on public.applications for delete using (auth.uid() = user_id);

create policy if not exists "Users can view own job descriptions" on public.job_descriptions for select using (auth.uid() = user_id);
create policy if not exists "Users can insert own job descriptions" on public.job_descriptions for insert with check (auth.uid() = user_id);
create policy if not exists "Users can update own job descriptions" on public.job_descriptions for update using (auth.uid() = user_id);
create policy if not exists "Users can delete own job descriptions" on public.job_descriptions for delete using (auth.uid() = user_id);
