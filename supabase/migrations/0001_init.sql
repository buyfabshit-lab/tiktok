-- mf-drops · migration 0001
-- A public bucket for the files, one table for the rows. Anyone may read and add;
-- only a signed-in owner may take down. Every write goes through a checked function.
-- Keep each statement under ~5 KB if it ever goes through the hosted SQL tool.

create table if not exists public.mf_drops (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('image', 'video')),
  title text not null default '' check (length(title) <= 140),
  by text not null check (length(by) between 1 and 40),
  path text not null unique,
  bytes bigint not null check (bytes > 0 and bytes <= 524288000),
  mime text not null check (mime like 'image/%' or mime like 'video/%'),
  created_at timestamptz not null default now()
);

alter table public.mf_drops enable row level security;

create policy "mf_drops_read_all" on public.mf_drops
  for select to anon, authenticated using (true);

-- anyone can add a row, but only through the function, which checks the shape
create or replace function public.mf_add_drop(p_kind text, p_title text, p_by text, p_path text, p_bytes bigint, p_mime text)
returns public.mf_drops
language plpgsql security definer set search_path = public as $$
declare r public.mf_drops;
begin
  if p_kind not in ('image', 'video') then raise exception 'pictures and videos only'; end if;
  if p_by is null or length(trim(p_by)) = 0 then raise exception 'put a name on it'; end if;
  if p_path !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}/[a-z0-9-]+[a-z0-9.-]*$' then raise exception 'bad path'; end if;
  insert into public.mf_drops (kind, title, by, path, bytes, mime)
  values (p_kind, coalesce(trim(p_title), ''), trim(p_by), p_path, p_bytes, p_mime) returning * into r;
  return r;
end $$;

revoke all on function public.mf_add_drop(text, text, text, text, bigint, text) from public;
grant execute on function public.mf_add_drop(text, text, text, text, bigint, text) to anon, authenticated;

-- only a signed-in user (sign-ups are off, so that is the owner) may take a drop down
create or replace function public.mf_take_down(p_id bigint)
returns text
language plpgsql security definer set search_path = public as $$
declare p text;
begin
  if auth.uid() is null then raise exception 'only the owner can take a drop down'; end if;
  delete from public.mf_drops where id = p_id returning path into p;
  return p;
end $$;

revoke all on function public.mf_take_down(bigint) from public;
grant execute on function public.mf_take_down(bigint) to authenticated;

-- the bucket: public read, 500 MB per file, pictures and videos only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('drops', 'drops', true, 524288000, array['image/png','image/jpeg','image/gif','image/webp','video/mp4','video/quicktime','video/webm'])
on conflict (id) do update set public = true, file_size_limit = 524288000, allowed_mime_types = excluded.allowed_mime_types;

create policy "drops_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'drops');

create policy "drops_anyone_uploads" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'drops');

create policy "drops_owner_removes" on storage.objects
  for delete to authenticated using (bucket_id = 'drops');
