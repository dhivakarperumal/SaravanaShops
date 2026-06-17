import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaTh,
  FaList,
} from "react-icons/fa";
import api from "../../api";
import toast from "react-hot-toast";

const Billing = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("card");

  const [orders, setOrders] = useState([]);

  

  // Fetch delivered orders
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/orders");
        if (!res.data?.success) throw new Error();
        const delivered = res.data.data
          .filter(o => o.status === "Delivered")
          .sort((a, b) => {
            const idA = parseInt((a.orderId || "").replace(/\D/g, "")) || 0;
            const idB = parseInt((b.orderId || "").replace(/\D/g, "")) || 0;
            return idB - idA;
          });
        setOrders(delivered);
      } catch {
        toast.error("Failed to load delivered orders");
      }
    })();
  }, []);

  const displayed = orders.filter((order) => {
    const q = searchQuery.toLowerCase();

    return (
      order.orderId?.toLowerCase().includes(q) ||
      order.shipping?.name?.toLowerCase().includes(q) ||
      order.shipping?.phone?.toLowerCase().includes(q) ||
      order.customerName?.toLowerCase().includes(q) ||
      order.mobile?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-5">
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">

        <div className="flex items-center gap-2 flex-1 max-w-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search bills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none"
          />
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <span className="text-sm text-gray-500">
            {displayed.length} Bills
          </span>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer"
          >
            <FaFilter />
            Filters
          </button>

          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-lg cursor-pointer ${viewMode === "card" ? "bg-white shadow text-primary" : ""}`}
            >
              <FaTh />
            </button>

            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg cursor-pointer ${viewMode === "table" ? "bg-white shadow text-primary" : ""}`}
            >
              <FaList />
            </button>
          </div>

          <button
            onClick={() => navigate("/superadmin/addbilling")}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl cursor-pointer"
          >
            <FaPlus />
            Add Bill
          </button>
        </div>
      </div>

      {viewMode === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {displayed.map((order) => (
            <div
              key={order.id}
              className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-primary to-secondary p-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs opacity-80">Order ID</p>
                    <h3 className="font-bold text-lg">
                      {order.orderId}
                    </h3>
                  </div>

                  <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold">
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="space-y-3">

                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer</span>
                    <span className="font-semibold">
                      {order.shipping?.name || order.customerName || order.name || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Mobile</span>
                    <span className="font-medium">
                      {order.shipping?.phone || order.mobile || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Items</span>
                    <span className="font-medium">
                      {order.items?.length || 0}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-bold text-primary text-lg">
                      ₹{order.total || order.totalAmount || 0}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>

                </div>

              </div>
            </div> 
          ))} 
        </div>
      )}

      {viewMode === "table" && (
         <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-primary text-white">
                <tr className="bg-gradient-to-r from-primary to-secondary text-white">
                  <th className="px-4 py-4 text-left">S No</th>
                  <th className="px-4 py-4 text-left">Order ID</th>
                  <th className="px-4 py-4 text-left">Customer</th>
                  <th className="px-4 py-4 text-left">Mobile</th>
                  <th className="px-4 py-4 text-left">Items</th>
                  <th className="px-4 py-4 text-left">Amount</th>
                  <th className="px-4 py-4 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {displayed.map((order, index) => (
                  <tr
                    key={order.id}
                    className={` ${index % 2 === 0
                      ? "bg-white"
                      : "bg-gray-50"
                      }`}
                  >
                    <td className="px-4 py-5 font-semibold">
                      {index + 1}
                    </td>

                    <td className="px-4 py-5 font-semibold">
                      {order.orderId}
                    </td>

                    <td className="px-4 py-5">
                      {order.shipping?.name || order.customerName || order.name || "-"}
                    </td>

                    <td className="px-4 py-5">
                      {order.shipping?.phone || order.mobile || "-"}
                    </td>

                    <td className="px-4 py-5">
                      {order.items?.length || 0}
                    </td>

                    <td className="px-4 py-5 font-bold text-primary">
                      ₹{order.total || order.totalAmount || 0}
                    </td>

                    <td className="px-4 py-5">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;