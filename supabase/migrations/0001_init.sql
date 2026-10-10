-- mf-drops · migration 0001
-- The shape every later migration copies: a prefixed table, RLS on with select only,
-- and a SECURITY DEFINER function that checks the caller before writing.
-- Keep each statement under ~5 KB if it will ever go through the hosted SQL tool.

create table if not exists public.mf-drops_notes (
  id bigint generated always as identity primary key,
  body text not null check (length(body) between 1 and 2000),
  author uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.mf-drops_notes enable row level security;

create policy "mf-drops_notes_select" on public.mf-drops_notes
  for select to authenticated using (true);

create or replace function public.mf-drops_add_note(p_body text)
returns public.mf-drops_notes
language plpgsql security definer set search_path = public as $$
declare r public.mf-drops_notes;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  if p_body is null or length(trim(p_body)) = 0 then raise exception 'a note needs some text'; end if;
  insert into public.mf-drops_notes (body, author) values (trim(p_body), auth.uid()) returning * into r;
  return r;
end $$;

revoke all on function public.mf-drops_add_note(text) from public;
grant execute on function public.mf-drops_add_note(text) to authenticated;
