-- Apply after 014. All meaningful query terms must occur in the published record.
-- This is a new RPC: the website falls back to 014 until this migration is applied.
-- Existing indexes and moderation policies stay in place. Safe to run again.
create or replace function public.search_campus_precise(
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
 select words,to_tsquery('pg_catalog.simple'::regconfig,array_to_string(words,' & ')) as tsq from terms where cardinality(words)>0
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

revoke all on function public.search_campus_precise(text,text,text,integer) from public;
grant execute on function public.search_campus_precise(text,text,text,integer) to anon,authenticated;
