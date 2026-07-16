-- Drop tables if they exist (clean slate)
drop table if exists sale_items cascade;
drop table if exists sales cascade;
drop table if exists customers cascade;
drop table if exists products cascade;
drop table if exists users cascade;

-- 1. Create users table
create table users (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'cashier')),
  created_at timestamptz default now()
);

-- 2. Create products table
create table products (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null,
  price numeric(10, 2) not null,
  stock_quantity integer not null default 0,
  created_at timestamptz default now()
);

-- 3. Create customers table
create table customers (
  id bigint generated always as identity primary key,
  name text not null,
  phone text,
  region text not null,
  created_at timestamptz default now()
);

-- 4. Create sales table
create table sales (
  id bigint generated always as identity primary key,
  customer_id bigint references customers(id) on delete set null,
  user_id bigint references users(id) on delete set null,
  total_amount numeric(10, 2) not null default 0,
  sale_date timestamptz default now()
);

-- 5. Create sale_items table
create table sale_items (
  id bigint generated always as identity primary key,
  sale_id bigint references sales(id) on delete cascade,
  product_id bigint references products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null
);

-- Enable RLS (Row Level Security) on all tables
alter table users enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;

-- Create select/insert/update policies for anonymous access (simulating seeded/app usage)
create policy "Allow public read" on users for select using (true);
create policy "Allow public read" on products for select using (true);
create policy "Allow public read" on customers for select using (true);
create policy "Allow public read" on sales for select using (true);
create policy "Allow public read" on sale_items for select using (true);

create policy "Allow public write" on users for insert with check (true);
create policy "Allow public write" on products for insert with check (true);
create policy "Allow public write" on customers for insert with check (true);
create policy "Allow public write" on sales for insert with check (true);
create policy "Allow public write" on sale_items for insert with check (true);

create policy "Allow public update" on products for update using (true);

-- Insert 10 users (Admins + Cashiers)
insert into users (name, email, role) values
  ('Alice Smith', 'alice@mypos.com', 'admin'),
  ('Bob Jones', 'bob@mypos.com', 'admin'),
  ('Charlie Brown', 'charlie@mypos.com', 'cashier'),
  ('David Miller', 'david@mypos.com', 'cashier'),
  ('Emma Wilson', 'emma@mypos.com', 'cashier'),
  ('Frank Taylor', 'frank@mypos.com', 'cashier'),
  ('Grace Thomas', 'grace@mypos.com', 'cashier'),
  ('Henry Anderson', 'henry@mypos.com', 'cashier'),
  ('Ivy Jackson', 'ivy@mypos.com', 'cashier'),
  ('Jack White', 'jack@mypos.com', 'cashier');

-- Insert 24 products
insert into products (name, category, price, stock_quantity) values
  ('Espresso', 'Drinks', 2.50, 100),
  ('Cappuccino', 'Drinks', 3.75, 80),
  ('Latte', 'Drinks', 4.00, 85),
  ('Americano', 'Drinks', 3.00, 120),
  ('Iced Tea', 'Drinks', 3.25, 90),
  ('Lemonade', 'Drinks', 3.50, 75),
  ('Hot Chocolate', 'Drinks', 4.25, 50),
  ('Croissant', 'Bakery', 2.75, 40),
  ('Chocolate Muffin', 'Bakery', 3.00, 35),
  ('Blueberry Scone', 'Bakery', 3.25, 30),
  ('Bagel with Cream Cheese', 'Bakery', 3.50, 25),
  ('Chocolate Chip Cookie', 'Bakery', 2.00, 60),
  ('Brownie', 'Bakery', 2.50, 45),
  ('Apple Danish', 'Bakery', 3.25, 20),
  ('Club Sandwich', 'Snacks', 7.50, 20),
  ('Chicken Wrap', 'Snacks', 6.99, 25),
  ('Caprese Panini', 'Snacks', 8.25, 15),
  ('Potato Chips', 'Snacks', 1.75, 100),
  ('Pretzels', 'Snacks', 2.00, 80),
  ('Mixed Nuts', 'Snacks', 3.50, 50),
  ('Popcorn', 'Snacks', 2.25, 60),
  ('Fruit Salad', 'Snacks', 4.50, 15),
  ('Granola Bar', 'Snacks', 1.50, 90),
  ('Greek Yogurt', 'Snacks', 2.75, 40);

-- Insert 30 customers
insert into customers (name, phone, region) values
  ('John Doe', '555-0101', 'North'),
  ('Jane Smith', '555-0102', 'North'),
  ('Michael Johnson', '555-0103', 'South'),
  ('Emily Davis', '555-0104', 'South'),
  ('James Wilson', '555-0105', 'East'),
  ('Sarah Martinez', '555-0106', 'East'),
  ('Robert Anderson', '555-0107', 'West'),
  ('Jessica Taylor', '555-0108', 'West'),
  ('William Thomas', '555-0109', 'Central'),
  ('Karen White', '555-0110', 'Central'),
  ('Richard Harris', '555-0111', 'North'),
  ('Susan Martin', '555-0112', 'South'),
  ('Joseph Thompson', '555-0113', 'East'),
  ('Thomas Garcia', '555-0114', 'West'),
  ('Nancy Robinson', '555-0115', 'Central'),
  ('Charles Clark', '555-0116', 'North'),
  ('Sandra Lewis', '555-0117', 'South'),
  ('Matthew Lee', '555-0118', 'East'),
  ('Dorothy Walker', '555-0119', 'West'),
  ('Andrew Hall', '555-0120', 'Central'),
  ('Lisa Allen', '555-0121', 'North'),
  ('Paul Young', '555-0122', 'South'),
  ('Donna King', '555-0123', 'East'),
  ('Steven Wright', '555-0124', 'West'),
  ('Betty Lopez', '555-0125', 'Central'),
  ('Daniel Hill', '555-0126', 'North'),
  ('Margaret Scott', '555-0127', 'South'),
  ('Kenneth Green', '555-0128', 'East'),
  ('Ruth Adams', '555-0129', 'West'),
  ('Joshua Baker', '555-0130', 'Central');

-- Generate 400 sales dynamically over the last 6 months
do $$
declare
  v_sale_id bigint;
  v_customer_id bigint;
  v_user_id bigint;
  v_product_id bigint;
  v_quantity integer;
  v_price numeric(10, 2);
  v_sale_date timestamptz;
  v_items_count integer;
  v_total numeric(10, 2);
begin
  for i in 1..400 loop
    -- Random customer (80% chance of registered customer, 20% anonymous walk-in)
    if random() < 0.8 then
      select id into v_customer_id from customers order by random() limit 1;
    else
      v_customer_id := null;
    end if;
    
    -- Random cashier or admin who checked out the sale
    select id into v_user_id from users order by random() limit 1;
    
    -- Random date in the last 6 months (180 days)
    v_sale_date := now() - (random() * interval '180 days');
    
    -- Insert base sale record
    insert into sales (customer_id, user_id, total_amount, sale_date)
    values (v_customer_id, v_user_id, 0, v_sale_date)
    returning id into v_sale_id;
    
    -- Generate 1 to 4 line items per receipt
    v_items_count := floor(random() * 4) + 1;
    v_total := 0;
    
    for j in 1..v_items_count loop
      select id, price into v_product_id, v_price from products order by random() limit 1;
      v_quantity := floor(random() * 3) + 1; -- 1 to 3 items of this product
      
      -- Avoid inserting duplicate items of same product in the same sale receipt
      if not exists (select 1 from sale_items where sale_id = v_sale_id and product_id = v_product_id) then
        insert into sale_items (sale_id, product_id, quantity, unit_price)
        values (v_sale_id, v_product_id, v_quantity, v_price);
        
        v_total := v_total + (v_quantity * v_price);
      end if;
    end loop;
    
    -- Update the final total_amount for the sale
    update sales set total_amount = v_total where id = v_sale_id;
  end loop;
end $$;
