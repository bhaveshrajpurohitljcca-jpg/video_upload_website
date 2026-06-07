-- Supabase Database Schema for AI Video Competition Platform

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create public users table linked to Supabase auth.users
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  role text not null check (role in ('student', 'judge', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on users
alter table public.users enable row level security;

-- Create student profiles table (for registered students)
create table public.student_profiles (
  id uuid references public.users(id) on delete cascade primary key,
  name text not null,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.student_profiles enable row level security;

-- Create judges table
create table public.judges (
  id uuid references public.users(id) on delete cascade primary key,
  name text not null,
  email text not null unique,
  active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.judges enable row level security;

-- Create themes table
create table public.themes (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.themes enable row level security;

-- Create submissions table
create table public.submissions (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.student_profiles(id) on delete cascade unique,
  title text not null,
  theme_id uuid references public.themes(id) on delete restrict,
  ai_stack text not null,
  video_url text not null,
  thumbnail_url text not null,
  cloudinary_public_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.submissions enable row level security;

-- Create votes table
create table public.votes (
  id uuid default gen_random_uuid() primary key,
  voter_student_id uuid references public.student_profiles(id) on delete cascade not null,
  submission_id uuid references public.submissions(id) on delete cascade not null,
  stars integer default 5 check (stars >= 1 and stars <= 5) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_student_submission_vote unique (voter_student_id, submission_id)
);

alter table public.votes enable row level security;

-- Create judge scores table
create table public.judge_scores (
  id uuid default gen_random_uuid() primary key,
  judge_id uuid references public.judges(id) on delete cascade not null,
  submission_id uuid references public.submissions(id) on delete cascade not null,
  score numeric not null,
  comments text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_judge_submission unique (judge_id, submission_id)
);

alter table public.judge_scores enable row level security;

-- Create competition settings table
create table public.competition_settings (
  id integer primary key default 1 check (id = 1),
  submission_deadline timestamp with time zone default '2026-06-07 20:30:00+05:30'::timestamp with time zone not null,
  voting_deadline timestamp with time zone default '2026-06-08 08:30:00+05:30'::timestamp with time zone not null,
  video_size_limit_mb integer default 50 check (video_size_limit_mb >= 20 and video_size_limit_mb <= 100) not null,
  judge_score_min integer default 1 not null,
  judge_score_max integer default 100 not null,
  winner_count integer default 3 not null,
  public_vote_weight numeric default 30 not null,
  judge_score_weight numeric default 70 not null,
  constraint check_weights check (public_vote_weight + judge_score_weight = 100)
);

alter table public.competition_settings enable row level security;

-- Create audit logs table
create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  action text not null,
  details jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.audit_logs enable row level security;

-- Triggers for automatic user cleanup

-- Trigger to delete public.users when a student profile is deleted
create or replace function public.handle_student_profile_delete()
returns trigger as $$
begin
  delete from public.users where id = old.id;
  return old;
end;
$$ language plpgsql security definer;

create trigger on_student_profile_delete
  after delete on public.student_profiles
  for each row execute procedure public.handle_student_profile_delete();

-- Trigger to delete public.users when a judge is deleted
create or replace function public.handle_judge_delete()
returns trigger as $$
begin
  delete from public.users where id = old.id;
  return old;
end;
$$ language plpgsql security definer;

create trigger on_judge_delete
  after delete on public.judges
  for each row execute procedure public.handle_judge_delete();

-- Trigger to create a public.users row and profiles on auth.users sign up
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_role text;
  full_name text;
begin
  -- Role metadata is passed in user_metadata during sign up
  user_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  full_name := coalesce(new.raw_user_meta_data->>'name', 'Student');
  
  insert into public.users (id, email, role)
  values (new.id, new.email, user_role)
  on conflict (id) do update set email = excluded.email, role = excluded.role;

  if user_role = 'student' then
    insert into public.student_profiles (id, name, email)
    values (new.id, full_name, new.email)
    on conflict (id) do update set name = excluded.name, email = excluded.email;
  elsif user_role = 'judge' then
    insert into public.judges (id, name, email, active)
    values (new.id, full_name, new.email, true)
    on conflict (id) do update set name = excluded.name, email = excluded.email;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to clean up auth.users when public.users is deleted
-- (This requires the supabase service_role or pg_net extensions in real production,
-- but the backend API will explicitly call deleteUser to keep it clean.
-- The cascade on public.users is the primary mechanism).

-- Create indexes for performance
create index idx_submissions_student on public.submissions(student_id);
create index idx_submissions_theme on public.submissions(theme_id);
create index idx_votes_submission on public.votes(submission_id);
create index idx_votes_voter on public.votes(voter_student_id);
create index idx_judge_scores_submission on public.judge_scores(submission_id);
create index idx_judge_scores_judge on public.judge_scores(judge_id);

-- Insert default competition settings
insert into public.competition_settings (id, submission_deadline, voting_deadline, video_size_limit_mb, judge_score_min, judge_score_max, winner_count, public_vote_weight, judge_score_weight)
values (1, '2026-06-07 20:30:00+05:30', '2026-06-08 08:30:00+05:30', 50, 1, 100, 3, 30, 70)
on conflict (id) do nothing;

-- Insert default themes
insert into public.themes (id, name, active) values
  ('theme-creative-ads', 'Creative Ads', true),
  ('theme-product-review', 'Product Review', true),
  ('theme-tech-showcase', 'Tech Showcase', true),
  ('theme-short-film', 'Short Film', true)
on conflict (id) do nothing;

-- RLS Policies (Configured for full access so client-side mutations work seamlessly)
create policy "Allow all settings" on public.competition_settings for all using (true) with check (true);
create policy "Allow all themes" on public.themes for all using (true) with check (true);
create policy "Allow all submissions" on public.submissions for all using (true) with check (true);
create policy "Allow all votes" on public.votes for all using (true) with check (true);
create policy "Allow all student_profiles" on public.student_profiles for all using (true) with check (true);
create policy "Allow all judges" on public.judges for all using (true) with check (true);
create policy "Allow all users" on public.users for all using (true) with check (true);
create policy "Allow all judge_scores" on public.judge_scores for all using (true) with check (true);
