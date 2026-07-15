-- Run this in Supabase: SQL Editor → New query → paste → Run

create table if not exists products (
  id bigint generated always as identity primary key,
  name text not null,
  price numeric(10, 2) not null,
  created_at timestamptz default now()
);

alter table products enable row level security;

create policy "Anyone can read products"
  on products
  for select
  using (true);

insert into products (name, price) values
  ('Coffee', 3.50),
  ('Sandwich', 8.99),
  ('Cookie', 2.00);
