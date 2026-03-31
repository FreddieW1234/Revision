-- Subjects (e.g. Maths, Economics, Accounting)
create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Topics within a subject
create table topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete cascade not null,
  name text not null,
  status text not null default 'Not Started'
    check (status in ('Not Started', 'In Progress', 'Confident')),
  created_at timestamptz default now()
);

-- Past papers for a subject
create table past_papers (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete cascade not null,
  name text not null,
  score text,
  note text,
  completed_at date,
  created_at timestamptz default now()
);

-- Study sessions
create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete cascade not null,
  duration_minutes integer not null check (duration_minutes > 0),
  note text,
  created_at timestamptz default now()
);

-- Exams
create table exams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  exam_date date not null,
  exam_time time,
  duration_minutes integer,
  note text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (allow all for anon key — no auth required)
alter table subjects enable row level security;
alter table topics enable row level security;
alter table study_sessions enable row level security;
alter table past_papers enable row level security;
alter table exams enable row level security;

create policy "Allow all on subjects" on subjects for all using (true) with check (true);
create policy "Allow all on topics" on topics for all using (true) with check (true);
create policy "Allow all on study_sessions" on study_sessions for all using (true) with check (true);
create policy "Allow all on past_papers" on past_papers for all using (true) with check (true);
create policy "Allow all on exams" on exams for all using (true) with check (true);
