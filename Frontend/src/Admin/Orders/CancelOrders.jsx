import React, { useEffect, useState, useMemo } from "react";
import api from "../../api";
import { FaPrint, FaTh, FaList, FaSearch, FaCalendarAlt, FaChevronDown } from "react-icons/fa";
import { toast } from "react-hot-toast";
import logo from "/Image/logo.png";
import { useNavigate } from "react-router-dom";
import { MdOutlineArrowBackIosNew, MdOutlineArrowForwardIos } from "react-icons/md";

const DATE_OPTIONS = [
  { label: "All", value: "All" },
  { label: "Today", value: "Today" },
  { label: "Yesterday", value: "Yesterday" },
  { label: "This Week", value: "ThisWeek" },
  { label: "Last Week", value: "LastWeek" },
  { label: "This Month", value: "ThisMonth" },
  { label: "Last Month", value: "LastMonth" },
  { label: "Custom Range", value: "Custom" },
];

export default function CancelOrders() {
  const navigate = useNavigate();

  const [orders, setOrders]                     = useState([]);
  const [searchText, setSearchText]             = useState("");
  const [dateFilter, setDateFilter]             = useState("All");
  const [customFrom, setCustomFrom]             = useState("");
  const [customTo, setCustomTo]                 = useState("");
  const [viewMode, setViewMode]                 = useState("table");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [currentPage, setCurrentPage]           = useState(1);
  const ordersPerPage = 20;

  // Fetch cancelled orders
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/orders");
        if (!res.data?.success) throw new Error();
        const cancelled = res.data.data
          .filter(o => o.status === "Cancelled")
          .sort((a, b) => {
            const idA = parseInt((a.orderId || "").replace(/\D/g, "")) || 0;
            const idB = parseInt((b.orderId || "").replace(/\D/g, "")) || 0;
            return idB - idA;
          });
        setOrders(cancelled);
      } catch {
        toast.error("Failed to load cancelled orders");
      }
    })();
  }, []);

  const parseDate = (o) => new Date(o.cancelledAt || o.createdAt || o.date || null);

  const matchesDate = (o) => {
    const d = parseDate(o);
    if (!d || isNaN(d)) return true;
    const now = new Date();
    switch (dateFilter) {
      case "Today":
        return d.toDateString() === now.toDateString();
      case "Yesterday": {
        const y = new Date(now); y.setDate(y.getDate() - 1);
        return d.toDateString() === y.toDateString();
      }
      case "ThisWeek": {
        const s = new Date(now); s.setDate(now.getDate() - now.getDay()); s.setHours(0,0,0,0);
        const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23,59,59,999);
        return d >= s && d <= e;
      }
      case "LastWeek": {
        const s = new Date(now); s.setDate(now.getDate() - now.getDay() - 7); s.setHours(0,0,0,0);
        const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23,59,59,999);
        return d >= s && d <= e;
      }
      case "ThisMonth":
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      case "LastMonth": {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
      }
      case "Custom": {
        if (!customFrom || !customTo) return true;
        const from = new Date(customFrom); from.setHours(0,0,0,0);
        const to   = new Date(customTo);   to.setHours(23,59,59,999);
        return d >= from && d <= to;
      }
      default: return true;
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const q = searchText.toLowerCase();
      const matchSearch = !q ||
        (o.orderId || "").toLowerCase().includes(q) ||
        (o.shipping?.name || "").toLowerCase().includes(q) ||
        (o.cancelReasons || "").toLowerCase().includes(q);
      return matchSearch && matchesDate(o);
    });
  }, [orders, searchText, dateFilter, customFrom, customTo]);

  const totalPages    = Math.ceil(filteredOrders.length / ordersPerPage);
  const currentOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  // Print
  const handlePrint = (order) => {
    if (!order) return;
    const items = Array.isArray(order.items) ? order.items : [];
    const totalQty = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const itemsHTML = items.map((i, idx) => `
      <tr>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">${idx + 1}</td>
        <td style="border:1px solid #ddd;padding:10px;display:flex;align-items:center;gap:10px;">
          <img src="${i.image || ""}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;" />
          <div><div>${i.name || "N/A"}</div>${i.size ? `<small style="color:#888">Size: ${i.size}</small>` : ""}</div>
        </td>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">${i.quantity || 0}</td>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">₹${Number(i.price || 0).toFixed(2)}</td>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">₹${((i.quantity || 0) * (i.price || 0)).toFixed(2)}</td>
      </tr>`).join("");

    const html = `<div style="font-family:Arial,sans-serif;color:#333;padding:30px;">
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #8c52ff;padding-bottom:10px;margin-bottom:20px;">
        <img src="${logo}" style="height:60px;" />
        <div style="font-size:28px;color:#8c52ff;font-weight:bold;">Order Invoice (Cancelled)</div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:20px;flex-wrap:wrap;">
        <div style="width:48%;min-width:240px;font-size:16px;">
          <h3 style="font-size:20px;margin-bottom:10px;">Customer Details</h3>
          <p><strong>Name:</strong> ${order.shipping?.name || "N/A"}</p>
          <p><strong>Phone:</strong> ${order.shipping?.phone || "N/A"}</p>
          <p><strong>Address:</strong> ${order.shipping?.address || ""}, ${order.shipping?.city || ""}, ${order.shipping?.state || ""} ${order.shipping?.zip || ""}</p>
        </div>
        <div style="width:48%;min-width:240px;font-size:16px;">
          <h3 style="font-size:20px;margin-bottom:10px;">Order Details</h3>
          <p><strong>Order ID:</strong> ${order.orderId || "-"}</p>
          <p><strong>Status:</strong> <span style="color:#dc2626;">Cancelled</span></p>
          <p><strong>Reason:</strong> ${order.cancelReasons || order.cancelReason || "N/A"}</p>
          <p><strong>Payment:</strong> ${order.ordertype || "Online"}</p>
          <p><strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</p>
        </div>
      </div>
      <h3 style="margin-top:30px;font-size:20px;">Items</h3>
      <table style="width:100%;border-collapse:collapse;margin-top:15px;">
        <thead><tr style="background:#f9f9f9;">
          <th style="border:1px solid #ddd;padding:10px;">ID</th>
          <th style="border:1px solid #ddd;padding:10px;">Item</th>
          <th style="border:1px solid #ddd;padding:10px;">Qty</th>
          <th style="border:1px solid #ddd;padding:10px;">Price</th>
          <th style="border:1px solid #ddd;padding:10px;">Total</th>
        </tr></thead>
        <tbody>${itemsHTML}</tbody>
      </table>
      <div style="margin-top:20px;border-top:2px solid #8c52ff;padding-top:10px;font-weight:bold;">
        <p>Overall Qty: ${totalQty}</p>
        <p>Subtotal: ₹${Number(order.subtotal || 0).toFixed(2)}</p>
        <p>Shipping: ₹${Number(order.shippingCost || 0).toFixed(2)}</p>
        <p>Total: ₹${Number(order.total || 0).toFixed(2)}</p>
      </div>
    </div>`;

    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, { position:"fixed", right:"0", bottom:"0", width:"0", height:"0", border:"0", visibility:"hidden" });
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    doc.open(); doc.write(html); doc.close();
    const triggerPrint = () => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); setTimeout(() => document.body.removeChild(iframe), 2000); };
    const imgs = doc.querySelectorAll("img");
    if (!imgs.length) { setTimeout(triggerPrint, 500); return; }
    let done = 0;
    imgs.forEach(img => {
      const fin = () => { done++; if (done === imgs.length) triggerPrint(); };
      img.addEventListener("load", fin); img.addEventListener("error", fin);
    });
    setTimeout(triggerPrint, 4000);
  };

  const selectedDateLabel = DATE_OPTIONS.find(d => d.value === dateFilter)?.label || "All";

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">

      {/* ── TOOLBAR ──────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-4 py-3 mb-5 flex flex-wrap items-center gap-3">

        {/* Left: Search + count */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchText}
              onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap font-medium">
            {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
          </span>
        </div>

        {/* Right: Date filter + view toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(d => !d)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition font-medium text-gray-700 cursor-pointer"
            >
              <FaCalendarAlt className="text-primary text-xs" />
              <span>{selectedDateLabel}</span>
              <FaChevronDown className="text-gray-400 text-xs" />
            </button>
            {showDateDropdown && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 min-w-[180px]">
                {DATE_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => { setDateFilter(opt.value); setShowDateDropdown(false); setCurrentPage(1); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-primary/5 transition cursor-pointer ${dateFilter === opt.value ? "text-primary font-semibold bg-primary/5" : "text-gray-700"}`}
                  >{opt.label}</button>
                ))}
              </div>
            )}
          </div>

          {dateFilter === "Custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={e => { setCustomFrom(e.target.value); setCurrentPage(1); }}
                className="text-sm border border-gray-200 rounded-xl px-2 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <span className="text-gray-400 text-xs">to</span>
              <input type="date" value={customTo} onChange={e => { setCustomTo(e.target.value); setCurrentPage(1); }}
                className="text-sm border border-gray-200 rounded-xl px-2 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          )}

          <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200">
            <button onClick={() => setViewMode("card")} title="Card View"
              className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === "card" ? "bg-white shadow text-primary" : "text-gray-400 hover:text-gray-600"}`}>
              <FaTh className="text-sm" />
            </button>
            <button onClick={() => setViewMode("table")} title="Table View"
              className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === "table" ? "bg-white shadow text-primary" : "text-gray-400 hover:text-gray-600"}`}>
              <FaList className="text-sm" />
            </button>
          </div>
        </div>
      </div>

      {showDateDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowDateDropdown(false)} />}

      {/* ── TABLE VIEW ─────────────────────────────── */}
      {viewMode === "table" && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="px-4 py-3.5 text-left font-semibold">S No</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Order ID</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Customer</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Date</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Payment</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Total</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Cancel Reason</th>
                  <th className="px-4 py-3.5 text-center font-semibold">Status</th>
                  <th className="px-4 py-3.5 text-center font-semibold">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentOrders.length === 0 ? (
                  <tr><td colSpan={9} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FaList className="text-4xl text-gray-200" />
                      <span className="text-sm">No cancelled orders found</span>
                    </div>
                  </td></tr>
                ) : currentOrders.map((order, idx) => (
                  <tr key={order.docId} className="hover:bg-gray-50/70 transition">
                    <td className="px-4 py-3 text-gray-400 text-xs">{(currentPage - 1) * ordersPerPage + idx + 1}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/superadmin/orders/${order.docId}`)}
                        className="text-primary font-semibold hover:underline text-sm">{order.orderId}</button>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{order.shipping?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{order.ordertype || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 text-sm">₹{Number(order.total || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-red-500 text-xs max-w-[180px] truncate" title={order.cancelReasons || order.cancelReason || "—"}>
                      {order.cancelReasons || order.cancelReason || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-red-100 text-red-700 border border-red-300 text-xs px-3 py-1 rounded-full font-medium">
                        Cancelled
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={e => { e.stopPropagation(); handlePrint(order); }}
                        className="p-2 rounded-xl hover:bg-primary/10 text-primary transition" title="Print Invoice">
                        <FaPrint />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CARD VIEW ─────────────────────────────── */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentOrders.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-400">
              <FaTh className="text-4xl text-gray-200 mx-auto mb-2" />
              <span className="text-sm">No cancelled orders found</span>
            </div>
          ) : currentOrders.map(order => (
            <div key={order.docId} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <button onClick={() => navigate(`/superadmin/orders/${order.docId}`)}
                    className="text-primary font-bold text-sm hover:underline">{order.orderId}</button>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-700 border border-red-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Cancelled
                </span>
              </div>
              <div className="text-sm text-gray-700 font-medium truncate">{order.shipping?.name || "—"}</div>
              <div className="border-t border-gray-100" />
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                <span>Payment</span>
                <span className="text-right text-gray-700 font-medium">{order.ordertype || "—"}</span>
                <span>Total</span>
                <span className="text-right text-emerald-600 font-bold">₹{Number(order.total || 0).toLocaleString("en-IN")}</span>
              </div>
              {(order.cancelReasons || order.cancelReason) && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs text-red-600">
                  <span className="font-semibold">Reason: </span>
                  {order.cancelReasons || order.cancelReason}
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={e => { e.stopPropagation(); handlePrint(order); }}
                  className="p-2 rounded-xl hover:bg-primary/10 text-primary transition" title="Print Invoice">
                  <FaPrint className="text-sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PAGINATION ─────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
          <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
            className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 transition">
            <MdOutlineArrowBackIosNew />
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setCurrentPage(i + 1)}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition ${currentPage === i + 1 ? "bg-primary text-white shadow" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
            className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 transition">
            <MdOutlineArrowForwardIos />
          </button>
        </div>
      )}
    </div>
  );
}
