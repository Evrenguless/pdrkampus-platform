-- Run after 009 in the new platform Supabase project.
create table if not exists public.colleague_questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 10 and 180),
  body text not null check (char_length(trim(body)) between 20 and 4000),
  category text not null check (category in ('İlkokul','Ortaokul','Lise','Kariyer','Psikolojik danışma','Sınıf rehberliği','Veli','Öğretmen','Özel eğitim','Ölçme-değerlendirme','Evrak','Mesleki gelişim','Dijital araçlar')),
  created_at timestamptz not null default now()
);
create index if not exists colleague_questions_recent on public.colleague_questions(created_at desc);
alter table public.colleague_questions enable row level security;
revoke all on public.colleague_questions from public,anon,authenticated;
grant select on public.colleague_questions to anon,authenticated;
grant insert on public.colleague_questions to authenticated;
create policy colleague_questions_read on public.colleague_questions for select to anon,authenticated using (true);
create policy colleague_questions_insert on public.colleague_questions for insert to authenticated with check (author_id=(select auth.uid()));

create table if not exists public.colleague_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.colleague_questions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (char_length(trim(body)) between 10 and 4000),
  created_at timestamptz not null default now(),
  unique (id,question_id)
);
create index if not exists colleague_answers_question on public.colleague_answers(question_id,created_at);
alter table public.colleague_answers enable row level security;
revoke all on public.colleague_answers from public,anon,authenticated;
grant select on public.colleague_answers to anon,authenticated;
grant insert on public.colleague_answers to authenticated;
create policy colleague_answers_read on public.colleague_answers for select to anon,authenticated using (true);
create policy colleague_answers_insert on public.colleague_answers for insert to authenticated with check (author_id=(select auth.uid()));

create table if not exists public.colleague_helpful_votes (
  answer_id uuid not null references public.colleague_answers(id) on delete cascade,
  voter_id uuid not null references auth.users(id) on delete cascade,
  primary key (answer_id,voter_id),
  created_at timestamptz not null default now()
);
alter table public.colleague_helpful_votes enable row level security;
revoke all on public.colleague_helpful_votes from public,anon,authenticated;
grant select on public.colleague_helpful_votes to anon,authenticated;
grant insert,delete on public.colleague_helpful_votes to authenticated;
create policy colleague_votes_read on public.colleague_helpful_votes for select to authenticated using (voter_id=(select auth.uid()));
create policy colleague_votes_insert on public.colleague_helpful_votes for insert to authenticated
  with check (voter_id=(select auth.uid()) and exists
    (select 1 from public.colleague_answers a where a.id=answer_id and a.author_id<>(select auth.uid())));
create policy colleague_votes_delete on public.colleague_helpful_votes for delete to authenticated using (voter_id=(select auth.uid()));

create or replace function public.get_helpful_counts(answer_ids uuid[])
returns table(answer_id uuid, vote_count bigint)
language sql stable security definer set search_path = '' as $$
  select v.answer_id,count(*) from public.colleague_helpful_votes v
  where v.answer_id=any(answer_ids) group by v.answer_id;
$$;
revoke all on function public.get_helpful_counts(uuid[]) from public;
grant execute on function public.get_helpful_counts(uuid[]) to anon,authenticated;
