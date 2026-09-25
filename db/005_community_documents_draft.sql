-- FUTURE DRAFT. Do not apply until accounts, storage, moderation, and rights review exist.
-- Official MEB records remain in their existing catalogues; user submissions can never be marked official here.
create table if not exists public.community_documents (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (length(trim(title)) between 5 and 180),
  description text not null default '',
  document_type text not null check (document_type in ('Sunum','Etkinlik','Çalışma kağıdı','Veli materyali','Öğretmen materyali','Diğer')),
  level text not null check (level in ('Okul öncesi','İlkokul','Ortaokul','Lise','Tüm kademeler')),
  topic text not null,
  file_storage_key text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('application/pdf','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  size_bytes bigint not null check (size_bytes between 1 and 20971520),
  rights_confirmed boolean not null check (rights_confirmed),
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected','withdrawn')),
  reviewer_id uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_documents_review_idx on public.community_documents(review_status,created_at desc);
alter table public.community_documents enable row level security;
-- No policies deliberately: anon/authenticated users cannot read or write this draft table.
-- Before launch, add owner/moderator policies, private storage policies, validation/scanning,
-- an audited approval operation, and an explicit publication view for approved records.
