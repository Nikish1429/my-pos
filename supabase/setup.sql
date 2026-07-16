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
  barcode text unique,
  created_at timestamptz default now()
);

-- 3. Create customers table
create table customers (
  id bigint generated always as identity primary key,
  name text not null,
  phone text,
  address text not null,
  is_value_member boolean not null default false,
  purchases_count integer not null default 0,
  created_at timestamptz default now()
);

-- 4. Create sales table
create table sales (
  id bigint generated always as identity primary key,
  customer_id bigint references customers(id) on delete set null,
  user_id bigint references users(id) on delete set null,
  total_amount numeric(10, 2) not null default 0,
  discount_amount numeric(10, 2) not null default 0,
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
  ('Admin User', 'admin@mypos.com', 'admin'),
  ('Bob Jones', 'bob@mypos.com', 'admin'),
  ('Cashier User', 'cashier@mypos.com', 'cashier'),
  ('David Miller', 'david@mypos.com', 'cashier'),
  ('Emma Wilson', 'emma@mypos.com', 'cashier'),
  ('Frank Taylor', 'frank@mypos.com', 'cashier'),
  ('Grace Thomas', 'grace@mypos.com', 'cashier'),
  ('Henry Anderson', 'henry@mypos.com', 'cashier'),
  ('Ivy Jackson', 'ivy@mypos.com', 'cashier'),
  ('Jack White', 'jack@mypos.com', 'cashier');

-- Insert 30 products with realistic Indian Rupee (INR) prices (Chennai Cafe theme)
insert into products (name, category, price, stock_quantity, barcode) values
  ('Filter Coffee', 'Drinks', 60.00, 150, '8901234567801'),
  ('Masala Chai', 'Drinks', 50.00, 200, '8901234567802'),
  ('Ginger Cardamom Tea', 'Drinks', 55.00, 180, '8901234567803'),
  ('Mango Lassi', 'Drinks', 120.00, 80, '8901234567804'),
  ('Sweet Lassi', 'Drinks', 100.00, 85, '8901234567805'),
  ('Badam Milk', 'Drinks', 90.00, 100, '8901234567806'),
  ('Nannari Sarbath', 'Drinks', 70.00, 120, '8901234567807'),
  ('Rose Milk', 'Drinks', 80.00, 110, '8901234567808'),
  ('Fresh Lime Soda', 'Drinks', 90.00, 95, '8901234567809'),
  ('Jigarthanda', 'Drinks', 140.00, 60, '8901234567810'),
  ('Gulab Jamun (2 pcs)', 'Bakery', 70.00, 50, '8901234567811'),
  ('Kaju Katli (4 pcs)', 'Bakery', 120.00, 40, '8901234567812'),
  ('Rava Kesari', 'Bakery', 80.00, 45, '8901234567813'),
  ('Mysore Pak', 'Bakery', 100.00, 55, '8901234567814'),
  ('Medu Vada (2 pcs)', 'Bakery', 60.00, 120, '8901234567815'),
  ('Dilpasand', 'Bakery', 90.00, 30, '8901234567816'),
  ('Vegetable Puff', 'Bakery', 50.00, 70, '8901234567817'),
  ('Egg Puff', 'Bakery', 60.00, 65, '8901234567818'),
  ('Paneer Puff', 'Bakery', 70.00, 80, '8901234567819'),
  ('Coconut Bun', 'Bakery', 40.00, 50, '8901234567820'),
  ('Samosa (2 pcs)', 'Snacks', 40.00, 120, '8901234567821'),
  ('Onion Pakoda', 'Snacks', 70.00, 90, '8901234567822'),
  ('Pani Puri', 'Snacks', 80.00, 100, '8901234567823'),
  ('Bhel Puri', 'Snacks', 90.00, 85, '8901234567824'),
  ('Samosa Chat', 'Snacks', 110.00, 60, '8901234567825'),
  ('Masala Puri', 'Snacks', 100.00, 65, '8901234567826'),
  ('Pav Bhaji', 'Snacks', 130.00, 50, '8901234567827'),
  ('Cheese Murukku Sandwich', 'Snacks', 120.00, 40, '8901234567828'),
  ('Bread Omelette', 'Snacks', 90.00, 75, '8901234567829'),
  ('Paneer Tikka Roll', 'Snacks', 150.00, 45, '8901234567830');

-- -- Insert 30 customers (Indian Names & Chennai Addresses & Loyalty Program)
insert into customers (name, phone, address, is_value_member, purchases_count) values
  ('Aarav Sharma', '98100-12345', '12, Kasturibai Nagar, Adyar, Chennai - 600020', true, 1),
  ('Aditya Patel', '98200-23456', '45, Usman Road, T. Nagar, Chennai - 600017', false, 0),
  ('Vihaan Gupta', '98300-34567', '78, 100 Feet Bypass Road, Velachery, Chennai - 600042', false, 0),
  ('Diya Iyer', '98400-45678', '89, Kutchery Road, Mylapore, Chennai - 600004', true, 3),
  ('Ananya Reddy', '98500-56789', '34, Shanthi Colony, Anna Nagar, Chennai - 600040', true, 0),
  ('Rahul Verma', '98600-67890', '56, Gandhi Nagar Main Road, Adyar, Chennai - 600020', false, 0),
  ('Priya Nair', '98700-78901', '102, Baby Nagar, Velachery, Chennai - 600042', true, 2),
  ('Amit Singh', '98800-89012', '12, G.N. Chetty Road, T. Nagar, Chennai - 600017', false, 0),
  ('Rajesh Gupta', '98900-90123', '4, Luz Church Road, Mylapore, Chennai - 600004', true, 1),
  ('Siddharth Malhotra', '98000-01234', '5, 2nd Avenue, Anna Nagar, Chennai - 600040', false, 0),
  ('Neha Sharma', '98111-12345', '71, L.B. Road, Adyar, Chennai - 600020', true, 3),
  ('Vikram Rao', '98222-23456', '230, Taramani Link Road, Velachery, Chennai - 600042', false, 0),
  ('Sneha Iyer', '98333-34567', '44, Royapettah High Road, Mylapore, Chennai - 600004', true, 2),
  ('Kabir Bose', '98444-45678', '8, Pondy Bazaar, T. Nagar, Chennai - 600017', false, 0),
  ('Rohan Deshmukh', '98555-56789', '18, West Colony, Anna Nagar, Chennai - 600040', false, 0),
  ('Anjali Desai', '98666-67890', '9, Padmanabha Nagar, Adyar, Chennai - 600020', false, 0),
  ('Karan Johar', '98777-78901', '55, North Usman Road, T. Nagar, Chennai - 600017', false, 0),
  ('Divya Dutta', '98888-89012', '19, Vijaya Nagar, Velachery, Chennai - 600042', false, 0),
  ('Varun Dhawan', '98999-90123', '28, Santhome High Road, Mylapore, Chennai - 600004', false, 0),
  ('Alia Bhatt', '98000-11111', '67, H-Block, Anna Nagar, Chennai - 600040', true, 0),
  ('Ranbir Kapoor', '98111-22222', '31, Shastri Nagar, Adyar, Chennai - 600020', false, 0),
  ('Deepika Padukone', '98222-33333', '88, Dhandeeswaram Nagar, Velachery, Chennai - 600042', true, 1),
  ('Ranveer Singh', '98333-44444', '90, Burkit Road, T. Nagar, Chennai - 600017', false, 0),
  ('Katrina Kaif', '98444-55555', '3, Radhakrishnan Salai, Mylapore, Chennai - 600004', true, 2),
  ('Vicky Kaushal', '98555-66666', '12, Y-Block, Anna Nagar, Chennai - 600040', false, 0),
  ('Kiara Advani', '98666-77777', '14, Indira Nagar, Adyar, Chennai - 600020', true, 0),
  ('Sidharth Malhotra', '98777-88888', '77, South Boag Road, T. Nagar, Chennai - 600017', false, 0),
  ('Kriti Sanon', '98888-99999', '11, Lic Colony, Velachery, Chennai - 600042', false, 0),
  ('Ayushmann Khurrana', '98999-00000', '15, Kapaleeswarar Temple Sannidhi, Mylapore, Chennai - 600004', false, 0),
  ('Kartik Aaryan', '98000-22222', '41, Blue Stone Avenue, Anna Nagar, Chennai - 600040', false, 0);

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
  v_is_value_member boolean;
  v_purchases_count integer;
  v_discount numeric(10, 2);
begin
  for i in 1..2500 loop
    -- Random customer (80% chance of registered customer, 20% anonymous walk-in)
    if random() < 0.8 then
      select id, is_value_member, purchases_count into v_customer_id, v_is_value_member, v_purchases_count 
      from customers order by random() limit 1;
    else
      v_customer_id := null;
      v_is_value_member := false;
      v_purchases_count := 0;
    end if;
    
    -- Random cashier or admin who checked out the sale
    select id into v_user_id from users order by random() limit 1;
    
    -- Random date in the last 6 months (180 days)
    v_sale_date := now() - (random() * interval '180 days');
    
    -- Insert base sale record (placeholder for total, updated below)
    insert into sales (customer_id, user_id, total_amount, discount_amount, sale_date)
    values (v_customer_id, v_user_id, 0, 0, v_sale_date)
    returning id into v_sale_id;
    
    -- Random number of items in transaction (1 to 4)
    v_items_count := floor(random() * 4) + 1;
    v_total := 0;
    
    for j in 1..v_items_count loop
      select id, price into v_product_id, v_price from products order by random() limit 1;
      v_quantity := floor(random() * 3) + 1;
      
      -- Avoid inserting duplicate products in the same sale
      if not exists (select 1 from sale_items where sale_id = v_sale_id and product_id = v_product_id) then
        insert into sale_items (sale_id, product_id, quantity, unit_price)
        values (v_sale_id, v_product_id, v_quantity, v_price);
        
        v_total := v_total + (v_quantity * v_price);
      end if;
    end loop;
    
    -- Calculate loyalty discount if applicable
    v_discount := 0;
    if v_customer_id is not null and v_is_value_member then
      if v_purchases_count >= 3 then
        v_discount := round(v_total * 0.10, 2);
        v_total := v_total - v_discount;
        
        -- Reset purchases count
        update customers set purchases_count = 0 where id = v_customer_id;
      else
        -- Increment purchases count
        update customers set purchases_count = purchases_count + 1 where id = v_customer_id;
      end if;
    end if;
    
    -- Update sale totals
    update sales set total_amount = v_total, discount_amount = v_discount where id = v_sale_id;
  end loop;
end $$;
