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
  voter_student_id uuid references public.student_profiles(id) on delete cascade unique,
  submission_id uuid references public.submissions(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
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

-- Trigger to create a public.users row on auth.users sign up
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_role text;
begin
  -- Role metadata is passed in user_metadata during sign up
  user_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  
  insert into public.users (id, email, role)
  values (new.id, new.email, user_role);
  
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

-- RLS Policies (Example setup - in real env, configure specific SELECT/INSERT/UPDATE rules)
-- For simplicity, let public read settings, themes, submissions, and vote counts.
create policy "Allow public select settings" on public.competition_settings for select using (true);
create policy "Allow public select themes" on public.themes for select using (true);
create policy "Allow public select submissions" on public.submissions for select using (true);
create policy "Allow public select votes" on public.votes for select using (true);
create policy "Allow public select student_profiles" on public.student_profiles for select using (true);
create policy "Allow public select judges" on public.judges for select using (true);
create policy "Allow public select users" on public.users for select using (true);
