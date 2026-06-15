import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { FaPrint } from "react-icons/fa";
import logo from "/Image/logo.png";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  MdOutlineArrowBackIosNew,
  MdOutlineArrowForwardIos,
} from "react-icons/md";

const NewOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [dateFilter, setDateFilter] = useState("All");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelInput, setShowCancelInput] = useState(null);
  const [showDocketInput, setShowDocketInput] = useState(null);
  const [docketNumber, setDocketNumber] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [qname, setQname] = useState("");

  const itemsPerPage = 10;

  const navigate = useNavigate();

  const statusOrder = [
    "Placed",
    "Packing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];


  useEffect(() => {
    let temp = [...orders];
    const now = new Date();

    // 🔹 Search Filter
    if (searchText.trim()) {
      temp = temp.filter(
        (o) =>
          (o.orderId || "").toLowerCase().includes(searchText.toLowerCase()) ||
          o.docketNumber?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 🔹 Date Filter (robust parser)
    const parseOrderDate = (o) => {
      try {
        if (!o) return null;
        if (o.createdAt && typeof o.createdAt.toDate === "function") return o.createdAt.toDate();
        if (o.date) return new Date(o.date);
        if (o.createdAt) return new Date(o.createdAt);
        return null;
      } catch (err) {
        console.error("parseOrderDate error:", err, o);
        return null;
      }
    };

    if (dateFilter === "Today") {
      temp = temp.filter((o) => {
        const d = parseOrderDate(o);
        return d && d.toDateString() === now.toDateString();
      });
    } else if (dateFilter === "This Week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      temp = temp.filter((o) => {
        const d = parseOrderDate(o);
        return d && d >= startOfWeek && d <= endOfWeek;
      });
    } else if (dateFilter === "This Month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startOfMonth.setHours(0, 0, 0, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      temp = temp.filter((o) => {
        const d = parseOrderDate(o);
        return d && d >= startOfMonth && d <= endOfMonth;
      });
    } else if (dateFilter === "Custom" && customRange.from && customRange.to) {
      const fromDate = new Date(customRange.from);
      const toDate = new Date(customRange.to);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);

      temp = temp.filter((o) => {
        const d = parseOrderDate(o);
        return d && d >= fromDate && d <= toDate;
      });
    }

    // 🔹 Update filtered orders
    setFilteredOrders(temp);
    setCurrentPage(1);
  }, [orders, searchText, dateFilter, customRange]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const fetched = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          docId: doc.id,
        }));

        // Filter only today's orders not Delivered/Cancelled
        const today = new Date().toDateString();
        const todayOrders = fetched.filter((order) => {
          const createdAt = order.createdAt?.toDate
            ? order.createdAt.toDate()
            : new Date(order.date);
          return (
            createdAt &&
            createdAt.toDateString() === today &&
            order.status !== "Delivered" &&
            order.status !== "Cancelled"
          );
        });

        // ✅ Sort today's orders in ascending order
        const sortedOrders = todayOrders.sort((a, b) => {
          // Sort by orderId if available, otherwise by createdAt
          if (a.orderId && b.orderId) {
            const idA = parseInt(a.orderId.replace(/\D/g, "")) || 0;
            const idB = parseInt(b.orderId.replace(/\D/g, "")) || 0;
            return idA - idB;
          }

          // fallback: sort by createdAt (oldest first)
          const dateA = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(a.date);
          const dateB = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(b.date);
          return dateA - dateB;
        });

        setOrders(sortedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders");
      }
    };

    fetchOrders();
  }, []);

  // Pagination
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Status update
  const handleStatusUpdate = async (order, newStatus) => {
    if (!order) return;

    if (newStatus === "Cancelled") {
      setShowCancelInput(order.docId);
      setShowDocketInput(null);
      return;
    }

    if (newStatus === "Shipped") {
      setShowDocketInput(order.docId);
      setShowCancelInput(null);
      return;
    }

    try {
      await updateDoc(doc(db, "orders", order.docId), {
        status: newStatus,
        statusUpdatedAt: new Date().toISOString(),
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.docId === order.docId
            ? {
              ...o,
              status: newStatus,
              statusUpdatedAt: new Date().toISOString(),
            }
            : o
        )
      );
      setShowCancelInput(null);
      setShowDocketInput(null);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleCancelSubmit = async (order) => {
    if (!order) return;
    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    try {
      await updateDoc(doc(db, "orders", order.docId), {
        status: "Cancelled",
        cancelledAt: new Date().toISOString(),
        cancelReasons: cancelReason,
        statusUpdatedAt: new Date().toISOString(),
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.docId === order.docId
            ? {
              ...o,
              status: "Cancelled",
              statusUpdatedAt: new Date().toISOString(),
            }
            : o
        )
      );

      setShowCancelInput(null);
      setCancelReason("");
      toast.success("Order cancelled successfully");
    } catch (err) {
      console.error("Error cancelling order:", err);
      toast.error("Failed to cancel order");
    }
  };

  // Submit docket number for Shipped status
  const handleDocketSubmit = async (order) => {
    if (!order) return;
    if (!docketNumber.trim()) {
      toast.error("Please enter a docket number");
      return;
    }

    try {
      const now = new Date().toISOString();

      await updateDoc(doc(db, "orders", order.docId), {
        status: "Shipped",
        docketNumber: docketNumber,
        qname: qname,
        statusUpdatedAt: now,
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.docId === order.docId
            ? { ...o, status: "Shipped", docketNumber, qname, statusUpdatedAt: now }
            : o
        )
      );

      setShowDocketInput(null);
      setQname(null)
      setDocketNumber("");
      setQname("")
      toast.success("Order status updated to Shipped");
    } catch (err) {
      console.error("Error updating docket:", err);
      toast.error("Failed to update order");
    }
  };

  const handlePrint = (order) => {
    if (!order) return;
    const logoUrl = logo;
    const items = Array.isArray(order.items) ? order.items : [];

    const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

    const itemsHTML = items
      .map((i, index) => {
        const sizeVal = i.size || i.Size || i.SizeName || "";
        const _colorVal = i.color || i.Color || "";
        return `
      <tr>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">${index + 1}</td>
        <td style="border:1px solid #ddd;padding:10px;display:flex;align-items:center;gap:10px;">
          <img src="${i.image || ""}" alt="${i.name || ""}" 
            style="width:50px;height:50px;object-fit:cover;border-radius:5px;border:1px solid #ddd;" />
         
            <div style="display:flex;flex-direction:column;">
            <span>${i.name || ""}</span>
            <small style="color:#666;margin-top:4px;">${sizeVal ? 'Size: ' + sizeVal : ''}</small>
          </div>
        </td>
        
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">${i.quantity || 0}</td>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">₹${Number(i.price || 0).toFixed(2)}</td>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">₹${Number((i.quantity || 0) * (i.price || 0)).toFixed(2)}</td>
      </tr>`;
      })
      .join("");

    const html = `
    <div id="printableArea" style="font-family: Arial, sans-serif; color: #333; padding: 30px;">
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #8c52ff;padding-bottom:10px;margin-bottom:20px;">
        <img src="${logoUrl}" style="height:60px;" />
        <div style="font-size:28px;color:#8c52ff;font-weight:bold;">Order Invoice</div>
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:20px;flex-wrap:wrap;">
        <div style="width:48%; min-width:240px; font-size:16px;">
          <h3 style="font-size:20px;margin-bottom:10px;">To:</h3>
          <h3 style="font-size:20px;margin-bottom:10px;">Customer Details</h3>
          <p><strong>Name:</strong> ${order.shipping?.name || "N/A"}</p>
          
          <p><strong>Phone:</strong> ${order.shipping?.phone || "N/A"}</p>
          <p><strong>Address:</strong> ${order.shipping?.address || ""}, ${order.shipping?.city || ""
      }, ${order.shipping?.state || ""}, ${order.shipping?.zip || ""}</p>
          <p><strong>Country:</strong> ${order.shipping?.country || ""}</p>
        </div>

        <div style="width:48%; min-width:240px; font-size:16px;">
          <h3 style="font-size:20px;margin-bottom:10px;">From:</h3>
          <h3 style="font-size:20px;margin-bottom:10px;">Order Details</h3>
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Shop Address:</strong> Sri Saravana Bangles
                    78/3, chetty Street Tirupattur Near AVS Mahal and Jain Temple 635601
                    Ph: 7010575375</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Payment:</strong> ${order.ordertype || "Online"}</p>
          <p><strong>Date:</strong> ${order.createdAt?.toDate
        ? order.createdAt.toDate().toLocaleString()
        : "N/A"
      }</p>
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
        <p>Overall Qty: ${totalQuantity}</p>
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

    // Create hidden iframe and print (same approach as AllOrders)
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
      doc.write(`<!doctype html><html><head><title>Invoice - ${order.orderId}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${html}</body></html>`);
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Placed":
        return "bg-yellow-100 text-yellow-800";
      case "Packing":
        return "bg-blue-100 text-blue-800";
      case "Shipped":
        return "bg-purple-100 text-purple-800";
      case "Out for Delivery":
        return "bg-orange-100 text-orange-800";
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white min-h-screen">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-center justify-between">
        <input
          type="text"
          placeholder="Search by Order ID or Docket Number"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="border p-2 rounded w-full sm:w-1/3"
        />
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border p-2 rounded cursor-pointer"
        >
          <option value="All">All</option>
          <option value="Today">Today</option>
          <option value="This Week">This Week</option>
          <option value="This Month">This Month</option>
          <option value="Custom">Custom Range</option>
        </select>
        {dateFilter === "Custom" && (
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={customRange.from}
              onChange={(e) =>
                setCustomRange({ ...customRange, from: e.target.value })
              }
              className="border p-2 rounded"
            />
            <span>→</span>
            <input
              type="date"
              value={customRange.to}
              onChange={(e) =>
                setCustomRange({ ...customRange, to: e.target.value })
              }
              className="border p-2 rounded"
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
              <th className="px-3 py-4">Payment</th>
              <th className="px-3 py-4">Total</th>
              <th className="px-3 py-4">Status</th>              
              <th className="px-3 py-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {currentOrders.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-6 text-gray-500 font-medium"
                >
                  No Orders Found
                </td>
              </tr>
            ) : (
              currentOrders.map((order) => (
                <tr
                  key={order.docId}
                  className="text-center border border-gray-200 hover:bg-gray-50"
                >
                  <td
                    className="px-3 py-4 text-blue-600 underline cursor-pointer"
                    onClick={() => navigate(`/superadmin/orders/${order.docId}?page=${currentPage}`)}
                  >
                    {order.orderId}
                  </td>
                  {/* 🔹 Removed Order ID column */}
                  <td className="px-3 py-4">{order.ordertype || "-"}</td>
                  <td className="px-3 py-4 text-green-600 font-semibold">
                    ₹{order.total}
                  </td>
                  <td className="px-3 py-4 w-120">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusUpdate(order, e.target.value)
                      }
                      className={
                        getStatusColor(order.status) +
                        " px-2 py-1 rounded w-full cursor-pointer"
                      }
                    >
                      {statusOrder
                        .filter(
                          (status) =>
                            statusOrder.indexOf(status) >=
                            statusOrder.indexOf(order.status)
                        )
                        .map((status) => (
                          <option key={status} value={status}>
                            {status === "Placed" ? "Order Placed" : status}
                          </option>
                        ))}
                    </select>

                    {showCancelInput === order.docId && (
                      <div className="mt-3 px-1 ">
                        <input
                          className="w-1/4 border border-gray-500 rounded text-xs px-3 py-2"
                          placeholder="Reason for cancellation"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                        />
                        <button
                          onClick={() => handleCancelSubmit(order)}
                          className="mt-1 ml-2 bg-red-400 font-bold hover:bg-red-700 text-white text-xs px-3 py-2 rounded cursor-pointer"
                        >
                          Confirm
                        </button>
                      </div>
                    )}

                    {showDocketInput === order.docId && (
                      <div className="mt-3  ">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter Docket Number"
                            className="w-1/2 border border-gray-500 rounded text-xs px-3 py-2"
                            value={docketNumber}
                            onChange={(e) => setDocketNumber(e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Enter QName "
                            className="w-1/2 border border-gray-500 rounded text-xs px-3 py-2"
                            value={qname}
                            onChange={(e) => setQname(e.target.value)}
                          />
                          <button
                            onClick={() => handleDocketSubmit(order)}
                            className="bg-blue-600 cursor-pointer ml-2 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded"
                          >
                            Submit
                          </button>
                        </div>

                      </div>
                    )}
                  </td>

                  {/* {orders.some((order) => order.status === "Shipped") && (
                    <td className="px-3 py-3">
                      {order.status === "Shipped"
                        ? order.docketNumber || "-"
                        : "-"}
                    </td>
                  )}

                  
                  {orders.some((order) => order.status === "Shipped") && (
                    <td className="px-3 py-3">
                      {order.status === "Shipped"
                        ? order.qname || "-"
                        : "-"}
                    </td>
                  )} */}


                  <td className="px-3 py-4 flex justify-center">
                    <button
                      onClick={() => handlePrint(order)}
                      className="text-gray-600 hover:text-black cursor-pointer"
                    >
                      <FaPrint />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden flex flex-col gap-4">
        {currentOrders.map((order) => (
          <div
            key={order.docId}
            className="border rounded-lg shadow p-4 bg-white"
          >
            <div
              className="text-blue-600 font-semibold underline cursor-pointer mb-2"
              onClick={() => navigate(`/superadmin/orders/${order.docId}?page=${currentPage}`)}
            >
              {order.orderId}
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">Payment:</span>{" "}
              {order.ordertype || "-"}
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">Total:</span>
              <span className="text-green-600 font-semibold">
                ₹{order.total}
              </span>
            </div>
            {/* Items summary with size/color */}
            {Array.isArray(order.items) && order.items.length > 0 && (
              <div className="mt-2">
                <div className="font-medium mb-1">Items</div>
                <ul className="text-sm space-y-1">
                  {order.items.map((it, idx) => {
                    const sizeVal = it.size || it.Size || it.SizeName || "";
                    const _colorVal = it.color || it.Color || "";
                    return (
                      <li key={idx} className="flex justify-between">
                        <div>
                          {it.productName || "N/A"}
                          {sizeVal && <span className="text-gray-500 ml-2">(Size: {sizeVal})</span>}
                          {_colorVal && <span className="text-gray-500 ml-2">(Color: {_colorVal})</span>}
                        </div>
                        <div>×{it.quantity || 1}</div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <div className="mb-1">
              <span className="font-medium">Status: </span>

              <select
                value={order.status}
                onChange={(e) => handleStatusUpdate(order, e.target.value)}
                className={
                  getStatusColor(order.status) +
                  " px-2 py-1 rounded w-full cursor-pointer"
                }
              >
                {statusOrder
                  .filter(
                    (status) =>
                      statusOrder.indexOf(status) >=
                      statusOrder.indexOf(order.status)
                  )
                  .map((status) => (
                    <option key={status} value={status}>
                      {status === "Placed" ? "Order Placed" : status}
                    </option>
                  ))}
              </select>

              {showCancelInput === order.docId && (
                <div className="mt-2">
                  <input
                    className="w-full border border-gray-500 rounded text-xs px-3 py-2"
                    placeholder="Reason for cancellation"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <button
                    onClick={() => handleCancelSubmit(order)}
                    className="mt-2 w-full bg-red-400 font-bold hover:bg-red-700 text-white text-xs px-3 py-2 rounded cursor-pointer"
                  >
                    Confirm
                  </button>
                </div>
              )}

              {showDocketInput === order.docId && (
                <div className="mt-2">
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Enter Docket Number"
                      className="w-full border border-gray-500 rounded text-xs px-3 py-2"
                      value={docketNumber}
                      onChange={(e) => setDocketNumber(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Enter QName "
                      className="w-full border border-gray-500 rounded text-xs px-3 py-2"
                      value={qname}
                      onChange={(e) => setQname(e.target.value)}
                    />
                    <button
                      onClick={() => handleDocketSubmit(order)}
                      className="bg-blue-600 cursor-pointer ml-2 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded"
                    >
                      Submit
                    </button>
                  </div>
                  
                </div>
              )}
            </div>
            {order.status === "Shipped" && (
              <div className="mt-1">
                <span className="font-medium">Docket:</span>{" "}
                {order.docketNumber || "-"}
              </div>
            )}
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => handlePrint(order)}
                className="text-gray-600 hover:text-black"
              >
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
              className={`cursor-pointer px-3 py-1 border rounded-full ${currentPage === i + 1
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

export default NewOrders;
