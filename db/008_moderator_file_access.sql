-- Apply after 007_community_documents.sql in the NEW platform project.
-- Allows only users listed in public.community_moderators to inspect pending files.
drop policy if exists community_files_moderator_read on storage.objects;
create policy community_files_moderator_read on storage.objects for select to authenticated
using (bucket_id='community-documents' and public.is_community_moderator());

-- Assign the site owner once in SQL Editor, replacing ACCOUNT_UUID with the UUID from Authentication > Users:
-- insert into public.community_moderators(user_id) values ('ACCOUNT_UUID') on conflict do nothing;
