-- Run after 015 in the NEW platform Supabase project.
-- Existing posts/comments/documents are not backfilled; notifications start with new events.
create table if not exists public.notifications (
 id bigint generated always as identity primary key,
 recipient_id uuid not null references auth.users(id) on delete cascade,
 actor_id uuid references auth.users(id) on delete set null,
 kind text not null check (kind in ('question_answer','post_comment','document_approved','document_rejected','document_archived')),
 target_id uuid not null,
 created_at timestamptz not null default now(),
 read_at timestamptz
);
create index if not exists notifications_recipient_recent on public.notifications(recipient_id,created_at desc);
alter table public.notifications enable row level security;
revoke all on public.notifications from public,anon,authenticated;
grant select on public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;
drop policy if exists notifications_read_own on public.notifications;
drop policy if exists notifications_mark_own on public.notifications;
create policy notifications_read_own on public.notifications for select to authenticated
 using (recipient_id=(select auth.uid()));
create policy notifications_mark_own on public.notifications for update to authenticated
 using (recipient_id=(select auth.uid())) with check (recipient_id=(select auth.uid()));

create or replace function public.notify_colleague_answer()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner_id uuid;
begin
 select q.author_id into owner_id from public.colleague_questions q where q.id=new.question_id;
 if owner_id is not null and owner_id<>new.author_id then
  insert into public.notifications(recipient_id,actor_id,kind,target_id)
  values (owner_id,new.author_id,'question_answer',new.question_id);
 end if;
 return new;
end;
$$;
revoke all on function public.notify_colleague_answer() from public,anon,authenticated;
drop trigger if exists on_colleague_answer_notification on public.colleague_answers;
create trigger on_colleague_answer_notification after insert on public.colleague_answers
 for each row execute function public.notify_colleague_answer();

create or replace function public.notify_community_comment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner_id uuid;
begin
 select p.author_id into owner_id from public.community_posts p where p.id=new.post_id;
 if owner_id is not null and owner_id<>new.author_id then
  insert into public.notifications(recipient_id,actor_id,kind,target_id)
  values (owner_id,new.author_id,'post_comment',new.post_id);
 end if;
 return new;
end;
$$;
revoke all on function public.notify_community_comment() from public,anon,authenticated;
drop trigger if exists on_community_comment_notification on public.community_comments;
create trigger on_community_comment_notification after insert on public.community_comments
 for each row execute function public.notify_community_comment();

create or replace function public.notify_document_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if old.review_status is distinct from new.review_status and new.review_status in ('approved','rejected','archived') then
  insert into public.notifications(recipient_id,actor_id,kind,target_id)
  values (new.uploader_id,new.reviewer_id,'document_'||new.review_status,new.id);
 end if;
 return new;
end;
$$;
revoke all on function public.notify_document_review() from public,anon,authenticated;
drop trigger if exists on_document_review_notification on public.community_documents;
create trigger on_document_review_notification after update of review_status on public.community_documents
 for each row execute function public.notify_document_review();
