import React, { useEffect, useState } from "react";
import {
  FaUser,
  FaBox,
  FaLock,
  FaMapMarkerAlt,
  FaSignOutAlt,
  FaEdit,
  FaPrint,
  FaTrash,
  FaChevronUp,
  FaChevronDown,
} from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { Link, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api";
import Head from "./Head";

const tabs = [
  { key: "personal", label: "Personal Details", icon: <FaUser /> },
  { key: "orders", label: "My Orders", icon: <FaBox /> },
  { key: "password", label: "Change Password", icon: <FaLock /> },
  { key: "address", label: "My Address", icon: <FaMapMarkerAlt /> },
];

const headData = {
  personal: {
    title: "Personal Details",
    breadcrumb: (
      <>
        <Link className="text-lg font-semibold text-white" to="/">
          Home
        </Link>
        <IoIosArrowForward className="text-lg font-bold text-white mx-1" />
        <span className="text-lg font-semibold text-white">
          Personal Details
        </span>
      </>
    ),
  },
  orders: {
    title: "My Orders",
    breadcrumb: (
      <>
        <Link className="text-lg font-semibold text-white" to="/">
          Home
        </Link>
        <IoIosArrowForward className="text-lg font-bold text-white mx-1" />
        <span className="text-lg font-semibold text-white">My Orders</span>
      </>
    ),
  },
  password: {
    title: "Change Password",
    breadcrumb: (
      <>
        <Link className="text-lg font-semibold text-white" to="/">
          Home
        </Link>
        <IoIosArrowForward className="text-lg font-bold text-white mx-1" />
        <span className="text-lg font-semibold text-white">
          Change Password
        </span>
      </>
    ),
  },
  address: {
    title: "My Address",
    breadcrumb: (
      <>
        <Link className="text-lg font-semibold text-white" to="/">
          Home
        </Link>
        <IoIosArrowForward className="text-lg font-bold text-white mx-1" />
        <span className="text-lg font-semibold text-white">My Address</span>
      </>
    ),
  },
};

//
// 🔹 PERSONAL DETAILS
//

export default function Account() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "personal");
  const [showTabs, setShowTabs] = useState(false); // 👈 for mobile dropdown toggle

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    window.location.href = "/login";
  };

  return (
    <>
      <Head
        title={headData[activeTab]?.title || "My Account"}
        subtitle={headData[activeTab]?.breadcrumb || null}
      />

      <div className="min-h-screen bg-gradient-to-br from-white to-secondary mt-16 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:w-1/4 w-full bg-white/90 backdrop-blur-md shadow-xl border-r border-secondary">
          <div className="p-6 border-b border-secondary text-center">
            <h1 className="text-2xl font-semibold text-primary tracking-wide">
              My Account
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your personal info and orders
            </p>
          </div>

          {/* 👇 Mobile dropdown toggle */}

          <div className="lg:hidden p-4 text-center">
            <button
              onClick={() => setShowTabs(!showTabs)}
              className="flex items-center cursor-pointer justify-center gap-2 w-40 bg-primary text-white py-2 rounded-lg font-medium shadow-md"
            >
              <span>
                {tabs.find((t) => t.key === activeTab)?.label || "Select Tab"}
              </span>
              {showTabs ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>

          {/* Tabs List (hidden on mobile when dropdown closed) */}
          <ul
            className={`space-y-2 p-4 transition-all duration-300 ${showTabs ? "block" : "hidden lg:block"
              }`}
          >
            {tabs.map((tab) => (
              <li key={tab.key}>
                <button
                  onClick={() => {
                    setActiveTab(tab.key);
                    setShowTabs(false);
                  }}
                  className={`flex cursor-pointer items-center gap-3 w-full px-5 py-3 rounded-lg transition-all ${activeTab === tab.key
                      ? "bg-primary text-white shadow-md"
                      : "text-gray-700 hover:bg-secondary/30 hover:text-primary"
                    }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              </li>
            ))}
            <li className="pt-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-5 py-3 rounded-lg 
             bg-gradient-to-r from-primary to-red-400 
             text-white font-medium 
             hover:from-primary/90 hover:to-red-500 
             transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <FaSignOutAlt className="text-lg" /> Logout
              </button>
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="lg:w-3/4 w-full p-6 md:p-10 bg-white/70 backdrop-blur-xl shadow-inner">
          {activeTab === "personal" && <PersonalDetails />}
          {activeTab === "orders" && <Orders />}
          {activeTab === "password" && <ChangePassword />}
          {activeTab === "address" && <UpdateAddress />}
        </main>
      </div>
    </>
  );
}

function PersonalDetails() {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/auth/profile");
        if (data.user) {
          setForm({
            fullName: data.user.username || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put("/users/profile", {
        username: form.fullName,
        phone: form.phone,
      });
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-secondary">
      <h2 className="text-2xl font-semibold mb-6 text-primary">
        Personal Details
      </h2>

      {/* ✅ Wrap in form so 'required' & pattern validation works */}
      <form onSubmit={handleSave} className="space-y-5">
        <input
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          placeholder="Full Name"
          required
          className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
        />

        <input
          name="email"
          value={form.email}
          placeholder="E-mail"
          disabled
          className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-100 text-gray-500"
        />

        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone Number"
          required
          pattern="[6-9]{1}[0-9]{9}"
          title="Enter a valid 10-digit phone number"
          className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
        />

        <button
          type="submit"
          className="bg-primary pointer-events-none text-white font-medium px-6 py-3 rounded-lg hover:bg-primary/90 transition-all shadow cursor-pointer"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}

//
// 🔹 ORDERS
//
function Orders() {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const trackingSteps = ["Order Placed", "Packing", "Shipped", "Delivered"];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get("/orders/my-orders");

        setOrders(Array.isArray(data) ? data : data.orders || data.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // ✅ Open cancel popup
  const openCancelPopup = (orderId) => {
    setSelectedOrderId(orderId);
    setCancelReason("");
    setShowCancelPopup(true);
  };

  // ✅ Confirm cancel order
  const confirmCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation.");
      return;
    }

    if (!selectedOrderId) return;

    try {
      await api.put(`/orders/${selectedOrderId}/status`, {
        status: "Cancelled",
        cancelReasons: cancelReason,
      });
      toast.success("Order cancelled successfully!");
      // Update local state instead of snapshot refresh
      setOrders(orders.map(o => o.id === selectedOrderId ? { ...o, status: "Cancelled" } : o));
      setShowCancelPopup(false);
      setCancelReason("");
      setSelectedOrderId(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel order. Try again.");
    }
  };

  const handlePrint = (order) => {
    const logoUrl = "/Image/logo.png"; // Your logo path

    const itemsHTML = order.items
      .map(
        (i, index) => `
      <tr>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">${index + 1
          }</td>
        <td style="border:1px solid #ddd;padding:10px;display:flex;align-items:center;gap:10px;">
          <img src="${i.image}" alt="${i.name}" 
            style="width:50px;height:50px;object-fit:cover;border-radius:5px;border:1px solid #ddd;" />
          <span>${i.name}</span>
        </td>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">${i.quantity
          }</td>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">₹${i.price.toFixed(
            2
          )}</td>
        <td style="border:1px solid #ddd;padding:10px;text-align:center;">₹${(
            i.quantity * i.price
          ).toFixed(2)}</td>
      </tr>`
      )
      .join("");

    const html = `
    <div id="printableArea" style="font-family: Arial, sans-serif; color: #333; padding: 30px;">
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #8c52ff;padding-bottom:10px;margin-bottom:20px;">
        <img src="${logoUrl}" style="height:60px;" />
        <div style="font-size:28px;color:#8c52ff;font-weight:bold;">Order Invoice</div>
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:20px;">
        <div style="width:48%; font-size:16px;">
          <h3 style="font-size:20px;margin-bottom:10px;">Customer Details</h3>
          <p><strong>Name:</strong> ${order.shipping?.name || "N/A"}</p>
          <p><strong>Email:</strong> ${order.shipping?.email || "N/A"}</p>
          <p><strong>Phone:</strong> ${order.shipping?.phone || "N/A"}</p>
          <p><strong>Address:</strong> ${order.shipping?.address || ""}, ${order.shipping?.city || ""
      }, ${order.shipping?.state || ""}, ${order.shipping?.zip || ""}</p>
          <p><strong>Country:</strong> ${order.shipping?.country || ""}</p>
        </div>

        <div style="width:48%; font-size:16px;">
          <h3 style="font-size:20px;margin-bottom:10px;">Order Details</h3>
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Shop Address:</strong> Sri Saravana Bangles
                    78/3, chetty Street Tirupattur Near AVS Mahal and Jain Temple 635601
                    Ph: 7010575375</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Payment:</strong> ${order.paymentMethod || "Online"}</p>
          <p><strong>Date:</strong> ${order.created_at
        ? new Date(order.created_at).toLocaleString()
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
        <p>Subtotal: ₹${order.subtotal.toFixed(2)}</p>
        <p>Shipping: ₹${order.shippingCost.toFixed(2)}</p>
        <p>Total: ₹${order.total.toFixed(2)}</p>
      </div>

      <div style="text-align:center;margin-top:40px;font-size:13px;color:#666;border-top:1px solid #ccc;padding-top:10px;">
        Thank you for shopping with <strong>Sri Saravana Shoppings</strong>!<br />
        For any support, contact us at support@saravanashoppings.in
      </div>
    </div>
  `;

    // Open a new window for printing to avoid modifying the current page
    // NOTE: avoid 'noopener' so we can access the new window in all browsers
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      // Add a base tag so relative URLs (like /Image/logo.png) resolve correctly
      const baseHref = window.location.origin;
      const fullHtml = `<!doctype html><html><head><base href="${baseHref}"><title>Invoice</title></head><body>${html}</body></html>`;

      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();

      // Use onload to ensure resources are ready before printing
      const onLoaded = () => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          // if printing fails, we'll silently ignore — iframe fallback exists
        }
        // Try to close the window after a short delay (may be blocked in some browsers)
        setTimeout(() => {
          try {
            printWindow.close();
          } catch {
            /* ignored */
          }
        }, 500);
      };

      // If the window already loaded, call onLoaded, else attach listener
      if (printWindow.document.readyState === "complete") onLoaded();
      else printWindow.addEventListener("load", onLoaded);
    } else {
      // Fallback: create a hidden iframe to print without touching the main document
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.overflow = "hidden";
      document.body.appendChild(iframe);

      try {
        const idoc = iframe.contentWindow?.document || iframe.contentDocument;
        if (idoc) {
          idoc.open();
          idoc.write(`<!doctype html><html><head><title>Invoice</title></head><body>${html}</body></html>`);
          idoc.close();

          const tryPrintIframe = () => {
            try {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
              setTimeout(() => {
                try {
                  document.body.removeChild(iframe);
                } catch {
                  // ignore
                }
              }, 500);
            } catch {
              setTimeout(tryPrintIframe, 300);
            }
          };

          setTimeout(tryPrintIframe, 200);
        } else {
          // As a last resort, alert user
          alert("Unable to open print preview. Please enable popups or try a different browser.");
          try { document.body.removeChild(iframe); } catch { /* ignored */ }
        }
      } catch {
        try { document.body.removeChild(iframe); } catch { /* ignored */ }
      }
    }
  };

  if (loading) return <p>Loading orders...</p>;
  if (!orders.length)
    return <p className="text-gray-500 text-center">No orders yet.</p>;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-secondary relative">
      <h2 className="text-2xl font-semibold mb-6 text-primary">My Orders</h2>

      <div className="space-y-4">
        {orders.map((order) => {
          const safeIndex = (arr, val) => (Array.isArray(arr) ? arr.indexOf(val) : -1);
          const currentIndex = Array.isArray(trackingSteps)
            ? safeIndex(trackingSteps, order.status || trackingSteps[0])
            : -1;
          const denom = (Array.isArray(trackingSteps) && trackingSteps.length > 1) ? (trackingSteps.length - 1) : 1;
          const progressPercent = denom > 0 ? (currentIndex / denom) * 100 : 0;

          return (
            <div
              key={order.id}
              className="border border-gray-200 p-5 rounded-lg bg-gradient-to-br from-white to-secondary/20 shadow-sm"
            >
              {/* Summary Header */}
              <div
                className="flex flex-col md:flex-row justify-between cursor-pointer"
                onClick={() =>
                  setExpandedOrder(expandedOrder === order.id ? null : order.id)
                }
              >
                <span className="flex flex-row">
                  <span className="text-primary font-semibold">Order ID:</span>
                  <p className="pl-1">
                    {order.order_id || order.orderId}
                  </p>
                </span>
                <span className="flex flex-row">
                  <span className="text-primary font-semibold">Status:</span>
                  <p className="pl-1">{order.status}</p>
                </span>
                <span className="flex flex-row">
                  <span className="text-primary font-semibold">Payment:</span>
                  <p className="pl-1">
                    {order.payment_method || order.paymentMethod || "Online"}
                  </p>
                </span>
              </div>

              {/* Expanded Order */}
              {expandedOrder === order.id && (
                <div className="mt-4 border-t border-gray-300 pt-3 space-y-3">
                  {/* Items */}
                  <div className="space-y-2">
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <img
                          src={item.image}
                          className="w-16 h-16 object-cover rounded"
                          alt={item.name}
                        />

                        <div>
                          <p className="text-primary font-semibold line-clamp-1">
                            {item.product_name || item.productName || "N/A"}
                          </p>
                          {item.name && item.name !== (item.product_name || item.productName) && (
                            <p className="text-xs text-gray-500">({item.name})</p>
                          )}
                          <p>
                            {item.quantity} × ₹{item.price} = ₹
                            {(item.quantity * item.price).toFixed(2)}
                            <br />
                            Size:  {item.size}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-200 pt-2 space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>Subtotal:</span>
                      <span>₹{Number(order.subtotal || 0).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between pb-5 font-semibold">
                      <span>Shipping:</span>
                      <span>₹{Number(order.shipping_cost || order.shippingCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-primary border-t pt-2 text-lg">
                      <span>Total:</span>
                      <span>₹{Number(order.total_amount || order.total || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Tracking Section */}
                  {(order.qname || order.docketNumber) && (
                    <div className="flex mt-4 pt-3 border-t justify-between font-semibold">
                      {order.qname && (
                        <>
                          <span>Courier: </span>
                          <span>{order.qname}</span>
                        </>
                      )}
                      {order.docketNumber && (
                        <>
                          <span>Docket Number: </span>
                          <span>{order.docketNumber}</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className=" flex flex-col md:flex-row md:items-start justify-between gap-8">
                    <div className="w-full md:w-2/3">
                      <h4 className="font-semibold text-primary mb-3">
                        Order Tracking
                      </h4>



                      <>
                        {/* Desktop Horizontal Progress */}
                        <div className="relative hidden md:flex items-center justify-between w-full">
                          <div className="absolute top-[10px] left-0 w-full h-[3px] bg-gray-300 z-0"></div>
                          <div
                            className="absolute top-[10px] left-0 h-[3px] bg-primary z-0 transition-[width] duration-700 ease-in-out"
                            style={{ width: `${progressPercent}%` }}
                          ></div>

                          {trackingSteps.map((step, index) => {
                            const isActive = index <= currentIndex;
                            return (
                              <div
                                key={index}
                                className="relative z-10 flex flex-col items-center text-center flex-1"
                              >
                                <div
                                  className={`w-5 h-5 rounded-full border-2 transition-all duration-500 ${isActive
                                      ? "bg-primary border-primary scale-110 shadow-md"
                                      : "bg-white border-gray-300 scale-100"
                                    }`}
                                ></div>
                                <p
                                  className={`text-xs mt-2 ${isActive
                                      ? "text-primary font-medium"
                                      : "text-gray-400"
                                    }`}
                                >
                                  {step}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Mobile Vertical Progress */}
                        <div className="relative flex flex-col gap-5 md:hidden items-start pl-4">
                          <div className="absolute left-[25px] top-0 h-full w-[3px] bg-gray-300 z-0"></div>
                          <div
                            className="absolute left-[25px] top-0 w-[3px] bg-primary z-0 transition-[height] duration-700 ease-in-out"
                            style={{ height: `${progressPercent}%` }}
                          ></div>

                          {trackingSteps.map((step, index) => {
                            const isActive = index <= currentIndex;
                            return (
                              <div
                                key={index}
                                className="relative z-10 flex items-center mb-5 last:mb-0"
                              >
                                <div
                                  className={`w-5 h-5 rounded-full border-2 transition-all duration-500 ${isActive
                                      ? "bg-primary border-primary scale-110 shadow-md"
                                      : "bg-white border-gray-300 scale-100"
                                    }`}
                                ></div>
                                <p
                                  className={`text-sm ml-3 ${isActive
                                      ? "text-primary font-medium"
                                      : "text-gray-400"
                                    }`}
                                >
                                  {step}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </>

                    </div>

                    {/* Buttons */}
                    <div className="w-full md:w-1/3 flex flex-col md:flex-row justify-center items-center gap-3 pt-8 md:mt-0">
                      <button
                        onClick={() => handlePrint(order)}
                        className="bg-primary text-white cursor-pointer px-4 py-2 rounded-md shadow hover:opacity-90 transition w-full md:w-auto flex items-center justify-center"
                      >
                        <FaPrint className="mr-2" /> Print
                      </button>



                      {/* <button
                        onClick={() => openCancelPopup(order.id)}
                        disabled={
                          !["Order Placed", "Packing"].includes(order.status)
                        } // disable after shipped
                        className={`px-4 py-2 rounded-md cursor-pointer shadow w-full md:w-auto flex items-center justify-center transition
    ${
      ["Order Placed", "Packing"].includes(order.status)
        ? "bg-red-500 text-white hover:bg-red-600 cursor-pointer"
        : "bg-gray-300 text-gray-500 cursor-not-allowed"
    }`}
                      >
                        Cancel
                      </button> */}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cancel Popup */}
      {/* {showCancelPopup && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-primary mb-3">
              Cancel Order
            </h3>
            <textarea
              className="w-full border rounded p-2 h-24 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowCancelPopup(false)}
                className="px-4 py-2  cursor-pointer rounded border border-gray-400 hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={confirmCancelOrder}
                className="bg-red-500  cursor-pointer text-white px-4 py-2 rounded hover:bg-red-600 transition"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}

//
// 🔹 CHANGE PASSWORD
//
function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailForLink, setEmailForLink] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      setLoading(true);
      await api.put("/users/change-password", {
        currentPassword,
        newPassword
      });
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error updating password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-secondary max-w-md">
      <h2 className="text-2xl font-semibold mb-6 text-primary">
        Change Password
      </h2>
      {/* ✅ Wrap inputs in a <form> so required validation works */}
      <form onSubmit={handleChangePassword} className="space-y-4">
        {(() => {
          return (
            <>
              <input
                type="password"
                required
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border-b border-gray-400 px-4 py-3"
              />
              <input
                type="password"
                required
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                className="w-full border-b border-gray-400 px-4 py-3"
              />
              <input
                type="password"
                required
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border-b border-gray-400 px-4 py-3"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white w-full py-3 rounded-lg cursor-pointer"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </>
          );
        })()}
      </form>
    </div>
  );
}

//
// 🔹 UPDATE ADDRESS
//


function UpdateAddress() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({
    id: "",
    firstname: "",
    lastname: "",
    contact: "",
    doorNumber: "",
    streetName: "",
    address: "",
    landmark: "",
    city: "",
    state: "",
    pin: "",
  });

  const [errors, setErrors] = useState({});
  const fetchAddresses = async () => {
    try {
      const { data } = await api.get("/addresses");
      setAddresses(data);
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!form.firstname.trim()) newErrors.firstname = "First name required";
    if (!form.lastname.trim()) newErrors.lastname = "Last name required";

    // Phone validation (exactly 10 digits starting with 6-9)
    if (!form.contact) {
      newErrors.contact = "Phone number required";
    } else if (!/^[6-9]\d{9}$/.test(form.contact)) {
      newErrors.contact = "Enter valid 10-digit mobile number";
    }

    // Door Number validation
    if (!form.doorNumber.trim()) newErrors.doorNumber = "Door number required";

    // Street Name validation
    if (!form.streetName.trim()) newErrors.streetName = "Street name required";

    // Address validation
    if (!form.address.trim()) newErrors.address = "Address required";
    if (!form.landmark.trim()) newErrors.landmark = "Landmark required";
    if (!form.city.trim()) newErrors.city = "City required";
    if (!form.state.trim()) newErrors.state = "State required";

    // PIN validation (exactly 6 digits)
    if (!form.pin) {
      newErrors.pin = "PIN code required";
    } else if (!/^\d{6}$/.test(form.pin)) {
      newErrors.pin = "Enter valid 6-digit pincode";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;

    // Special handling for contact and pin
    if (name === 'contact') {
      updatedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'pin') {
      updatedValue = value.replace(/\D/g, '').slice(0, 6);
    }

    setForm(prev => ({ ...prev, [name]: updatedValue }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    // Check for duplicate address
    const isDuplicate = addresses.some(
      (a) =>
        a.id !== form.id &&
        a.doorNumber === form.doorNumber &&
        a.streetName === form.streetName &&
        a.address === form.address &&
        a.landmark === form.landmark &&
        a.city === form.city &&
        a.state === form.state &&
        a.pin === form.pin
    );

    if (isDuplicate) {
      return toast.error("This address already exists!");
    }

    try {
      const addressData = {
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        contact: form.contact,
        doorNumber: form.doorNumber.trim(),
        streetName: form.streetName.trim(),
        address: form.address.trim(),
        landmark: form.landmark.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pin: form.pin
      };

      if (form.id) {
        await api.put(`/addresses/${form.id}`, addressData);
        toast.success("Address updated successfully!");
      } else {
        await api.post("/addresses", addressData);
        toast.success("Address added successfully!");
      }

      // Reset form and refresh addresses
      setForm({
        id: "",
        firstname: "",
        lastname: "",
        contact: "",
        doorNumber: "",
        streetName: "",
        address: "",
        landmark: "",
        city: "",
        state: "",
        pin: "",
      });
      setErrors({});
      fetchAddresses();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save address");
    }
  };

  const handleEdit = (addr) => setForm(addr);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await api.delete(`/addresses/${id}`);
      toast.success("Address deleted!");
      setAddresses((prev) => prev.filter((a) => a.id !== id));

      if (form.id === id) {
        setForm({
          id: "",
          firstname: "",
          lastname: "",
          contact: "",
          doorNumber: "",
          streetName: "",
          address: "",
          landmark: "",
          city: "",
          state: "",
          pin: "",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete address");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Saved addresses */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-secondary">
        <h3 className="text-xl font-semibold mb-6 text-primary">
          Saved Addresses
        </h3>
        {!addresses.length ? (
          <p className="text-gray-500">No addresses saved yet.</p>
        ) : (
          <ul className="space-y-4">
            {addresses.map((a) => (
              <li
                key={a.id}
                className="p-4 border border-gray-300 rounded-lg flex justify-between items-start bg-gradient-to-r from-white to-secondary/20 shadow-sm"
              >
                <div>
                  <p className="font-semibold">
                    {a.firstname} {a.lastname}
                  </p>
                  <p className="text-sm text-gray-600">
                    {a.doorNumber}, {a.streetName},
                    <br />{a.address}
                    {a.landmark && <><br />{a.landmark}</>}
                    <br />{a.city}, {a.state} - {a.pin}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Contact: {a.contact}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setForm(a)} className="text-blue-500 cursor-pointer hover:text-blue-600">
                    <FaEdit size={18} />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="text-red-500 cursor-pointer hover:text-red-600">
                    <FaTrash size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Address form */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-secondary">
        <h3 className="text-xl font-semibold mb-6 text-primary">
          {form.id ? "Edit Address" : "Add New Address"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                name="firstname"
                value={form.firstname}
                onChange={handleChange}
                placeholder="First Name"
                className="w-full p-3 border rounded focus:border-primary outline-none"
              />
              {errors.firstname && <span className="text-red-500 text-xs">{errors.firstname}</span>}
            </div>

            <div>
              <input
                name="lastname"
                value={form.lastname}
                onChange={handleChange}
                placeholder="Last Name"
                className="w-full p-3 border rounded focus:border-primary outline-none"
              />
              {errors.lastname && <span className="text-red-500 text-xs">{errors.lastname}</span>}
            </div>

            <div>
              <input
                name="doorNumber"
                value={form.doorNumber}
                onChange={handleChange}
                placeholder="Door Number"
                className="w-full p-3 border rounded focus:border-primary outline-none"
              />
              {errors.doorNumber && <span className="text-red-500 text-xs">{errors.doorNumber}</span>}
            </div>

            <div>
              <input
                name="streetName"
                value={form.streetName}
                onChange={handleChange}
                placeholder="Street Name"
                className="w-full p-3 border rounded focus:border-primary outline-none"
              />
              {errors.streetName && <span className="text-red-500 text-xs">{errors.streetName}</span>}
            </div>

            <div>
              <input
                name="contact"
                type="tel"
                maxLength="10"
                value={form.contact}
                onChange={handleChange}
                placeholder="Contact Number (10 digits)"
                className="w-full p-3 border rounded focus:border-primary outline-none"
              />
              {errors.contact && <span className="text-red-500 text-xs">{errors.contact}</span>}
            </div>

            <div>
              <input
                name="pin"
                type="text"
                maxLength="6"
                value={form.pin}
                onChange={handleChange}
                placeholder="PIN Code (6 digits)"
                className="w-full p-3 border rounded focus:border-primary outline-none"
              />
              {errors.pin && <span className="text-red-500 text-xs">{errors.pin}</span>}
            </div>
          </div>

          <div>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Full Address"
              className="w-full p-3 border rounded focus:border-primary outline-none"
              rows={3}
            />
            {errors.address && <span className="text-red-500 text-xs">{errors.address}</span>}
          </div>

          <div>
            <input
              name="landmark"
              value={form.landmark}
              onChange={handleChange}
              placeholder="Landmark"
              className="w-full p-3 border rounded focus:border-primary outline-none"
            />
            {errors.landmark && <span className="text-red-500 text-xs">{errors.landmark}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
                className="w-full p-3 border rounded focus:border-primary outline-none"
              />
              {errors.city && <span className="text-red-500 text-xs">{errors.city}</span>}
            </div>

            <div>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="State"
                className="w-full p-3 border rounded focus:border-primary outline-none"
              />
              {errors.state && <span className="text-red-500 text-xs">{errors.state}</span>}
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            {form.id && (
              <button
                type="button"
                onClick={() => {
                  setForm({
                    id: "",
                    firstname: "",
                    lastname: "",
                    contact: "",
                    doorNumber: "",
                    streetName: "",
                    address: "",
                    landmark: "",
                    city: "",
                    state: "",
                    pin: "",
                  });
                  setErrors({});
                }}
                className="px-6 py-2 rounded cursor-pointer bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="bg-primary cursor-pointer text-white px-6 py-2 rounded hover:bg-primary/90 transition-colors"
            >
              {form.id ? "Update Address" : "Save Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

