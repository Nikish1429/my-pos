# My-POS — Modern Point of Sale System & Analytics Dashboard

A sleek, full-stack Next.js and Supabase-powered Point of Sale (POS) system designed for retail shops, coupled with an interactive Power BI business intelligence dashboard. 

This application provides a complete solution for processing transactions, managing inventory, predicting sales, and visualizing retail analytics.

---

## 📸 Screenshots

*Once you capture your screenshots, save them as `dashboard.png`, `billing.png`, `inventory.png`, and `analytics.png` inside the `public/screenshots/` folder to display them here:*

<table>
  <tr>
    <td align="center"><b>Dashboard & Sales Forecast</b></td>
    <td align="center"><b>Billing Screen & Cart</b></td>
  </tr>
  <tr>
    <td><img src="public/screenshots/dashboard.png" alt="Dashboard Screen" width="400"/></td>
    <td><img src="public/screenshots/billing.png" alt="Billing Screen" width="400"/></td>
  </tr>
  <tr>
    <td align="center"><b>Inventory Management (Admin Only)</b></td>
    <td align="center"><b>Power BI Analytics Report</b></td>
  </tr>
  <tr>
    <td><img src="public/screenshots/inventory.png" alt="Inventory Screen" width="400"/></td>
    <td><img src="public/screenshots/analytics.png" alt="Power BI Analytics" width="400"/></td>
  </tr>
</table>

---

## ✨ Features

- 🔐 **Role-Based Access Control (RBAC)**: Secure authentication handled via Supabase Auth. Dual-role system separating **Admins** (who can access everything including inventory management) and **Cashiers** (restricted to billing, history, and the dashboard).
- 🛒 **Dynamic Billing & Checkout**: A real-time cart with live total calculations. Completing a sale automatically decrements product stock and saves details across linked transactions tables in a single database action.
- 📦 **Inventory Control**: Comprehensive product list with live stock numbers. Auto-highlights products low on stock (under 10 units) to alert store administrators.
- 📜 **Transaction History**: Complete record of all past sales sorted by date (newest first). Click any transaction to instantly view its itemized receipt details.
- 🧠 **Smart Features (Plain JS, No Heavy Libraries)**:
  - **Sales Prediction**: Runs a 7-day Simple Moving Average (SMA) of daily revenue to forecast tomorrow's sales on the main dashboard.
  - **Product Recommendations**: Analyzes item co-occurrence in past orders to suggest "Frequently Bought Together" products on the checkout screen.
- 📊 **Power BI Analytics Dashboard**: A rich, single-page BI report highlighting monthly revenue trends, sales by category, top customers, regional performance, and key retail metrics (Total Revenue, Average Order Value).

---

## 🛠️ Tech Stack

* **Framework**: Next.js (App Router, TypeScript)
* **Styling**: Tailwind CSS
* **Database & Auth**: Supabase (PostgreSQL, Supabase Auth)
* **Charts & Visuals**: Recharts (web app) & Power BI Desktop (analytics dashboard)
* **Deployment**: Vercel

---

## 🚀 How to Run Locally

### 1. Clone the Repository
```bash
git clone https://github.com/Nikish1429/my-pos.git
cd my-pos
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root of your project:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the app!
