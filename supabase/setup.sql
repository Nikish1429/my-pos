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

-- Insert 30 products with realistic Indian Rupee (INR) prices
insert into products (name, category, price, stock_quantity) values
  ('Espresso', 'Drinks', 120.00, 100),
  ('Cappuccino', 'Drinks', 180.00, 80),
  ('Latte', 'Drinks', 190.00, 85),
  ('Americano', 'Drinks', 140.00, 120),
  ('Iced Tea', 'Drinks', 130.00, 90),
  ('Lemonade', 'Drinks', 110.00, 75),
  ('Hot Chocolate', 'Drinks', 220.00, 50),
  ('Masala Chai', 'Drinks', 50.00, 200),
  ('Filter Coffee', 'Drinks', 60.00, 150),
  ('Croissant', 'Bakery', 120.00, 40),
  ('Chocolate Muffin', 'Bakery', 140.00, 35),
  ('Blueberry Scone', 'Bakery', 150.00, 30),
  ('Bagel with Cream Cheese', 'Bakery', 160.00, 25),
  ('Chocolate Chip Cookie', 'Bakery', 80.00, 60),
  ('Brownie', 'Bakery', 120.00, 45),
  ('Apple Danish', 'Bakery', 150.00, 20),
  ('Gulab Jamun (2 pcs)', 'Bakery', 70.00, 50),
  ('Kaju Katli (4 pcs)', 'Bakery', 120.00, 40),
  ('Club Sandwich', 'Snacks', 280.00, 20),
  ('Chicken Wrap', 'Snacks', 240.00, 25),
  ('Caprese Panini', 'Snacks', 320.00, 15),
  ('Potato Chips', 'Snacks', 60.00, 100),
  ('Pretzels', 'Snacks', 80.00, 80),
  ('Mixed Nuts', 'Snacks', 180.00, 50),
  ('Popcorn', 'Snacks', 90.00, 60),
  ('Fruit Salad', 'Snacks', 150.00, 15),
  ('Granola Bar', 'Snacks', 50.00, 90),
  ('Greek Yogurt', 'Snacks', 120.00, 40),
  ('Samosa (2 pcs)', 'Snacks', 40.00, 120),
  ('Paneer Puff', 'Snacks', 60.00, 80);

-- Insert 30 customers (Indian Names & Chennai Places)
insert into customers (name, phone, region) values
  ('Aarav Sharma', '98100-12345', 'Adyar'),
  ('Aditya Patel', '98200-23456', 'T. Nagar'),
  ('Vihaan Gupta', '98300-34567', 'Velachery'),
  ('Diya Iyer', '98400-45678', 'Mylapore'),
  ('Ananya Reddy', '98500-56789', 'Anna Nagar'),
  ('Rahul Verma', '98600-67890', 'Adyar'),
  ('Priya Nair', '98700-78901', 'Velachery'),
  ('Amit Singh', '98800-89012', 'T. Nagar'),
  ('Rajesh Gupta', '98900-90123', 'Mylapore'),
  ('Siddharth Malhotra', '98000-01234', 'Anna Nagar'),
  ('Neha Sharma', '98111-12345', 'Adyar'),
  ('Vikram Rao', '98222-23456', 'Velachery'),
  ('Sneha Iyer', '98333-34567', 'Mylapore'),
  ('Kabir Bose', '98444-45678', 'T. Nagar'),
  ('Rohan Deshmukh', '98555-56789', 'Anna Nagar'),
  ('Anjali Desai', '98666-67890', 'Adyar'),
  ('Karan Johar', '98777-78901', 'T. Nagar'),
  ('Divya Dutta', '98888-89012', 'Velachery'),
  ('Varun Dhawan', '98999-90123', 'Mylapore'),
  ('Alia Bhatt', '98000-11111', 'Anna Nagar'),
  ('Ranbir Kapoor', '98111-22222', 'Adyar'),
  ('Deepika Padukone', '98222-33333', 'Velachery'),
  ('Ranveer Singh', '98333-44444', 'T. Nagar'),
  ('Katrina Kaif', '98444-55555', 'Mylapore'),
  ('Vicky Kaushal', '98555-66666', 'Anna Nagar'),
  ('Kiara Advani', '98666-77777', 'Adyar'),
  ('Sidharth Malhotra', '98777-88888', 'T. Nagar'),
  ('Kriti Sanon', '98888-99999', 'Velachery'),
  ('Ayushmann Khurrana', '98999-00000', 'Mylapore'),
  ('Kartik Aaryan', '98000-22222', 'Anna Nagar');

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
