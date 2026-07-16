"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Drinks");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await res.json();
      setProducts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Open modal for add
  const handleAddClick = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategory("Drinks");
    setFormPrice("");
    setFormStock("");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormPrice(product.price.toString());
    setFormStock(product.stock_quantity.toString());
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const priceNum = parseFloat(formPrice);
    const stockNum = parseInt(formStock);

    if (!formName.trim() || !formCategory.trim() || isNaN(priceNum) || isNaN(stockNum)) {
      setFormError("Please fill out all fields with valid numbers.");
      setSubmitting(false);
      return;
    }

    try {
      const url = "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const body = editingProduct
        ? { id: editingProduct.id, name: formName, category: formCategory, price: priceNum, stock_quantity: stockNum }
        : { name: formName, category: formCategory, price: priceNum, stock_quantity: stockNum };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save product");
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Categories present in database
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = products.filter((p) => p.stock_quantity < 10).length;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Navbar */}
      <nav className="border-b border-zinc-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-zinc-900 hover:text-zinc-600 transition-colors">
              my-POS
            </Link>
            <span className="h-5 w-[1px] bg-zinc-200" />
            <span className="text-sm font-medium text-zinc-600">Inventory Management</span>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all">
              Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Header Block */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Products Inventory</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Manage your store products, update pricing, and monitor stock levels.
            </p>
          </div>
          <button
            onClick={handleAddClick}
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-all active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
            </svg>
            Add Product
          </button>
        </div>

        {/* Stats Summary Banner */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <span className="text-sm font-medium text-zinc-500">Total Products</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-900">{products.length}</span>
              <span className="text-xs text-zinc-600">items in catalog</span>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <span className="text-sm font-medium text-zinc-500">Low Stock Warnings</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${lowStockCount > 0 ? "text-amber-600" : "text-green-600"}`}>
                {lowStockCount}
              </span>
              <span className="text-xs text-zinc-600">items below 10 units</span>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search products by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-zinc-500 focus:bg-white transition-all text-zinc-900"
            />
            <div className="absolute left-3 top-2.5 text-zinc-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 text-zinc-900"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Table Card */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              No products found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Price</th>
                    <th className="px-6 py-4 text-center">Stock</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredProducts.map((product) => {
                    const isLowStock = product.stock_quantity < 10;
                    return (
                      <tr
                        key={product.id}
                        className={`hover:bg-zinc-50/50 transition-colors ${
                          isLowStock ? "bg-red-50/30" : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-zinc-500">#{product.id}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-zinc-900">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium text-zinc-900">
                          ₹{Number(product.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                              isLowStock
                                ? "bg-amber-100 text-amber-900 border border-amber-200"
                                : "bg-green-100 text-green-900 border border-green-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isLowStock ? "bg-amber-600" : "bg-green-600"
                              }`}
                            />
                            {product.stock_quantity}
                            {isLowStock && " - Low Stock"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <button
                            onClick={() => handleEditClick(product)}
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit/Add Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-zinc-100 px-6 py-4">
              <h2 className="text-lg font-bold text-zinc-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Caramel Macchiato"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:bg-white transition-all text-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 transition-all text-zinc-900"
                  >
                    <option value="Drinks">Drinks</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="3.50"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:bg-white transition-all text-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Initial Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="50"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:bg-white transition-all text-zinc-900"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {submitting ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
