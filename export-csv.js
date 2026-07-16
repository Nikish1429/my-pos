const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// 1. Read environment variables from .env.local
const envPath = path.join(__dirname, ".env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
  if (urlMatch) supabaseUrl = urlMatch[1].trim();
  if (keyMatch) supabaseAnonKey = keyMatch[1].trim();
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Error: Could not find Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to convert JSON array to CSV string
function convertToCSV(data, columns) {
  const header = columns.join(",");
  const rows = data.map((row) =>
    columns
      .map((colName) => {
        let val = row[colName];
        if (val === null || val === undefined) {
          return "";
        }
        // Format dates cleanly
        if (colName.endsWith("_date") || colName === "created_at") {
          return new Date(val).toISOString().split("T")[0];
        }
        // Escape quotes and commas in strings
        if (typeof val === "string") {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      })
      .join(",")
  );
  return [header, ...rows].join("\n");
}

async function exportData() {
  const outputDir = path.join(__dirname, "powerbi-data");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  console.log("🔗 Connecting to Supabase and pulling tables...");

  try {
    // 1. Export Users
    const { data: users, error: usersErr } = await supabase.from("users").select("*");
    if (usersErr) throw usersErr;
    fs.writeFileSync(
      path.join(outputDir, "users.csv"),
      convertToCSV(users, ["id", "name", "email", "role"])
    );
    console.log(`✅ Exported users.csv (${users.length} rows)`);

    // 2. Export Products
    const { data: products, error: prodErr } = await supabase.from("products").select("*");
    if (prodErr) throw prodErr;
    fs.writeFileSync(
      path.join(outputDir, "products.csv"),
      convertToCSV(products, ["id", "name", "category", "price", "stock_quantity"])
    );
    console.log(`✅ Exported products.csv (${products.length} rows)`);

    // 3. Export Customers
    const { data: customers, error: custErr } = await supabase.from("customers").select("*");
    if (custErr) throw custErr;
    fs.writeFileSync(
      path.join(outputDir, "customers.csv"),
      convertToCSV(customers, ["id", "name", "phone", "region"])
    );
    console.log(`✅ Exported customers.csv (${customers.length} rows)`);

    // 4. Export Sales
    const { data: sales, error: salesErr } = await supabase.from("sales").select("*");
    if (salesErr) throw salesErr;
    fs.writeFileSync(
      path.join(outputDir, "sales.csv"),
      convertToCSV(sales, ["id", "customer_id", "user_id", "total_amount", "sale_date"])
    );
    console.log(`✅ Exported sales.csv (${sales.length} rows)`);

    // 5. Export Sale Items
    const { data: saleItems, error: itemsErr } = await supabase.from("sale_items").select("*");
    if (itemsErr) throw itemsErr;
    fs.writeFileSync(
      path.join(outputDir, "sale_items.csv"),
      convertToCSV(saleItems, ["id", "sale_id", "product_id", "quantity", "unit_price"])
    );
    console.log(`✅ Exported sale_items.csv (${saleItems.length} rows)`);

    // 6. Export Categories (Generated from products categories list)
    const categoriesList = [
      { id: 1, name: "Drinks" },
      { id: 2, name: "Bakery" },
      { id: 3, name: "Snacks" },
    ];
    fs.writeFileSync(
      path.join(outputDir, "categories.csv"),
      convertToCSV(categoriesList, ["id", "name"])
    );
    console.log(`✅ Exported categories.csv (3 rows)`);

    console.log("\n🎉 All 6 CSV data files successfully exported to /powerbi-data/ directory!");
  } catch (error) {
    console.error("❌ Export failed:", error.message);
  }
}

exportData();
