import React, { useEffect, useState } from "react";
import api from "../../api";
import { FaPrint } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "/Image/logo.png";
import {
  MdOutlineArrowBackIosNew,
  MdOutlineArrowForwardIos,
} from "react-icons/md";

const AllOrders = () => {
  const safeIndex = (arr, val) => (Array.isArray(arr) ? arr.indexOf(val) : -1);

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelInput, setShowCancelInput] = useState(null);
  const [showDocketInput, setShowDocketInput] = useState(null);
  const [docketNumber, setDocketNumber] = useState("");
  const [qname, setQname] = useState("");
  const [searchText, setSearchText] = useState("");
  const [dateFilter, setDateFilter] = useState("All");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const statusOrder = ["Placed", "Packing", "Shipped", "Delivered", "Cancelled"];

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Restore page from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pageFromQuery = Number(params.get("page"));
    if (pageFromQuery && pageFromQuery > 0) {
      setCurrentPage(pageFromQuery);
    }
  }, [location.search]);

  // ✅ Update URL when page changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set("page", currentPage);
    navigate({ search: params.toString() }, { replace: true });
  }, [currentPage]);

  // ✅ Fetch Orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders");
        if (!res.data || !res.data.success) {
          throw new Error("Failed to load orders");
        }
        const fetched = res.data.data;

        const sorted = fetched.sort((a, b) => {
          const idA = parseInt((a.orderId || "").replace(/\D/g, "")) || 0;
          const idB = parseInt((b.orderId || "").replace(/\D/g, "")) || 0;
          return idB - idA;
        });

        setOrders(sorted);
      } catch (e) {
        toast.error("Failed to load orders");
      }
    };
    fetchOrders();
  }, []);

  // ✅ Filtering
  useEffect(() => {
    let temp = [...orders];
    const now = new Date();

    if (searchText.trim()) {
      temp = temp.filter(
        (o) =>
          o.orderId?.toLowerCase().includes(searchText.toLowerCase()) ||
          o.docketNumber?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    const parseDate = (o) => {
      if (o.createdAt) return new Date(o.createdAt);
      if (o.date) return new Date(o.date);
      return null;
    };

    if (dateFilter === "Today") {
      temp = temp.filter((o) => {
        const d = parseDate(o);
        return d && d.toDateString() === now.toDateString();
      });
    }

    setFilteredOrders(temp);
  }, [orders, searchText, dateFilter]);

  // ✅ Pagination
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // ✅ Navigate to order details (PRESERVE PAGE)
  const handleOrderClick = (docId) => {
    navigate(`/superadmin/orders/${docId}?page=${currentPage}`);
  };

  // rest of your existing functions (status update, print etc...)

  // ✅ Status update
  const handleStatusUpdate = async (order, newStatus) => {
    if (newStatus === "Cancelled") {
      setShowCancelInput(order.docId);
      return;
    }
    if (newStatus === "Shipped") {
      setShowDocketInput(order.docId);
      return;
    }

    try {
      const now = new Date().toISOString();
      await api.put(`/orders/${order.docId}/status`, {
        status: newStatus,
        statusUpdatedAt: now,
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.docId === order.docId ? { ...o, status: newStatus, statusUpdatedAt: now } : o
        )
      );
      toast.success("Status updated");
    } catch (e) {
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
      const now = new Date().toISOString();
      await api.put(`/orders/${order.docId}/status`, {
        status: "Cancelled",
        cancelledAt: now,
        cancelReasons: cancelReason,
        statusUpdatedAt: now,
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.docId === order.docId
            ? { ...o, status: "Cancelled", statusUpdatedAt: now }
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

  const handleDocketSubmit = async (order) => {
    try {
      const now = new Date().toISOString();
      await api.put(`/orders/${order.docId}/status`, {
        status: "Shipped",
        docketNumber,
        qname,
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
      setDocketNumber("");
      setQname("");
      toast.success("Order status updated to Shipped");
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  // ✅ Print (unchanged)
  const handlePrint = (order) => {
    if (!order) return;

    const logoUrl = logo;

    const items = Array.isArray(order.items) ? order.items : [];
    const totalQuantity = items.reduce(
      (sum, it) => sum + (Number(it.quantity) || 0),
      0
    );

    const itemsHTML = items
      .map((i, index) => {
        const sizeVal = i.size || i.Size || i.SizeName || "";
        const colorVal = i.color || i.Color || "";
        return `
      <tr>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">${index + 1}</td>
          <td style="border:1px solid #ddd;padding:10px;display:flex;align-items:center;gap:10px;">
          <img src="${i.image || ""}" alt="${(i.productName || i.name) || ""}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;border:1px solid #ddd;" />
          <div style="display:flex;flex-direction:column;">
            <span>${i.name || "N/A"}</span>
            <small style="color:#666;margin-top:4px;">${sizeVal ? 'Size: ' + sizeVal : ''}</small>
          </div>
        </td>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">${(i.productName || "N/A")} </td>
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
          <p><strong>Address:</strong> ${order.shipping?.doorNumber || ""},${order.shipping?.streetName || ""},${order.shipping?.address || ""}, ${
      order.shipping?.landmark || ""
    }, ${
      order.shipping?.city || ""
    }, ${order.shipping?.state || ""}, ${order.shipping?.zip || ""}</p>
          <p><strong>Country:</strong> ${order.shipping?.country || ""}</p>
        </div>

        <div style="width:48%; min-width:240px; font-size:16px;">
        <h3 style="font-size:20px;margin-bottom:10px;">From:</h3>
          <h3 style="font-size:20px;margin-bottom:10px;">Order Details</h3>
          <p><strong>Order ID:</strong> ${order.orderId || "-"}</p>
          <p><strong>Shop Address:</strong> Sri Saravana Bangles
                    78/3, chetty Street Tirupattur Near AVS Mahal and Jain Temple 635601
                    Ph: 7010575375</p>
          <p><strong>Status:</strong> ${order.status || "-"}</p>
          <p><strong>Payment:</strong> ${order.ordertype || "Online"}</p>
          <p><strong>Date:</strong> ${
            order.createdAt
              ? new Date(order.createdAt).toLocaleString()
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
            <th style="border:1px solid #ddd;padding:10px;text-align:center;">Name</th>
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

    const fullDoc = `<!doctype html><html><head><title>Invoice - ${order.orderId || ""}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${html}</body></html>`;

    // Try opening a new window first (more reliable on mobile browsers)
    try {
      const newWin = window.open("", "_blank");
      if (newWin) {
        newWin.document.open();
        newWin.document.write(fullDoc);
        newWin.document.close();
        try {
          newWin.focus && newWin.focus();
          // give a small delay for resources to load, then print
          setTimeout(() => {
            try {
              newWin.print && newWin.print();
            } catch (e) {
              console.error("Print error (newWin):", e);
            }
            setTimeout(() => {
              try {
                newWin.close();
              } catch {}
            }, 500);
          }, 350);
        } catch (e) {
          console.error("Focus/print error:", e);
        }
        return;
      }
    } catch (e) {
      console.warn("window.open blocked, falling back to iframe", e);
    }

    // Fallback: use hidden iframe (existing behavior)
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
      doc.write(fullDoc);
      doc.close();
    } catch (err) {
      console.error("Error writing to print iframe:", err);
      try {
        document.body.removeChild(iframe);
      } catch {}
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
      } catch (e) {
        console.error("Print error:", e);
      } finally {
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {}
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

  // ✅ Status Colors
  const getStatusColor = (status) => {
    switch (status) {
      case "Placed":
        return "bg-yellow-100 text-yellow-800";
      case "Packing":
        return "bg-blue-100 text-blue-800";
      case "Shipped":
        return "bg-purple-100 text-purple-800";
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

  {/* 🔍 Filters */}
  <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">

    {/* Search */}
    <input
      type="text"
      placeholder="Search Order ID / LR"
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      className="border p-2 rounded w-full lg:max-w-xs"
    />

    {/* Items per page */}
    <div className="flex items-center gap-2">
      <label className="text-sm whitespace-nowrap">Show:</label>
      <select
        value={itemsPerPage}
        onChange={(e) => setItemsPerPage(Number(e.target.value))}
        className="border p-2 rounded w-full sm:w-auto"
      >
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
        <option value={150}>150</option>
        <option value={200}>200</option>
      </select>
    </div>

    {/* Date filter */}
    <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
      <select
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
        className="border p-2 rounded w-full sm:w-auto"
      >
        <option value="All">All</option>
        <option value="Today">Today</option>
        <option value="This Week">This Week</option>
        <option value="This Month">This Month</option>
        <option value="Custom">Custom Range</option>
      </select>

      {dateFilter === "Custom" && (
        <div className="flex gap-2">
          <input
            type="date"
            value={customRange.from}
            onChange={(e) =>
              setCustomRange({ ...customRange, from: e.target.value })
            }
            className="border p-2 rounded w-full"
          />
          <input
            type="date"
            value={customRange.to}
            onChange={(e) =>
              setCustomRange({ ...customRange, to: e.target.value })
            }
            className="border p-2 rounded w-full"
          />
        </div>
      )}
    </div>
  </div>

  {/* 📊 Pagination Info */}
  <div className="text-sm text-gray-600 mb-2">
    Showing {filteredOrders.length === 0 ? 0 : indexOfFirst + 1} to{" "}
    {Math.min(indexOfLast, filteredOrders.length)} of{" "}
    {filteredOrders.length} entries
  </div>

  {/* 🖥 Desktop Table */}
  <div className="hidden md:block overflow-x-auto  rounded-xl">
    <table className="min-w-full text-sm">
      <thead className="bg-primary text-white">
        <tr>
          <th className="p-2 md:p-3">Order ID</th>
          <th className="p-2 md:p-3">Payment</th>
          <th className="p-2 md:p-3">Total</th>
          <th className="p-2 md:p-3">Status</th>
          <th className="p-2 md:p-3">Action</th>
        </tr>
      </thead>

      <tbody>
        {currentOrders.length === 0 ? (
          <tr>
            <td colSpan="5" className="py-8 text-center text-gray-500">
              No Orders Found
            </td>
          </tr>
        ) : (
          currentOrders.map((order) => (
            <tr key={order.docId} className="border border-gray-300 text-center">
              <td
                className="p-2 md:p-3 text-blue-600 underline cursor-pointer"
                onClick={() =>
                  navigate(`/superadmin/orders/${order.docId}?page=${currentPage}`)
                }
              >
                {order.orderId}
              </td>

              <td>{order.ordertype}</td>

              <td className="text-green-600 font-semibold">
                ₹{order.total}
              </td>

              <td className="min-w-[160px]">
                <select
                  value={order.status}
                  onChange={(e) =>
                    handleStatusUpdate(order, e.target.value)
                  }
                  className={`${getStatusColor(
                    order.status
                  )} px-2 py-1 rounded w-full`}
                >
                  {statusOrder
                    .filter(
                      (s) =>
                        safeIndex(statusOrder, s) >=
                        safeIndex(statusOrder, order.status)
                    )
                    .map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                </select>

                {showCancelInput === order.docId && (
                  <div className="mt-2 flex gap-2">
                    <input
                      className="border rounded text-xs px-2 py-1 w-full"
                      placeholder="Reason"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                    <button
                      onClick={() => handleCancelSubmit(order)}
                      className="bg-red-600 text-white text-xs px-2 rounded"
                    >
                      OK
                    </button>
                  </div>
                )}

                {showDocketInput === order.docId && (
                  <div className="mt-2 flex gap-2">
                    <input
                      placeholder="LR No"
                      className="border text-xs px-2 py-1 rounded w-full"
                      value={docketNumber}
                      onChange={(e) => setDocketNumber(e.target.value)}
                    />
                    <input
                      placeholder="Courier"
                      className="border text-xs px-2 py-1 rounded w-full"
                      value={qname}
                      onChange={(e) => setQname(e.target.value)}
                    />
                    <button
                      onClick={() => handleDocketSubmit(order)}
                      className="bg-blue-600 text-white text-xs px-2 rounded"
                    >
                      OK
                    </button>
                  </div>
                )}
              </td>

              <td>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrint(order);
                  }}
                  className="text-lg p-1"
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

  {/* 📱 Mobile Cards */}
  <div className="md:hidden flex flex-col gap-4">
    {currentOrders.length === 0 ? (
      <div className="text-center text-gray-500 py-10">
        No Orders Found
      </div>
    ) : (
      currentOrders.map((order) => (
        <div
          key={order.docId}
          className="border rounded-xl p-4 shadow-sm flex flex-col gap-2"
        >
          <div className="flex justify-between items-start">
            <div
              className="text-blue-600 underline text-sm break-all cursor-pointer"
              onClick={() =>
                navigate(`/superadmin/orders/${order.docId}?page=${currentPage}`)
              }
            >
              {order.orderId}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrint(order);
              }}
              className="text-lg p-1"
            >
              <FaPrint />
            </button>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Payment</span>
            <span>{order.ordertype}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="text-green-600 font-semibold">
              ₹{order.total}
            </span>
          </div>

          {/* LR & Courier */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">LR No</span>
            <span>{order.docketNumber || "-"}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Courier</span>
            <span>{order.qname || "-"}</span>
          </div>

          <select
            value={order.status}
            onChange={(e) =>
              handleStatusUpdate(order, e.target.value)
            }
            className={`${getStatusColor(
              order.status
            )} px-3 py-2 rounded-lg text-sm w-full`}
          >
            {statusOrder
              .filter(
                (s) =>
                  safeIndex(statusOrder, s) >=
                  safeIndex(statusOrder, order.status)
              )
              .map((s) => (
                <option key={s}>{s}</option>
              ))}
          </select>

          {showCancelInput === order.docId && (
            <>
              <input
                className="border rounded p-2 text-sm"
                placeholder="Cancel reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <button
                onClick={() => handleCancelSubmit(order)}
                className="bg-red-600 text-white p-2 rounded text-sm"
              >
                Confirm Cancel
              </button>
            </>
          )}

          {showDocketInput === order.docId && (
            <>
              <input
                className="border rounded p-2 text-sm"
                placeholder="LR Number"
                value={docketNumber}
                onChange={(e) => setDocketNumber(e.target.value)}
              />
              <input
                className="border rounded p-2 text-sm"
                placeholder="Courier"
                value={qname}
                onChange={(e) => setQname(e.target.value)}
              />
              <button
                onClick={() => handleDocketSubmit(order)}
                className="bg-blue-600 text-white p-2 rounded text-sm"
              >
                Submit
              </button>
            </>
          )}
        </div>
      ))
    )}
  </div>

  {/* 🔢 Pagination */}
  {totalPages > 1 && (
    <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
      <button
        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="p-2 border rounded-lg disabled:opacity-40"
      >
        <MdOutlineArrowBackIosNew />
      </button>

      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i}
          onClick={() => setCurrentPage(i + 1)}
          className={`px-3 py-1 border rounded-full text-sm ${
            currentPage === i + 1
              ? "bg-primary text-white"
              : "bg-white text-primary"
          }`}
        >
          {i + 1}
        </button>
      ))}

      <button
        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="p-2 border rounded-lg disabled:opacity-40"
      >
        <MdOutlineArrowForwardIos />
      </button>
    </div>
  )}
</div>
  );
};

export default AllOrders;

