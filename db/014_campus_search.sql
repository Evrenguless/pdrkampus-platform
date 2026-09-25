-- Run after 013. Public search returns only published content and limited excerpts.
alter table public.community_posts add column if not exists school_level text
  check (school_level in ('Okul öncesi','İlkokul','Ortaokul','Lise'));
alter table public.community_posts add column if not exists topic_tag text
  check (topic_tag in ('Akran zorbalığı','Sınav kaygısı','Devamsızlık','Motivasyon','Kariyer','Ergenlik','İletişim','Duygu yönetimi','Bağımlılık','Dijital güvenlik','Özel eğitim','Diğer'));
alter table public.colleague_questions add column if not exists school_level text
  check (school_level in ('Okul öncesi','İlkokul','Ortaokul','Lise'));
alter table public.colleague_questions add column if not exists topic_tag text
  check (topic_tag in ('Akran zorbalığı','Sınav kaygısı','Devamsızlık','Motivasyon','Kariyer','Ergenlik','İletişim','Duygu yönetimi','Bağımlılık','Dijital güvenlik','Özel eğitim','Diğer'));
update public.community_posts set school_level=category
  where school_level is null and category in ('İlkokul','Ortaokul','Lise');
update public.colleague_questions set school_level=category
  where school_level is null and category in ('İlkokul','Ortaokul','Lise');
grant update(school_level,topic_tag) on public.community_posts to authenticated;
grant update(school_level,topic_tag) on public.colleague_questions to authenticated;

create or replace function public.normalize_campus_search(value text)
returns text language sql immutable parallel safe set search_path = '' as $$
 select translate(lower(coalesce(value,'')), 'çğıöşü', 'cgiosu');
$$;
revoke all on function public.normalize_campus_search(text) from public;
grant execute on function public.normalize_campus_search(text) to anon,authenticated;

create index if not exists campus_docs_search_idx on public.community_documents using gin
 (to_tsvector('pg_catalog.simple'::regconfig,public.normalize_campus_search(title||' '||topic||' '||document_type||' '||level)));
create index if not exists campus_posts_search_idx on public.community_posts using gin
 (to_tsvector('pg_catalog.simple'::regconfig,public.normalize_campus_search(title||' '||body||' '||category||' '||coalesce(topic_tag,'')||' '||coalesce(school_level,''))));
create index if not exists campus_questions_search_idx on public.colleague_questions using gin
 (to_tsvector('pg_catalog.simple'::regconfig,public.normalize_campus_search(title||' '||body||' '||category||' '||coalesce(topic_tag,'')||' '||coalesce(school_level,''))));

create or replace function public.search_campus(
 p_query text,p_level text default null,p_topic text default null,p_per_kind_limit integer default 8
)
returns table(resource_type text,resource_id uuid,title text,excerpt text,category text,
 school_level text,topic text,created_at timestamptz,relevance integer,match_count bigint)
language sql stable security invoker set search_path = '' as $$
with terms as (
 select array_agg(w) as words from (
   select distinct w from unnest(regexp_split_to_array(public.normalize_campus_search(left(trim(p_query),160)),'[^a-z0-9]+')) w
   where char_length(w)>2 and w not in ('sinif','sinifta','sinifi','icin','ile','bir','ve','suphesi','suphe','ogrenci','ogrencide','hakkinda','okul','oncesi','ne','yapmaliyim')
   limit 12
 ) t
), query_terms as (
 select words,to_tsquery('pg_catalog.simple'::regconfig,array_to_string(words,' | ')) as tsq from terms where cardinality(words)>0
), records as (
 select 'document'::text as kind,d.id,d.title,d.topic as body,d.document_type as category,d.level,
        d.topic,d.created_at,
        public.normalize_campus_search(d.title) as normalized_title,
        public.normalize_campus_search(d.title||' '||d.topic||' '||d.document_type||' '||d.level) as searchable
 from public.community_documents d cross join query_terms t
 where d.review_status='approved' and
   to_tsvector('pg_catalog.simple'::regconfig,public.normalize_campus_search(d.title||' '||d.topic||' '||d.document_type||' '||d.level)) @@ t.tsq
 union all
 select 'post',p.id,p.title,p.body,p.category,p.school_level,p.topic_tag,p.created_at,
        public.normalize_campus_search(p.title),
        public.normalize_campus_search(p.title||' '||p.body||' '||p.category||' '||coalesce(p.topic_tag,'')||' '||coalesce(p.school_level,''))
 from public.community_posts p cross join query_terms t
 where p.status='published' and
   to_tsvector('pg_catalog.simple'::regconfig,public.normalize_campus_search(p.title||' '||p.body||' '||p.category||' '||coalesce(p.topic_tag,'')||' '||coalesce(p.school_level,''))) @@ t.tsq
 union all
 select 'question',q.id,q.title,q.body,q.category,q.school_level,q.topic_tag,q.created_at,
        public.normalize_campus_search(q.title),
        public.normalize_campus_search(q.title||' '||q.body||' '||q.category||' '||coalesce(q.topic_tag,'')||' '||coalesce(q.school_level,''))
 from public.colleague_questions q cross join query_terms t
 where q.moderation_status='published' and
   to_tsvector('pg_catalog.simple'::regconfig,public.normalize_campus_search(q.title||' '||q.body||' '||q.category||' '||coalesce(q.topic_tag,'')||' '||coalesce(q.school_level,''))) @@ t.tsq
), matches as (
 select r.*,(
   (select count(*) from unnest(t.words) w where r.normalized_title like '%'||w||'%')*6 +
   (select count(*) from unnest(t.words) w where r.searchable like '%'||w||'%')*2 +
   case when p_topic is not null and public.normalize_campus_search(coalesce(r.topic,''))=public.normalize_campus_search(p_topic) then 9 else 0 end +
   case when p_level is not null and r.level=p_level then 3 else 0 end
 )::integer as score
 from records r cross join query_terms t
 where (p_level is null or r.level is null or r.level in (p_level,'Tüm kademeler','Belirtilmiyor'))
), ranked as (
 select m.*,count(*) over(partition by kind) as total,
 row_number() over(partition by kind order by score desc,created_at desc,id) as rn from matches m
)
select r.kind,r.id,r.title,left(r.body,220),r.category,r.level,r.topic,r.created_at,r.score,r.total
from ranked r where r.rn<=least(greatest(p_per_kind_limit,1),12)
order by case r.kind when 'document' then 1 when 'question' then 2 else 3 end,r.score desc,r.created_at desc;
$$;
revoke all on function public.search_campus(text,text,text,integer) from public;
grant execute on function public.search_campus(text,text,text,integer) to anon,authenticated;

-- The existing private moderation log also records topic/level corrections.
drop trigger if exists on_colleague_question_moderation on public.colleague_questions;
create trigger on_colleague_question_moderation after update on public.colleague_questions
 for each row when ((old.title,old.body,old.category,old.school_level,old.topic_tag,old.moderation_status)
   is distinct from (new.title,new.body,new.category,new.school_level,new.topic_tag,new.moderation_status))
 execute function public.audit_colleague_moderation('question');
drop trigger if exists on_community_post_update on public.community_posts;
create trigger on_community_post_update after update on public.community_posts
 for each row when ((old.title,old.body,old.category,old.school_level,old.topic_tag,old.status)
   is distinct from (new.title,new.body,new.category,new.school_level,new.topic_tag,new.status))
 execute function public.audit_community_feed('post');
