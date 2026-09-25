-- Run after 016 in the NEW platform project.
create table if not exists public.content_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id) on delete cascade,
 target_type text not null check (target_type in ('post','comment','question','answer','document')),
 target_id uuid not null,
 reason text not null check (reason in ('Kişisel veri','Spam','Uygunsuz içerik','Telif hakkı','Diğer')),
 details text not null default '' check (char_length(details)<=500),
 status text not null default 'open' check (status in ('open','resolved','dismissed')),
 reviewer_id uuid references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 unique(reporter_id,target_type,target_id),
 constraint content_report_review_check check
   ((status='open' and reviewer_id is null and reviewed_at is null) or
    (status in ('resolved','dismissed') and reviewer_id is not null and reviewed_at is not null))
);
create index if not exists content_reports_queue on public.content_reports(status,created_at desc);
alter table public.content_reports enable row level security;
revoke all on public.content_reports from public,anon,authenticated;
grant select,insert on public.content_reports to authenticated;
grant update(status,reviewer_id,reviewed_at) on public.content_reports to authenticated;
drop policy if exists content_reports_read on public.content_reports;
drop policy if exists content_reports_insert on public.content_reports;
drop policy if exists content_reports_moderate on public.content_reports;
create policy content_reports_read on public.content_reports for select to authenticated
 using (reporter_id=(select auth.uid()) or public.is_community_moderator());
create policy content_reports_insert on public.content_reports for insert to authenticated
 with check (reporter_id=(select auth.uid()) and status='open' and reviewer_id is null and reviewed_at is null and (
  (target_type='post' and exists(select 1 from public.community_posts p where p.id=target_id and p.status='published')) or
  (target_type='comment' and exists(select 1 from public.community_comments c where c.id=target_id and c.status='published')) or
  (target_type='question' and exists(select 1 from public.colleague_questions q where q.id=target_id and q.moderation_status='published')) or
  (target_type='answer' and exists(select 1 from public.colleague_answers a where a.id=target_id and a.moderation_status='published')) or
  (target_type='document' and exists(select 1 from public.community_documents d where d.id=target_id and d.review_status='approved'))
 ));
create policy content_reports_moderate on public.content_reports for update to authenticated
 using (public.is_community_moderator()) with check (public.is_community_moderator());
