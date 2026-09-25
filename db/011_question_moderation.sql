-- Run after 010. Archiving keeps content and votes for possible restoration.
alter table public.colleague_questions add column if not exists moderation_status text not null default 'published';
alter table public.colleague_answers add column if not exists moderation_status text not null default 'published';
alter table public.colleague_questions drop constraint if exists colleague_questions_moderation_status_check;
alter table public.colleague_questions add constraint colleague_questions_moderation_status_check check (moderation_status in ('published','archived'));
alter table public.colleague_answers drop constraint if exists colleague_answers_moderation_status_check;
alter table public.colleague_answers add constraint colleague_answers_moderation_status_check check (moderation_status in ('published','archived'));
create index if not exists colleague_questions_status_recent on public.colleague_questions(moderation_status,created_at desc);
create index if not exists colleague_answers_status_question on public.colleague_answers(moderation_status,question_id);

grant update(title,body,category,moderation_status) on public.colleague_questions to authenticated;
grant update(body,moderation_status) on public.colleague_answers to authenticated;
drop policy if exists colleague_questions_read on public.colleague_questions;
create policy colleague_questions_read on public.colleague_questions for select to anon,authenticated
  using (moderation_status='published' or public.is_community_moderator());
drop policy if exists colleague_answers_read on public.colleague_answers;
create policy colleague_answers_read on public.colleague_answers for select to anon,authenticated
  using (public.is_community_moderator() or
    (moderation_status='published' and exists
      (select 1 from public.colleague_questions q where q.id=question_id and q.moderation_status='published')));
create policy colleague_questions_moderate on public.colleague_questions for update to authenticated
  using (public.is_community_moderator()) with check (public.is_community_moderator());
create policy colleague_answers_moderate on public.colleague_answers for update to authenticated
  using (public.is_community_moderator()) with check (public.is_community_moderator());
drop policy if exists colleague_answers_insert on public.colleague_answers;
create policy colleague_answers_insert on public.colleague_answers for insert to authenticated
  with check (author_id=(select auth.uid()) and exists
    (select 1 from public.colleague_questions q where q.id=question_id and q.moderation_status='published'));
drop policy if exists colleague_votes_insert on public.colleague_helpful_votes;
create policy colleague_votes_insert on public.colleague_helpful_votes for insert to authenticated
  with check (voter_id=(select auth.uid()) and exists
    (select 1 from public.colleague_answers a join public.colleague_questions q on q.id=a.question_id
      where a.id=answer_id and a.author_id<>(select auth.uid())
        and a.moderation_status='published' and q.moderation_status='published'));

create or replace function public.get_helpful_counts(answer_ids uuid[])
returns table(answer_id uuid, vote_count bigint)
language sql stable security definer set search_path = '' as $$
  select v.answer_id,count(*) from public.colleague_helpful_votes v
  join public.colleague_answers a on a.id=v.answer_id
  join public.colleague_questions q on q.id=a.question_id
  where v.answer_id=any(answer_ids) and a.moderation_status='published' and q.moderation_status='published'
  group by v.answer_id;
$$;

create table if not exists public.colleague_moderation_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  entity_type text not null check (entity_type in ('question','answer')),
  entity_id uuid not null,
  before_values jsonb not null,
  after_values jsonb not null,
  changed_at timestamptz not null default now()
);
alter table public.colleague_moderation_audit enable row level security;
revoke all on public.colleague_moderation_audit from public,anon,authenticated;
create or replace function public.audit_colleague_moderation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.colleague_moderation_audit(actor_id,entity_type,entity_id,before_values,after_values)
  values ((select auth.uid()),tg_argv[0],new.id,to_jsonb(old),to_jsonb(new));
  return new;
end;
$$;
revoke all on function public.audit_colleague_moderation() from public,anon,authenticated;
drop trigger if exists on_colleague_question_moderation on public.colleague_questions;
create trigger on_colleague_question_moderation after update on public.colleague_questions
  for each row when ((old.title,old.body,old.category,old.moderation_status)
    is distinct from (new.title,new.body,new.category,new.moderation_status))
  execute function public.audit_colleague_moderation('question');
drop trigger if exists on_colleague_answer_moderation on public.colleague_answers;
create trigger on_colleague_answer_moderation after update on public.colleague_answers
  for each row when ((old.body,old.moderation_status) is distinct from (new.body,new.moderation_status))
  execute function public.audit_colleague_moderation('answer');
