"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CustomerRelation = {
  id: number;
  name: string;
  phone?: string;
  address?: string;
} | null;

type UserRelation = {
  name: string;
} | null;

type SaleSummary = {
  id: number;
  total_amount: number;
  discount_amount: number;
  sale_date: string;
  customer: CustomerRelation;
  user: UserRelation;
};

type SaleItemDetail = {
  id: number;
  quantity: number;
  unit_price: number;
  product: {
    name: string;
  } | null;
};

type SaleDetail = {
  id: number;
  total_amount: number;
  discount_amount: number;
  sale_date: string;
  customer: CustomerRelation;
  user: UserRelation;
  sale_items: SaleItemDetail[];
};

export default function HistoryPage() {
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Selected sale details state
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<SaleDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch sales list
  const fetchSalesList = async () => {
    try {
      setLoadingList(true);
      const res = await fetch("/api/sales");
      if (!res.ok) throw new Error("Failed to fetch transaction history");
      const data = await res.json();
      setSales(data);
      setListError(null);

      // Auto-select first transaction if available
      if (data.length > 0) {
        setSelectedSaleId(data[0].id);
      }
    } catch (err: any) {
      setListError(err.message || "Could not load transactions.");
    } finally {
      setLoadingList(false);
    }
  };

  // Fetch single sale detail
  const fetchSaleDetail = async (id: number) => {
    try {
      setLoadingDetail(true);
      setDetailError(null);
      const res = await fetch(`/api/sales?id=${id}`);
      if (!res.ok) throw new Error(`Failed to fetch details for sale #${id}`);
      const data = await res.json();
      setSelectedSaleDetail(data);
    } catch (err: any) {
      setDetailError(err.message || "Could not load transaction details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchSalesList();
  }, []);

  useEffect(() => {
    if (selectedSaleId !== null) {
      fetchSaleDetail(selectedSaleId);
    }
  }, [selectedSaleId]);

  // Filter list
  const filteredSales = sales.filter((sale) => {
    const matchesId = sale.id.toString().includes(searchQuery);
    const matchesCustomer = sale.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
    const matchesUser = sale.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
    return matchesId || matchesCustomer || matchesUser;
  });

  return (
    <div className="min-h-screen bg-zinc-100 font-sans flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-zinc-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-zinc-900 hover:text-zinc-600 transition-colors">
              my-POS
            </Link>
            <span className="h-5 w-[1px] bg-zinc-200" />
            <span className="text-sm font-medium text-zinc-600">Transaction History</span>
          </div>
          <div className="flex gap-4">
            <Link href="/billing" className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all">
              Checkout Terminal
            </Link>
            <Link href="/inventory" className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all">
              Inventory Manager
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Left Side: Transactions List */}
        <div className="lg:col-span-2 flex flex-col bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm overflow-hidden h-[calc(100vh-140px)]">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Past Transactions</h2>
              <p className="text-xs text-zinc-500">Search and review all shop receipts.</p>
            </div>
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search by ID, customer, cashier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-4 text-xs outline-none focus:border-zinc-500 focus:bg-white transition-all text-zinc-900"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            {loadingList ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
              </div>
            ) : listError ? (
              <div className="text-center text-red-500 py-12">{listError}</div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center text-zinc-400 py-12">No transactions recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/70 text-2xs font-semibold uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3">Receipt ID</th>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Cashier</th>
                      <th className="px-4 py-3 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredSales.map((sale) => (
                      <tr
                        key={sale.id}
                        onClick={() => setSelectedSaleId(sale.id)}
                        className={`hover:bg-zinc-50/70 transition-all cursor-pointer ${
                          selectedSaleId === sale.id
                            ? "bg-zinc-50 font-medium border-l-2 border-l-zinc-900"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-4 text-xs font-mono text-zinc-600">#{sale.id}</td>
                        <td className="px-4 py-4 text-xs text-zinc-500">
                          {new Date(sale.sale_date).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-xs text-zinc-900 font-semibold">
                          {sale.customer ? `${sale.customer.name} (#${sale.customer.id})` : "Guest"}
                        </td>
                        <td className="px-4 py-4 text-xs text-zinc-600">
                          {sale.user ? sale.user.name : "Terminal #1"}
                        </td>
                        <td className="px-4 py-4 text-xs text-right font-extrabold text-zinc-900">
                          ₹{Number(sale.total_amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Receipt Detail Viewer */}
        <div className="flex flex-col bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm h-[calc(100vh-140px)] overflow-hidden">
          <h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-3">Receipt Details</h2>

          <div className="flex-1 overflow-y-auto mt-6 pr-1">
            {loadingDetail ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
              </div>
            ) : detailError ? (
              <div className="text-center text-red-500 py-6">{detailError}</div>
            ) : !selectedSaleDetail ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-400">
                <svg className="h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-xs">Select a transaction receipt to preview details.</p>
              </div>
            ) : (
              <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-200 font-mono text-xs text-zinc-900 space-y-4">
                {/* Header */}
                <div className="text-center border-b border-dashed border-zinc-300 pb-3">
                  <p className="font-bold text-sm tracking-wider">MY-POS RECEIPT</p>
                  <p className="text-3xs text-zinc-400 mt-0.5">Terminal Receipt Log</p>
                </div>

                {/* Metadata */}
                <div className="space-y-1 text-3xs border-b border-dashed border-zinc-300 pb-3">
                  <p><b>RECEIPT ID:</b> #{selectedSaleDetail.id}</p>
                  <p><b>DATE:</b> {new Date(selectedSaleDetail.sale_date).toLocaleString()}</p>
                  <p><b>CUSTOMER:</b> {selectedSaleDetail.customer ? `${selectedSaleDetail.customer.name} (#${selectedSaleDetail.customer.id})` : "Walk-in Customer (Guest)"}</p>
                  {selectedSaleDetail.customer?.address && (
                    <p className="whitespace-normal leading-tight"><b>ADDRESS:</b> {selectedSaleDetail.customer.address}</p>
                  )}
                  <p><b>OPERATOR:</b> {selectedSaleDetail.user ? selectedSaleDetail.user.name : "System Cashier"}</p>
                </div>

                {/* Items */}
                <div className="space-y-2 border-b border-dashed border-zinc-300 pb-3">
                  <div className="flex justify-between font-bold text-3xs">
                    <span>ITEM</span>
                    <span className="w-12 text-center">QTY</span>
                    <span className="w-12 text-right">TOTAL</span>
                  </div>
                  {selectedSaleDetail.sale_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-3xs text-zinc-700">
                      <span className="truncate max-w-[120px]">{item.product ? item.product.name : "Unknown Product"}</span>
                      <span className="w-12 text-center">x{item.quantity}</span>
                      <span className="w-12 text-right">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="space-y-1 border-b border-dashed border-zinc-200 pb-3 text-3xs text-zinc-700">
                  <div className="flex justify-between">
                    <span>SUBTOTAL:</span>
                    <span>₹{(Number(selectedSaleDetail.total_amount) + Number(selectedSaleDetail.discount_amount)).toFixed(2)}</span>
                  </div>
                  {Number(selectedSaleDetail.discount_amount) > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>LOYALTY DISCOUNT (5%):</span>
                      <span>-₹{Number(selectedSaleDetail.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between font-extrabold text-sm text-right pt-1">
                  <span>TOTAL:</span>
                  <span>₹{Number(selectedSaleDetail.total_amount).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
