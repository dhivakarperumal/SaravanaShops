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
  const [viewMode, setViewMode] = useState("card");
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const [dateFilter, setDateFilter] = useState("All");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter, customStartDate, customEndDate]);

  

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
    const matchesSearch = 
      order.orderId?.toLowerCase().includes(q) ||
      order.shipping?.name?.toLowerCase().includes(q) ||
      order.shipping?.phone?.toLowerCase().includes(q) ||
      order.customerName?.toLowerCase().includes(q) ||
      order.mobile?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (dateFilter === "All") return true;
    if (!order.createdAt && !order.date) return false;
    
    const orderDate = new Date(order.createdAt || order.date);
    orderDate.setHours(0,0,0,0);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (dateFilter === "Today") {
      return orderDate.getTime() === today.getTime();
    }
    
    const getStartOfWeek = (d) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day;
      return new Date(date.setDate(diff));
    };

    if (dateFilter === "This Week") {
      const startOfWeek = getStartOfWeek(today);
      return orderDate >= startOfWeek;
    }
    
    if (dateFilter === "Last Week") {
      const startOfThisWeek = getStartOfWeek(today);
      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
      return orderDate >= startOfLastWeek && orderDate < startOfThisWeek;
    }
    
    if (dateFilter === "This Month") {
      return orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
    }
    
    if (dateFilter === "Last Month") {
      let lastMonth = today.getMonth() - 1;
      let year = today.getFullYear();
      if (lastMonth < 0) {
        lastMonth = 11;
        year -= 1;
      }
      return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === year;
    }
    
    if (dateFilter === "Custom Range") {
      if (!customStartDate || !customEndDate) return true;
      const start = new Date(customStartDate);
      start.setHours(0,0,0,0);
      const end = new Date(customEndDate);
      end.setHours(23,59,59,999);
      return orderDate >= start && orderDate <= end;
    }

    return true;
  });

  const totalPages = Math.ceil(displayed.length / itemsPerPage);
  const paginatedDisplayed = displayed.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-8">
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
          

          <div className="relative">
            <div 
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-all select-none"
            >
              <FaFilter className="text-primary" />
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[80px]">
                {dateFilter === "All" ? "All Dates" : dateFilter === "Custom Range" ? "Custom" : dateFilter}
              </span>
              <svg className={`w-4 h-4 text-gray-500 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>

            {showDateDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowDateDropdown(false)}
                ></div>
                <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2 animate-fade-in-down overflow-hidden">
                  {["All", "Today", "This Week", "Last Week", "This Month", "Last Month", "Custom Range"].map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        setDateFilter(option);
                        setShowDateDropdown(false);
                      }}
                      className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                        dateFilter === option 
                          ? "bg-primary/10 text-primary font-semibold" 
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {option === "All" ? "All Dates" : option === "Custom Range" ? "Custom" : option}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

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

      {dateFilter === "Custom Range" && (
        <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end animate-fade-in-down">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-500 font-medium">Start Date</label>
            <input 
              type="date" 
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-500 font-medium">End Date</label>
            <input 
              type="date" 
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-primary"
            />
          </div>
        </div>
      )}

      {viewMode === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginatedDisplayed.map((order) => (
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
                {paginatedDisplayed.map((order, index) => (
                  <tr
                    key={order.id}
                    className={` ${index % 2 === 0
                      ? "bg-white"
                      : "bg-gray-50"
                      }`}
                  >
                    <td className="px-4 py-5 font-semibold">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    <td className="px-4 py-5 text-primary font-semibold">
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

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 mb-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Previous
          </button>
          
          <span className="text-gray-600 font-medium px-4">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Billing;