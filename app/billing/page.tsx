"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  barcode?: string;
};

type Customer = {
  id: number;
  name: string;
  phone?: string;
  address: string;
  is_value_member: boolean;
  purchases_count: number;
};

type CartItem = {
  product: Product;
  quantity: number;
};

export default function BillingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart & checkout state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Add Customer form state (separate tab)
  const [customerTab, setCustomerTab] = useState<"select" | "register">("select");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newIsValueMember, setNewIsValueMember] = useState(false);
  const [newCustomerLoading, setNewCustomerLoading] = useState(false);
  const [newCustomerError, setNewCustomerError] = useState<string | null>(null);

  // Recommendations state
  const [lastAddedProductId, setLastAddedProductId] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Receipt modal state
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<{
    saleId: number;
    totalAmount: number;
    discountAmount: number;
    date: string;
    customerId: number | null;
    customerName: string | null;
    customerAddress: string | null;
    items: { name: string; quantity: number; price: number }[];
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch products
      const prodRes = await fetch("/api/products");
      if (!prodRes.ok) throw new Error("Failed to fetch products");
      const prodData = await prodRes.json();
      setProducts(prodData);

      // Fetch customers
      const custRes = await fetch("/api/customers");
      if (!custRes.ok) throw new Error("Failed to fetch customers");
      const custData = await custRes.json();
      setCustomers(custData);
    } catch (err: any) {
      setError(err.message || "Something went wrong loading billing details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (lastAddedProductId) {
      const fetchRecommendations = async () => {
        try {
          setLoadingRecommendations(true);
          const res = await fetch(`/api/recommend?id=${lastAddedProductId}`);
          if (res.ok) {
            const data = await res.json();
            setRecommendations(data);
          }
        } catch (err) {
          console.error("Failed to fetch recommendations:", err);
        } finally {
          setLoadingRecommendations(false);
        }
      };

      fetchRecommendations();
    }
  }, [lastAddedProductId]);

  // Cart Actions
  const addToCart = (product: Product) => {
    // Play supermarket scan beep audio using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1400, audioCtx.currentTime); // 1.4kHz beep
      gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.08); // 80ms beep
    } catch (e) {
      console.error("Audio beep failed:", e);
    }

    setLastAddedProductId(product.id);
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      const currentQty = existing ? existing.quantity : 0;

      // Block if exceeding stock
      if (currentQty >= product.stock_quantity) {
        alert(`Cannot add more. Only ${product.stock_quantity} units available in stock.`);
        return prevCart;
      }

      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, amount: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.quantity + amount;

          // Check stock
          if (newQty > item.product.stock_quantity) {
            alert(`Only ${item.product.stock_quantity} units available in stock.`);
            return item;
          }

          return { ...item, quantity: newQty };
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Add Customer form submission
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAddress) {
      setNewCustomerError("Name and Address are required.");
      return;
    }

    try {
      setNewCustomerLoading(true);
      setNewCustomerError(null);

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          phone: newPhone || null,
          address: newAddress,
          is_value_member: newIsValueMember,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register customer.");
      }

      // Add to customers state list
      setCustomers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      // Select the new customer
      setSelectedCustomerId(String(data.id));

      // Reset form
      setNewName("");
      setNewPhone("");
      setNewAddress("");
      setNewIsValueMember(false);
      // Switch tab back to selection
      setCustomerTab("select");
    } catch (err: any) {
      setNewCustomerError(err.message || "An error occurred.");
    } finally {
      setNewCustomerLoading(false);
    }
  };

  // Calculations (Loyalty reward logic computed on client-side for UX review)
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const customerObj = customers.find((c) => c.id === Number(selectedCustomerId));
  const isValueMember = customerObj?.is_value_member || false;
  const isEligibleForDiscount = isValueMember && customerObj?.purchases_count === 3;
  const loyaltyDiscount = isEligibleForDiscount ? Number((cartSubtotal * 0.10).toFixed(2)) : 0;
  const checkoutTotal = cartSubtotal - loyaltyDiscount;

  // Complete Sale Handler
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setCheckoutError(null);

    const salePayload = {
      customer_id: selectedCustomerId ? parseInt(selectedCustomerId) : null,
      cart: cart.map((item) => ({
        id: item.product.id,
        quantity: item.quantity,
      })),
    };

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(salePayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process sale");
      }

      const freshCustomerObj = customers.find((c) => c.id === Number(selectedCustomerId));

      // Set up receipt data
      setCompletedSale({
        saleId: data.sale_id,
        totalAmount: data.total_amount,
        discountAmount: data.discount_amount || 0,
        date: new Date().toLocaleString(),
        customerId: freshCustomerObj ? freshCustomerObj.id : null,
        customerName: freshCustomerObj ? freshCustomerObj.name : "Walk-in Customer",
        customerAddress: freshCustomerObj ? freshCustomerObj.address : null,
        items: cart.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });

      setIsReceiptOpen(true);
      setCart([]); // Clear cart
      setSelectedCustomerId(""); // Reset customer selector
      fetchData(); // Refresh product stock & customer purchase counters
    } catch (err: any) {
      setCheckoutError(err.message || "An error occurred during checkout.");
    } finally {
      setSubmitting(false);
    }
  };

  // Printing logic
  const handlePrint = () => {
    window.print();
  };

  const handleNewTransaction = () => {
    setIsReceiptOpen(false);
    setCompletedSale(null);
  };

  // Filter Catalog
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-zinc-100 font-sans flex flex-col">
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print-area, #receipt-print-area * {
            visibility: visible;
          }
          #receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Navbar */}
      <nav className="border-b border-zinc-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-black text-zinc-950 hover:opacity-80 transition-opacity bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-indigo-600">
              my-POS
            </Link>
            <span className="h-5 w-[1px] bg-zinc-200" />
            <span className="text-sm font-medium text-zinc-600">Checkout Terminal</span>
          </div>
          <div className="flex gap-4">
            <Link href="/history" className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all">
              Transaction History
            </Link>
            <Link href="/inventory" className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all">
              Inventory Manager
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Left Side: Product Catalog */}
        <div className="lg:col-span-2 flex flex-col bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm overflow-hidden h-[calc(100vh-140px)]">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Products Catalog</h2>
              <p className="text-xs text-zinc-500">Search products to add to cart (click to add with sound beep).</p>
            </div>
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-4 text-xs outline-none focus:border-zinc-500 focus:bg-white transition-all text-zinc-900 font-semibold"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 py-4 border-b border-zinc-100 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Catalog Grid */}
          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-12">{error}</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center text-zinc-400 py-12">No products found.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock_quantity === 0;
                  const itemInCart = cart.find((i) => i.product.id === product.id);
                  const cartQty = itemInCart ? itemInCart.quantity : 0;
                  const isMaxedOut = cartQty >= product.stock_quantity;

                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={isOutOfStock || isMaxedOut}
                      className={`flex flex-col text-left border border-zinc-200 rounded-xl p-4 transition-all hover:border-zinc-400 shadow-sm relative group bg-white active:scale-[0.98] ${
                        isOutOfStock
                          ? "opacity-50 cursor-not-allowed bg-zinc-50"
                          : isMaxedOut
                          ? "border-amber-300 bg-amber-50/10 hover:border-amber-300"
                          : "hover:shadow-md"
                      }`}
                    >
                      <span className={`inline-flex self-start rounded-full px-2.5 py-0.5 text-4xs font-black uppercase tracking-wider ${
                        product.category === "Drinks"
                          ? "bg-blue-100 text-blue-900 border border-blue-200"
                          : product.category === "Bakery"
                          ? "bg-purple-100 text-purple-900 border border-purple-200"
                          : "bg-amber-100 text-amber-950 border border-amber-250"
                      }`}>
                        {product.category}
                      </span>
                      <span className="font-bold text-zinc-900 text-sm mt-1 line-clamp-2">
                        {product.name}
                      </span>
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <span className="text-base font-extrabold text-zinc-900">
                          ₹{Number(product.price).toFixed(2)}
                        </span>
                        <span
                          className={`text-2xs font-semibold px-2 py-0.5 rounded ${
                            isOutOfStock
                              ? "bg-red-100 text-red-800"
                              : product.stock_quantity < 10
                              ? "bg-amber-100 text-amber-800"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {isOutOfStock ? "Out of Stock" : `${product.stock_quantity} Stock`}
                        </span>
                      </div>
                      {cartQty > 0 && (
                        <div className="absolute top-2 right-2 bg-zinc-900 text-white font-extrabold rounded-full h-5 w-5 flex items-center justify-center text-3xs">
                          {cartQty}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recommendations Banner */}
          {recommendations.length > 0 && (
            <div className="mt-6 border-t border-zinc-100 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
                <span>💡</span> Frequently Bought Together
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {recommendations.map((prod) => {
                  const isOutOfStock = prod.stock_quantity === 0;
                  return (
                    <button
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      disabled={isOutOfStock}
                      className={`flex flex-col text-left border border-zinc-200 rounded-lg p-3 hover:border-zinc-400 bg-white transition-all shadow-sm active:scale-[0.98] ${
                        isOutOfStock ? "opacity-50 cursor-not-allowed bg-zinc-50" : ""
                      }`}
                    >
                      <span className="text-3xs text-zinc-400 uppercase tracking-wider">{prod.category}</span>
                      <span className="font-bold text-zinc-800 text-xs mt-1 truncate w-full">{prod.name}</span>
                      <span className="text-xs font-extrabold text-zinc-900 mt-2">₹{Number(prod.price).toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Shopping Cart Summary & Loyalty Program */}
        <div className="flex flex-col bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm h-[calc(100vh-140px)] overflow-hidden">
          <h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-3">Active Order</h2>

          {/* Customer Selection/Register Tabs */}
          <div className="mt-4 bg-zinc-50 border border-zinc-200 rounded-xl p-1.5 flex gap-1">
            <button
              onClick={() => setCustomerTab("select")}
              className={`flex-1 text-center py-1.5 rounded-lg text-2xs font-extrabold uppercase tracking-wider transition-all ${
                customerTab === "select" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              Select Member
            </button>
            <button
              onClick={() => setCustomerTab("register")}
              className={`flex-1 text-center py-1.5 rounded-lg text-2xs font-extrabold uppercase tracking-wider transition-all ${
                customerTab === "register" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              New Customer +
            </button>
          </div>

          {/* Tab 1: Customer Selection */}
          {customerTab === "select" && (
            <div className="mt-3.5 space-y-3">
              <div>
                <label className="block text-4xs font-extrabold uppercase tracking-wider text-zinc-400">
                  Assign Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-zinc-500 text-zinc-900 font-semibold"
                >
                  <option value="">Walk-in Customer (Guest)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (ID: #{c.id}) {c.is_value_member ? "⭐" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Loyalty Status Card */}
              {customerObj && (
                <div className={`rounded-xl border p-3 flex flex-col gap-1.5 text-xs transition-all ${
                  customerObj.is_value_member 
                    ? "bg-zinc-50 border-zinc-200 text-zinc-800" 
                    : "bg-zinc-50/50 border-dashed border-zinc-200 text-zinc-500"
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-2xs uppercase tracking-wide">Loyalty Account</span>
                    <span className={`text-4xs font-black uppercase px-2 py-0.5 rounded ${
                      customerObj.is_value_member ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-600"
                    }`}>
                      {customerObj.is_value_member ? "Value Member" : "Regular Customer"}
                    </span>
                  </div>
                  {customerObj.is_value_member ? (
                    <div className="space-y-1 mt-0.5">
                      <div className="flex justify-between text-3xs font-semibold">
                        <span>Purchases towards 10% discount:</span>
                        <span className="font-extrabold">{customerObj.purchases_count} / 3</span>
                      </div>
                      {/* Cycle Progress bar */}
                      <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden mt-1 flex gap-0.5">
                        <div className={`h-full flex-1 ${customerObj.purchases_count >= 1 ? "bg-zinc-900" : "bg-transparent"}`} />
                        <div className={`h-full flex-1 ${customerObj.purchases_count >= 2 ? "bg-zinc-900" : "bg-transparent"}`} />
                        <div className={`h-full flex-1 ${customerObj.purchases_count >= 3 ? "bg-zinc-900" : "bg-transparent"}`} />
                      </div>
                      {isEligibleForDiscount ? (
                        <p className="text-emerald-700 font-extrabold text-3xs pt-1 flex items-center gap-1 uppercase tracking-wider animate-pulse">
                          🎉 10% Loyalty Discount Applied on this Order!
                        </p>
                      ) : (
                        <p className="text-3xs font-medium text-zinc-400 mt-1">
                          {3 - customerObj.purchases_count} more full-price purchase(s) until discount reward.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-3xs font-medium mt-0.5">
                      Regular account. Register as a Value Member to unlock 10% discount rewards!
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: New Customer Form */}
          {customerTab === "register" && (
            <form onSubmit={handleAddCustomer} className="mt-3.5 space-y-2.5">
              {newCustomerError && (
                <p className="text-3xs text-red-500 font-bold bg-red-50 border border-red-200 p-1.5 rounded">
                  ⚠️ {newCustomerError}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-4xs font-extrabold uppercase tracking-wider text-zinc-400">Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-2xs outline-none text-zinc-900 focus:border-zinc-500 font-semibold"
                    placeholder="e.g. Diya Iyer"
                  />
                </div>
                <div>
                  <label className="block text-4xs font-extrabold uppercase tracking-wider text-zinc-400">Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-2xs outline-none text-zinc-900 focus:border-zinc-500 font-semibold"
                    placeholder="e.g. 98400-XXXXX"
                  />
                </div>
              </div>
              <div>
                <label className="block text-4xs font-extrabold uppercase tracking-wider text-zinc-400">Address (Chennai)</label>
                <input
                  type="text"
                  required
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-2xs outline-none text-zinc-900 focus:border-zinc-500 font-semibold"
                  placeholder="e.g. 12, Kasturibai Nagar, Adyar"
                />
              </div>
              <div className="flex items-center gap-1.5 pt-1.5">
                <input
                  type="checkbox"
                  id="value_member_check"
                  checked={newIsValueMember}
                  onChange={(e) => setNewIsValueMember(e.target.checked)}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950 h-3.5 w-3.5"
                />
                <label htmlFor="value_member_check" className="text-3xs font-extrabold uppercase text-zinc-600 cursor-pointer">
                  Join Loyalty Program as "Value Member"
                </label>
              </div>
              <button
                type="submit"
                disabled={newCustomerLoading}
                className="w-full rounded bg-zinc-900 text-white font-extrabold text-2xs uppercase tracking-wider py-2 hover:bg-zinc-800 transition-all shadow disabled:opacity-50"
              >
                {newCustomerLoading ? "Registering..." : "Register Customer"}
              </button>
            </form>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto mt-6 pr-1 space-y-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-400">
                <svg className="h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="mt-2 text-sm">Cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                  <div className="flex-1">
                    <p className="font-bold text-zinc-900 text-sm line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-zinc-500">₹{Number(item.product.price).toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="h-6 w-6 flex items-center justify-center rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-zinc-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="h-6 w-6 flex items-center justify-center rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right pl-2">
                    <p className="text-sm font-bold text-zinc-900">
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-3xs text-red-500 hover:underline mt-0.5"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Checkout Card */}
          <div className="border-t border-zinc-200 pt-4 mt-auto">
            {checkoutError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                {checkoutError}
              </div>
            )}

            <div className="space-y-1.5 text-xs text-zinc-600 border-b border-zinc-100 pb-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{cartSubtotal.toFixed(2)}</span>
              </div>
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Loyalty Discount (10% - 4th Buy)</span>
                  <span>-₹{loyaltyDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-base font-extrabold text-zinc-900 py-3">
              <span>Total Amount</span>
              <span>₹{checkoutTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || submitting}
              className="w-full mt-2 rounded-xl bg-zinc-900 py-3 text-center text-sm font-bold text-white shadow hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {submitting ? "Processing Transaction..." : "Complete Sale"}
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {isReceiptOpen && completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
            {/* Printable Receipt Area */}
            <div id="receipt-print-area" className="p-6 bg-white text-zinc-900 font-mono text-xs">
              <div className="text-center pb-4 border-b border-dashed border-zinc-300">
                <h2 className="text-lg font-bold tracking-wider">MY-POS (CHENNAI)</h2>
                <p className="text-2xs text-zinc-500 mt-1">100 Feet Bypass Road, Velachery, Chennai</p>
                <p className="text-2xs text-zinc-500">Tel: +91 44 2244 5566</p>
              </div>

              <div className="py-4 border-b border-dashed border-zinc-300 space-y-1">
                <p><b>RECEIPT ID:</b> #{completedSale.saleId}</p>
                <p><b>DATE:</b> {completedSale.date}</p>
                <p><b>CUSTOMER:</b> {completedSale.customerName} {completedSale.customerId ? `(#${completedSale.customerId})` : ""}</p>
                {completedSale.customerAddress && (
                  <p className="whitespace-normal leading-tight"><b>ADDRESS:</b> {completedSale.customerAddress}</p>
                )}
                {completedSale.discountAmount > 0 && (
                  <p className="text-emerald-700 font-bold"><b>MEMBERSHIP:</b> Value Member (Discount Applied)</p>
                )}
                <p><b>OPERATOR:</b> Cashier Terminal #1</p>
              </div>

              {/* Items */}
              <div className="py-4 border-b border-dashed border-zinc-300 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>ITEM</span>
                  <span className="w-16 text-center">QTY</span>
                  <span className="w-16 text-right">PRICE</span>
                </div>
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[150px]">{item.name}</span>
                    <span className="w-16 text-center">x{item.quantity}</span>
                    <span className="w-16 text-right">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-4 text-right space-y-1 text-sm font-bold">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>₹{(completedSale.totalAmount + completedSale.discountAmount).toFixed(2)}</span>
                </div>
                {completedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>DISCOUNT (10%):</span>
                    <span>-₹{completedSale.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-zinc-200 pt-2 text-base">
                  <span>TOTAL:</span>
                  <span>₹{completedSale.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-dashed border-zinc-300">
                <p className="font-bold text-2xs">THANK YOU FOR YOUR VISIT!</p>
                <p className="text-3xs text-zinc-400 mt-1">Next-gen Point of Sale System</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-zinc-50 px-6 py-4 flex gap-3 border-t border-zinc-100 justify-end">
              <button
                onClick={handlePrint}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all shadow-sm"
              >
                Print Receipt
              </button>
              <button
                onClick={handleNewTransaction}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-all shadow-sm"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
