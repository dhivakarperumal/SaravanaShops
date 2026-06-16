import React, { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";
import { FaPrint } from "react-icons/fa";
import logo from "/Image/logo.png";
import { useNavigate } from "react-router-dom";
import { MdOutlineArrowBackIosNew, MdOutlineArrowForwardIos } from "react-icons/md";

const Delivery = () => {
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 20;

  const filterOrders = (order) => {
    // Normalize order date
    const orderDate = new Date(order.createdAt || order.date || order.deliveryDate);

    const now = new Date();

    // Date filter
    let dateMatch = true;
    switch (filterType) {
      case "today":
        dateMatch = orderDate.toDateString() === now.toDateString();
        break;
      case "week": {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());
        firstDayOfWeek.setHours(0, 0, 0, 0);

        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23, 59, 59, 999);

        dateMatch = orderDate >= firstDayOfWeek && orderDate <= lastDayOfWeek;
        break;
      }
      case "month":
        dateMatch =
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear();
        break;
      case "custom":
        if (customFrom && customTo) {
          const from = new Date(customFrom); from.setHours(0, 0, 0, 0);
          const to = new Date(customTo); to.setHours(23, 59, 59, 999);
          dateMatch = orderDate >= from && orderDate <= to;
        }
        break;
      default:
        dateMatch = true;
    }

    // Search filter
    const searchMatch =
      order.orderId?.toLowerCase().includes(searchText.toLowerCase()) ||
      order.docketNumber?.toLowerCase().includes(searchText.toLowerCase());

    return dateMatch && searchMatch;
  };


  const navigate = useNavigate()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders");
        if (!res.data || !res.data.success) {
          throw new Error("Failed to load orders");
        }
        const fetched = res.data.data;

        // ✅ Filter only delivered orders
        const delivered = fetched.filter((order) => order.status === "Delivered");

        // ✅ Sort by Order ID (descending) — show newest orders first
        const sortedDelivered = delivered.sort((a, b) => {
          const idA = parseInt((a.orderId || "").replace(/\D/g, "")) || 0;
          const idB = parseInt((b.orderId || "").replace(/\D/g, "")) || 0;
          return idB - idA;
        });

        setDeliveredOrders(sortedDelivered);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders");
      }
    };

    fetchOrders();
  }, []);


  const handlePrint = (order) => {
    if (!order) return;

    const logoUrl = logo;
    const items = Array.isArray(order.items) ? order.items : [];

    const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

    const itemsHTML = items
      .map((i, index) => `
      <tr>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">${index + 1}</td>
        <td style="border:1px solid #ddd;padding:10px;display:flex;align-items:center;gap:10px;">
          <img src="${i.image || ""}" alt="${i.name || ""}" 
            style="width:50px;height:50px;object-fit:cover;border-radius:5px;border:1px solid #ddd;" />
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
          <h3 style="font-size:20px;margin-bottom:10px;">To:</h3>
          <h3 style="font-size:20px;margin-bottom:10px;">Customer Details</h3>
          <p><strong>Name:</strong> ${order.shipping?.name || "N/A"}</p>
          <p><strong>Email:</strong> ${order.shipping?.email || "N/A"}</p>
          <p><strong>Phone:</strong> ${order.shipping?.phone || "N/A"}</p>
          <p><strong>Address:</strong> ${order.shipping?.address || ""}, ${order.shipping?.city || ""}, ${order.shipping?.state || ""}, ${order.shipping?.zip || ""}</p>
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
          <p><strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</p>
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

    // Create hidden iframe for printing
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
      // Fallback
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
          try {
            document.body.removeChild(iframe);
          } catch {
            // ignore cleanup errors
          }
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

  // ===== Filter by Date =====


  // ===== Filtered and Searched Orders =====
  const filteredOrders = deliveredOrders.filter(filterOrders);


  // ===== Pagination =====
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  return (

    <div className="p-4 sm:p-6 bg-white min-h-screen">

  {/* Search & Filter */}
  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
    <input
      type="text"
      placeholder="Search Order ID / LR"
      value={searchText}
      onChange={(e) => {
        setSearchText(e.target.value);
        setCurrentPage(1);
      }}
      className="border px-3 py-2 rounded w-full sm:max-w-[300px]"
    />

    <div className="flex flex-wrap gap-2">
      <select
        value={filterType}
        onChange={(e) => {
          setFilterType(e.target.value);
          setCurrentPage(1);
        }}
        className="border px-3 py-2 rounded"
      >
        <option value="all">All</option>
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="custom">Custom</option>
      </select>

      {filterType === "custom" && (
        <>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="border px-2 py-2 rounded text-sm"
          />
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="border px-2 py-2 rounded text-sm"
          />
        </>
      )}
    </div>
  </div>

  {/* Desktop Table */}
  <div className="hidden sm:block bg-white shadow rounded-2xl overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead className="bg-primary text-white">
        <tr>
          <th className="px-3 py-4">Order ID</th>
          <th className="px-3 py-4">Total</th>
          <th className="px-3 py-4">Type</th>
          <th className="px-3 py-4">Status</th>
          <th className="px-3 py-4">Actions</th>
        </tr>
      </thead>

      <tbody>
        {deliveredOrders.length === 0 ? (
          <tr>
            <td colSpan="5" className="py-10 text-center text-gray-500">
              🚚 No Delivered Orders Found
            </td>
          </tr>
        ) : (
          deliveredOrders.map((order) => (
            <tr
              key={order.id}
              className="text-center border border-b-gray-300 hover:bg-gray-50"
            >
              <td
                className="px-3 py-4 text-blue-600 underline cursor-pointer"
                onClick={() =>
                  navigate(`/superadmin/orders/${order.docId}?page=${currentPage}`)
                }
              >
                {order.orderId}
              </td>

              <td className="px-3 py-4 text-green-600 font-semibold">
                ₹{order.total}
              </td>

              <td className="px-3 py-4">{order.ordertype}</td>

              <td className="px-3 py-4">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  {order.status}
                </span>
              </td>

              <td className="px-3 py-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrint(order);
                  }}
                  className="text-gray-600 hover:text-black"
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

  {/* Mobile Cards */}
  <div className="sm:hidden flex flex-col gap-4">
    {deliveredOrders.length === 0 ? (
      <div className="text-center text-gray-500 py-10">
         No Delivered Orders Found
      </div>
    ) : (
      deliveredOrders.map((order) => (
        <div
          key={order.docId}
          className="border border-gray-300 rounded-xl shadow-sm p-4 bg-white flex flex-col gap-2"
        >
          <div
            className="text-blue-600 font-semibold underline"
            onClick={() =>
              navigate(`/superadmin/orders/${order.docId}?page=${currentPage}`)
            }
          >
            {order.orderId}
          </div>

          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-500">Total</span>
            <span className="text-green-600 font-semibold">
              ₹{order.total}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-500">Type</span>
            <span>{order.ordertype}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-500">Status</span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
              {order.status}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-500">Docket</span>
            <span>{order.docketNumber || "-"}</span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrint(order);
              }}
              className="text-gray-600 hover:text-black text-lg"
            >
              <FaPrint />
            </button>
          </div>
        </div>
      ))
    )}
  </div>

  {/* Pagination */}
  {totalPages > 1 && (
    <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
      <button
        onClick={() =>
          setCurrentPage((prev) => Math.max(prev - 1, 1))
        }
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
        onClick={() =>
          setCurrentPage((prev) =>
            Math.min(prev + 1, totalPages)
          )
        }
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

export default Delivery;