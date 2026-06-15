import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { FaTimes, FaPrint } from "react-icons/fa";
import { MdOutlineArrowBackIosNew, MdOutlineArrowForwardIos } from "react-icons/md";
import { toast } from "react-hot-toast";
import logo from "/Image/logo.png";

const CancelOrders = () => {
  const [cancelledOrders, setCancelledOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // --- Date Filtering Helper ---

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const fetched = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          docId: doc.id,
        }));

        // ✅ Filter only cancelled orders
        const cancelled = fetched.filter(
          (order) => order.status === "Cancelled"
        );

        // ✅ Sort by Order ID (ascending)
        const sortedCancelled = cancelled.sort((a, b) => {
          // Extract numbers from orderId safely
          const idA = parseInt(a.orderId?.replace(/\D/g, "")) || 0;
          const idB = parseInt(b.orderId?.replace(/\D/g, "")) || 0;
          return idA - idB;
        });

        setCancelledOrders(sortedCancelled);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders");
      }
    };

    fetchOrders();
  }, []);

  const filterByDate = (orderDate) => {
    const date = new Date(orderDate);
    const today = new Date();

    if (filterType === "today") {
      return date.toDateString() === today.toDateString();
    }
    if (filterType === "week") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return date >= startOfWeek && date <= endOfWeek;
    }
    if (filterType === "month") {
      return (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    }
    if (filterType === "custom" && customFrom && customTo) {
      return date >= new Date(customFrom) && date <= new Date(customTo);
    }
    return true; // all
  };

  // --- Apply Search & Filters ---
  const filteredOrders = cancelledOrders
    .filter((order) => filterByDate(order.date))
    .filter((order) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        order.orderId?.toLowerCase().includes(term) ||
        order.uid?.toLowerCase().includes(term) ||
        order.shippingAddress?.fullname?.toLowerCase().includes(term)
      );
    });

  // --- Pagination ---
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Print invoice for cancelled order using hidden iframe
  const handlePrint = (order) => {
    if (!order) return;

    const logoUrl = logo;
    const items = Array.isArray(order.items) ? order.items : [];

    const itemsHTML = items
      .map((i, index) => `
      <tr>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">${index + 1}</td>
        <td style="border:1px solid #ddd;padding:10px;display:flex;align-items:center;gap:10px;">
          <img src="${i.image || ""}" alt="${i.name || ""}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;border:1px solid #ddd;" />
          <span>${i.name || ""}</span>
        </td>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">${i.quantity || 0}</td>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">₹${Number(i.price || 0).toFixed(2)}</td>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">₹${Number((i.quantity || 0) * (i.price || 0)).toFixed(2)}</td>
      </tr>`)
      .join("");

    const html = `
    <div id="printableArea" style="font-family: Arial, sans-serif; color: #333; padding: 30px;">
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #8c52ff;padding-bottom:10px;margin-bottom:20px;">
        <img src="${logoUrl}" style="height:60px;" />
        <div style="font-size:28px;color:#8c52ff;font-weight:bold;">Order Invoice</div>
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:20px;flex-wrap:wrap;">
        <div style="width:48%; min-width:240px; font-size:16px;">
          <h3 style="font-size:20px;margin-bottom:10px;">Customer Details</h3>
          <p><strong>Name:</strong> ${order.shipping?.name || "N/A"}</p>
          <p><strong>Email:</strong> ${order.shipping?.email || "N/A"}</p>
          <p><strong>Phone:</strong> ${order.shipping?.phone || "N/A"}</p>
          <p><strong>Address:</strong> ${order.shipping?.address || ""}, ${order.shipping?.city || ""}, ${order.shipping?.state || ""}, ${order.shipping?.zip || ""}</p>
          <p><strong>Country:</strong> ${order.shipping?.country || ""}</p>
        </div>

        <div style="width:48%; min-width:240px; font-size:16px;">
          <h3 style="font-size:20px;margin-bottom:10px;">Order Details</h3>
          <p><strong>Order ID:</strong> ${order.orderId || "-"}</p>
          <p><strong>Status:</strong> ${order.status || "-"}</p>
          <p><strong>Payment:</strong> ${order.ordertype || "Online"}</p>
          <p><strong>Date:</strong> ${order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : "N/A"}</p>
        </div>
      </div>

      <h3 style="margin-top:30px;font-size:20px;">Items</h3>
      <table style="width:100%;border-collapse:collapse;margin-top:15px;">
        <thead>
          <tr style="background:#f9f9f9;">
            <th style="border:1px solid #ddd;padding:10px;text-align:center;">ID</th>
            <th style="border:1px solid #ddd;padding:10px;text-align:center;">Item</th>
            <th style="border:1px solid #ddd;padding:10px;text-align:center;">Qty</th>
            <th style="border:1px solid #ddd;padding:10px;text-align:center;">Price</th>
            <th style="border:1px solid #ddd;padding:10px;text-align:center;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div style="margin-top:20px;border-top:2px solid #8c52ff;padding-top:10px;font-weight:bold;">
        <p>Subtotal: ₹${Number(order.subtotal || 0).toFixed(2)}</p>
        <p>Shipping: ₹${Number(order.shippingCost || 0).toFixed(2)}</p>
        <p>Total: ₹${Number(order.total || 0).toFixed(2)}</p>
      </div>

      <div style="text-align:center;margin-top:40px;font-size:13px;color:#666;border-top:1px solid #ccc;padding-top:10px;">
        Thank you for shopping with <strong>Sri Saravana Shoppings</strong>!<br />
        For any support, contact us at support@saravanashoppings.in
      </div>
    </div>
  `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = (iframe.contentWindow && iframe.contentWindow.document) || iframe.contentDocument;

    try {
      doc.open();
      doc.write(`<!doctype html><html><head><title>Invoice - ${order.orderId || ""}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${html}</body></html>`);
      doc.close();
    } catch (err) {
      console.error("Error writing to print iframe:", err);
      document.body.removeChild(iframe);
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = html;
      window.print();
      document.body.innerHTML = originalContent;
      return;
    }

    const triggerPrint = () => {
      try {
        const win = iframe.contentWindow || iframe;
        win.focus && win.focus();
        win.print && win.print();
      } catch {
        // ignore
      } finally {
        setTimeout(() => {
          try { document.body.removeChild(iframe); } catch { /* ignore */ }
        }, 500);
      }
    };

    const imgs = doc.getElementsByTagName("img") || [];
    if (imgs.length === 0) {
      setTimeout(triggerPrint, 300);
    } else {
      let loaded = 0;
      let errored = 0;
      for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i];
        if (img.complete) {
          loaded++;
          if (loaded + errored === imgs.length) triggerPrint();
        } else {
          img.addEventListener("load", () => {
            loaded++;
            if (loaded + errored === imgs.length) triggerPrint();
          });
          img.addEventListener("error", () => {
            errored++;
            if (loaded + errored === imgs.length) triggerPrint();
          });
        }
      }
      setTimeout(triggerPrint, 4000);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white min-h-screen">
      {/* Search + Filter */}
      <div className="flex flex-col justify-between sm:flex-row gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Search by Order ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded w-full sm:w-1/3"
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border px-3 py-2 rounded cursor-pointer"
        >
          <option value="all">All</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom Range</option>
        </select>

        {filterType === "custom" && (
          <div className="flex gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="border px-2 py-1 rounded"
            />
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="border px-2 py-1 rounded"
            />
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-white shadow rounded-2xl overflow-x-auto">
        <table className="min-w-full text-sm rounded-lg overflow-hidden">
          <thead className="bg-primary text-white">
            <tr>
              <th className="px-3 py-4">Order ID</th>
              <th className="px-3 py-4">Payment Type</th>
              <th className="px-3 py-4">Total</th>
              <th className="px-3 py-4">Status</th>
              <th className="px-3 py-4">Reason</th>
              <th className="px-3 py-4">Print</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order) => (
              <tr key={order.id} className="text-center border border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-4">{order.orderId}</td>
                    <td className="px-3 py-4">{order.ordertype}</td>
                    <td className="px-3 py-4 text-green-600 font-semibold">₹ {order.total}</td>
                    <td className="px-3 py-4"><span className="bg-red-300 rounded-2xl p-2">{order.status}</span></td>
                    <td className="px-3 py-4 text-red-500">{order.cancelReasons || order.cancelReason}</td>
                    <td className="px-3 py-4 text-center">
                      <button onClick={() => handlePrint(order)} className="text-gray-600 hover:text-black">
                        <FaPrint />
                      </button>
                    </td>
                  </tr>
            ))}
            {currentOrders.length === 0 && (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">
                  No cancelled orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden flex flex-col gap-4">
        {currentOrders.map((order) => (
          <div key={order.id} className="border rounded-lg shadow p-4 bg-white">
            <div className="font-semibold mb-2">{order.orderId}</div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">Payment:</span>{" "}
              {order.ordertype}
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">Total:</span>
              <span className="text-green-600 font-semibold">₹ {order.total}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">Status:</span>
              <span className="bg-red-300 rounded-2xl p-1 ml-2">{order.status}</span>
            </div>
            <div className="flex justify-between mb-1 text-red-500">
              <span className="font-medium">Reason:</span>{" "}
              {order.cancelReasons || order.cancelReason || "-"}
            </div>
            <div className="flex justify-end mt-2">
              <button onClick={() => handlePrint(order)} className="text-gray-600 hover:text-black">
                <FaPrint />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex  justify-center items-center  gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <MdOutlineArrowBackIosNew />
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`cursor-pointer px-3 py-1 border rounded-full ${
                currentPage === i + 1
                  ? "bg-primary text-white"
                  : "bg-white text-primary"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            <MdOutlineArrowForwardIos />
          </button>
        </div>
      )}
    </div>
  );
};

export default CancelOrders;
