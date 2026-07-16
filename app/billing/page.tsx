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

type Customer = {
  id: number;
  name: string;
  region: string;
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

  // Receipt modal state
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<{
    saleId: number;
    totalAmount: number;
    date: string;
    customerName: string | null;
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

  // Cart Actions
  const addToCart = (product: Product) => {
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

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

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

      const customerObj = customers.find((c) => c.id === Number(selectedCustomerId));

      // Set up receipt data
      setCompletedSale({
        saleId: data.sale_id,
        totalAmount: data.total_amount,
        date: new Date().toLocaleString(),
        customerName: customerObj ? customerObj.name : "Walk-in Customer",
        items: cart.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });

      setIsReceiptOpen(true);
      setCart([]); // Clear cart
      setSelectedCustomerId(""); // Reset customer selector
      fetchData(); // Refresh product stock numbers
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
            <Link href="/" className="text-xl font-bold text-zinc-900 hover:text-zinc-600 transition-colors">
              my-POS
            </Link>
            <span className="h-5 w-[1px] bg-zinc-200" />
            <span className="text-sm font-medium text-zinc-600">Checkout Terminal</span>
          </div>
          <div className="flex gap-4">
            <Link href="/inventory" className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all">
              Inventory Manager
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Left Side: Product Selector (2 columns wide on desktop) */}
        <div className="lg:col-span-2 flex flex-col bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm overflow-hidden h-[calc(100vh-140px)]">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Products Catalog</h2>
              <p className="text-xs text-zinc-500">Search and select items to add to cart.</p>
            </div>
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-4 text-xs outline-none focus:border-zinc-500 focus:bg-white transition-all text-zinc-900"
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
                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
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
        </div>

        {/* Right Side: Shopping Cart Summary */}
        <div className="flex flex-col bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm h-[calc(100vh-140px)] overflow-hidden">
          <h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-3">Active Order</h2>

          {/* Customer Selector */}
          <div className="mt-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Customer Assignment
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-zinc-500 text-zinc-900"
            >
              <option value="">Walk-in Customer (Guest)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.region})
                </option>
              ))}
            </select>
          </div>

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

            <div className="flex items-center justify-between text-base font-extrabold text-zinc-900 py-3">
              <span>Total Amount</span>
              <span>₹{cartSubtotal.toFixed(2)}</span>
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
                <h2 className="text-lg font-bold tracking-wider">MY-POS</h2>
                <p className="text-2xs text-zinc-500 mt-1">123 Coffee Street, Seattle, WA</p>
                <p className="text-2xs text-zinc-500">Tel: (555) 0199</p>
              </div>

              <div className="py-4 border-b border-dashed border-zinc-300 space-y-1">
                <p><b>RECEIPT ID:</b> #{completedSale.saleId}</p>
                <p><b>DATE:</b> {completedSale.date}</p>
                <p><b>CUSTOMER:</b> {completedSale.customerName}</p>
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
                  <span>₹{completedSale.totalAmount.toFixed(2)}</span>
                </div>
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

            {/* Modal Actions (Hidden during print via CSS) */}
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
