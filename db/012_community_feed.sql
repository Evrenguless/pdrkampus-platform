-- Run after 011 in the new platform Supabase project.
create table if not exists public.community_posts (
 id uuid primary key default gen_random_uuid(), author_id uuid not null references auth.users(id) on delete restrict,
 title text not null check (char_length(trim(title)) between 5 and 180),
 body text not null check (char_length(trim(body)) between 10 and 4000),
 category text not null check (category in ('İlkokul','Ortaokul','Lise','Kariyer','Psikolojik danışma','Sınıf rehberliği','Veli','Öğretmen','Özel eğitim','Ölçme-değerlendirme','Evrak','Mesleki gelişim','Dijital araçlar')),
 status text not null default 'published' check (status in ('published','archived')),
 created_at timestamptz not null default now()
);
create index if not exists community_posts_status_recent on public.community_posts(status,created_at desc);
alter table public.community_posts enable row level security;
revoke all on public.community_posts from public,anon,authenticated;
grant select on public.community_posts to anon,authenticated;
grant insert on public.community_posts to authenticated;
grant update(title,body,category,status) on public.community_posts to authenticated;
create policy community_posts_read on public.community_posts for select to anon,authenticated using (status='published' or public.is_community_moderator());
create policy community_posts_insert on public.community_posts for insert to authenticated with check (author_id=(select auth.uid()) and status='published');
create policy community_posts_moderate on public.community_posts for update to authenticated using (public.is_community_moderator()) with check (public.is_community_moderator());

create table if not exists public.community_comments (
 id uuid primary key default gen_random_uuid(),post_id uuid not null references public.community_posts(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete restrict,
 body text not null check (char_length(trim(body)) between 2 and 2000),
 status text not null default 'published' check (status in ('published','archived')),
 created_at timestamptz not null default now()
);
create index if not exists community_comments_post_recent on public.community_comments(post_id,created_at);
alter table public.community_comments enable row level security;
revoke all on public.community_comments from public,anon,authenticated;
grant select on public.community_comments to anon,authenticated;
grant insert on public.community_comments to authenticated;
grant update(body,status) on public.community_comments to authenticated;
create policy community_comments_read on public.community_comments for select to anon,authenticated using
 (public.is_community_moderator() or (status='published' and exists
   (select 1 from public.community_posts p where p.id=post_id and p.status='published')));
create policy community_comments_insert on public.community_comments for insert to authenticated with check
 (author_id=(select auth.uid()) and status='published' and exists
   (select 1 from public.community_posts p where p.id=post_id and p.status='published'));
create policy community_comments_moderate on public.community_comments for update to authenticated using (public.is_community_moderator()) with check (public.is_community_moderator());

create table if not exists public.community_reactions (
 post_id uuid not null references public.community_posts(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in ('like','save')),
 primary key(post_id,user_id,kind)
);
alter table public.community_reactions enable row level security;
revoke all on public.community_reactions from public,anon,authenticated;
grant select,insert,delete on public.community_reactions to authenticated;
create policy community_reactions_own on public.community_reactions for select to authenticated using (user_id=(select auth.uid()));
create policy community_reactions_insert on public.community_reactions for insert to authenticated with check
 (user_id=(select auth.uid()) and exists (select 1 from public.community_posts p where p.id=post_id and p.status='published'));
create policy community_reactions_delete on public.community_reactions for delete to authenticated using (user_id=(select auth.uid()));

create or replace function public.get_community_like_counts(post_ids uuid[])
returns table(post_id uuid, like_count bigint)
language sql stable security definer set search_path = '' as $$
 select r.post_id,count(*) from public.community_reactions r join public.community_posts p on p.id=r.post_id
 where r.post_id=any(post_ids) and r.kind='like' and p.status='published' group by r.post_id;
$$;
revoke all on function public.get_community_like_counts(uuid[]) from public;
grant execute on function public.get_community_like_counts(uuid[]) to anon,authenticated;

create table if not exists public.community_feed_audit (
 id bigint generated always as identity primary key, actor_id uuid references auth.users(id),
 entity_type text not null check (entity_type in ('post','comment')),
 entity_id uuid not null, before_values jsonb not null,after_values jsonb not null,
 changed_at timestamptz not null default now()
);
alter table public.community_feed_audit enable row level security;
revoke all on public.community_feed_audit from public,anon,authenticated;
create or replace function public.audit_community_feed()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.community_feed_audit(actor_id,entity_type,entity_id,before_values,after_values)
 values ((select auth.uid()),tg_argv[0],new.id,to_jsonb(old),to_jsonb(new));
 return new;
end;
$$;
revoke all on function public.audit_community_feed() from public,anon,authenticated;
create trigger on_community_post_update after update on public.community_posts
 for each row when ((old.title,old.body,old.category,old.status) is distinct from (new.title,new.body,new.category,new.status))
 execute function public.audit_community_feed('post');
create trigger on_community_comment_update after update on public.community_comments
 for each row when ((old.body,old.status) is distinct from (new.body,new.status))
 execute function public.audit_community_feed('comment');
