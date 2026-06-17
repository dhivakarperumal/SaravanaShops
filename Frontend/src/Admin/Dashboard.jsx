import React, { useEffect, useState } from "react";
import api from "../api";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
} from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  FaUsers,
  FaBoxOpen,
  FaTruck,
  FaTimesCircle,
  FaDollarSign,
  FaShoppingCart,
  FaClipboardList,
  FaPlusCircle,
  FaReceipt,
  FaHandshake,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement
);

const DashboardStats = ({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
    {stats.map((stat, i) => (
      <div
        key={i}
        className={`group relative ${stat.bgGradient} overflow-hidden rounded-xl p-6 transition-all duration-400 hover:-translate-y-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_15px_40px_rgb(0,0,0,0.25)] border border-white/20`}
      >
        {/* Soft decorative background circles for modern glowing effect */}
        <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-sm bg-white opacity-20 blur-2xl group-hover:scale-150 transition-transform duration-700 ease-in-out`}></div>
        <div className={`absolute right-10 -bottom-10 w-24 h-24 rounded-sm bg-white opacity-10 blur-xl group-hover:scale-125 transition-transform duration-700 ease-in-out`}></div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white/90 tracking-wider uppercase drop-shadow-md">{stat.title}</p>
            <h3 className="text-4xl font-extrabold text-white mt-2 tracking-tight drop-shadow-lg">{stat.value}</h3>
          </div>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 bg-white/25 text-white backdrop-blur-md border border-white/30`}>
            {stat.icon}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    revenue: 0,
    deliveryOrders: 0,
    cancelledOrders: 0,
    lowStockCount: 0
  });

  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [monthlyOrders, setMonthlyOrders] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [liveStocks, setLiveStocks] = useState([]);
  const [todayOrders, setTodayOrders] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/stats');
        const data = res.data.data;
        
        setStats(data.stats);
        setMonthlyRevenue(data.monthlyRevenue);
        setMonthlyOrders(data.monthlyOrders);
        setTopProducts(data.topProducts);
        setProductCategories(data.productCategories);
        setLiveStocks(data.liveStocks);
        setTodayOrders(data.todayOrders);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        toast.error('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatToK = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toLocaleString();
  };

  const statsData = [
    {
      title: "Users",
      value: formatToK(stats.users),
      icon: <FaUsers />,
      bgGradient: "bg-gradient-to-br from-blue-500 to-blue-700",
    },
    {
      title: "Products",
      value: formatToK(stats.products),
      icon: <FaBoxOpen />,
      bgGradient: "bg-gradient-to-br from-emerald-400 to-emerald-600",
    },
    {
      title: "Delivery Orders",
      value: formatToK(stats.deliveryOrders),
      icon: <FaTruck />,
      bgGradient: "bg-gradient-to-br from-purple-500 to-purple-700",
    },
    {
      title: "Cancelled Orders",
      value: formatToK(stats.cancelledOrders),
      icon: <FaTimesCircle />,
      bgGradient: "bg-gradient-to-br from-red-500 to-rose-700",
    },
    {
      title: "Revenue",
      value: `₹ ${formatToK(stats.revenue)}`,
      icon: <FaDollarSign />,
      bgGradient: "bg-gradient-to-br from-pink-500 to-pink-700",
    },
    {
      title: "Low Stock",
      value: formatToK(stats.lowStockCount),
      icon: <FaBoxOpen />,
      bgGradient: "bg-gradient-to-br from-orange-400 to-orange-600",
    },
  ];

  const revenueChart = {
    labels: monthlyRevenue.map((d) => d.month),
    datasets: [
      {
        label: "Revenue",
        data: monthlyRevenue.map((d) => d.amount),
        backgroundColor: "rgba(16, 185, 129, 0.6)",
        borderRadius: 6,
      },
    ],
  };

  const ordersChart = {
    labels: monthlyOrders.map((d) => d.month),
    datasets: [
      {
        label: "orders",
        data: monthlyOrders.map((d) => d.count),
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.3)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const colors = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1",
    "#8b5cf6", "#14b8a6", "#f43f5e", "#facc15", "#6b7280"
  ];

  const categoryChart = {
    labels: productCategories.map((d) => d.name),
    datasets: [
      {
        data: productCategories.map((d) => d.value),
        backgroundColor: productCategories.map((_, i) => colors[i % colors.length]),
        borderWidth: 2,
      },
    ],
  };

  const stockChart = {
    labels: liveStocks.map((p) => p.name),
    datasets: [
      {
        label: "Stock ",
        data: liveStocks.map((p) => p.stock || 0),
        backgroundColor: liveStocks.map(
          () =>
            `rgba(${Math.floor(Math.random() * 150 + 50)}, ${Math.floor(
              Math.random() * 150 + 50
            )}, ${Math.floor(Math.random() * 150 + 50)}, 0.6)`
        ),
        borderColor: "#b91c1c",
        borderWidth: 2,
        borderRadius: 6,
        maxBarThickness: 50,
      },
    ],
  };

  const topProductsChart = {
    labels: monthlyRevenue.map((d) => d.month),
    datasets: topProducts.map((product, idx) => ({
      label: product.label,
      data: product.data,
      borderColor: `hsl(${(idx * 60) % 360}, 70%, 50%)`,
      backgroundColor: `hsl(${(idx * 60) % 360}, 70%, 50%, 0.5)`,
      tension: 0.3,
    }))
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-6 py-2">
      <DashboardStats stats={statsData} />

      {/* ── Quick Access ────────────────────────────────────────────────── */}
      <div className="mb-8 bg-gradient-to-br from-white to-gray-50/90 rounded-3xl p-6 shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-white/80 backdrop-blur-xl transition-all duration-400 hover:shadow-[0_15px_40px_rgb(0,0,0,0.1)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-lg shadow-md">
            ⚡
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-800 tracking-tight leading-none">Quick Access</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Important shortcuts for daily tasks</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { label: "New Orders",   icon: <FaShoppingCart />,  path: "/superadmin/newOrders",   color: "from-blue-500 to-blue-600",     shadow: "shadow-blue-200" },
            { label: "All Orders",   icon: <FaClipboardList />, path: "/superadmin/allOrders",   color: "from-indigo-500 to-indigo-600", shadow: "shadow-indigo-200" },
            { label: "Add Product",  icon: <FaPlusCircle />,    path: "/superadmin/addproducts", color: "from-emerald-500 to-emerald-600",shadow: "shadow-emerald-200" },
            { label: "All Products", icon: <FaBoxOpen />,       path: "/superadmin/allproducts", color: "from-cyan-500 to-cyan-600",     shadow: "shadow-cyan-200" },
            { label: "Invoices",     icon: <FaReceipt />,       path: "/superadmin/invoice",     color: "from-purple-500 to-purple-600", shadow: "shadow-purple-200" },
            { label: "Dealers",      icon: <FaHandshake />,     path: "/superadmin/dealers",     color: "from-rose-500 to-rose-600",     shadow: "shadow-rose-200" },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-xl shadow-lg ${item.shadow} group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                {item.icon}
              </div>
              <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 text-center transition-colors duration-200">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-white to-gray-50/90 p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-white/80 hover:shadow-[0_15px_40px_rgb(0,0,0,0.1)] transition-all duration-400 backdrop-blur-xl">
          <h2 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">Monthly Revenue</h2>
          <Bar data={revenueChart} />
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50/90 p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-white/80 hover:shadow-[0_15px_40px_rgb(0,0,0,0.1)] transition-all duration-400 backdrop-blur-xl">
          <h2 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">
            Product Category Distribution
          </h2>
          <div className="w-full h-64">
            {productCategories.length > 0 ? (
              <Pie
                data={categoryChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "bottom" },
                  },
                }}
              />
            ) : (
              <p className="text-gray-500 text-center mt-24">No category data...</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-gray-50/90 p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-white/80 hover:shadow-[0_15px_40px_rgb(0,0,0,0.1)] transition-all duration-400 backdrop-blur-xl w-full overflow-x-auto hidden">
        <h2 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">
          Current Product Stock Levels
        </h2>
        <Bar data={stockChart} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 mt-10 gap-6">
        <div className="bg-gradient-to-br from-white to-gray-50/90 p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-white/80 hover:shadow-[0_15px_40px_rgb(0,0,0,0.1)] transition-all duration-400 backdrop-blur-xl">
          <h2 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">Monthly Orders</h2>
          <Line data={ordersChart} />
        </div>

       <div className="bg-gradient-to-br from-white to-gray-50/90 p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-white/80 hover:shadow-[0_15px_40px_rgb(0,0,0,0.1)] transition-all duration-400 backdrop-blur-xl">
          <h2 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">
            Top Product Orders Over Months
          </h2>
          <div className="w-full h-64">
            {topProducts.length > 0 ? (
              <Line
                data={topProductsChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom" } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            ) : (
              <p className="text-gray-500 text-center mt-24">No product order data...</p>
            )}
          </div>
        </div>
      </div>

     
      <div className="bg-gradient-to-br from-white to-gray-50/90 p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-white/80 hover:shadow-[0_15px_40px_rgb(0,0,0,0.1)] transition-all duration-400 backdrop-blur-xl mt-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">Today’s Orders</h2>

        {/* 🖥️ Desktop / Tablet Table */}
        <div className="overflow-x-auto hidden md:block rounded-2xl shadow-sm border border-gray-100">
          <table className="w-full text-sm text-left">
            <thead className="bg-primary text-white">
              <tr>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">Order ID</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">User ID</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">Amount</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {todayOrders.length > 0 ? (
                todayOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/superadmin/orders/${order.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-semibold text-gray-800">{order.orderId}</td>
                    <td className="px-5 py-3.5 text-gray-700">{order.shipping_name}</td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium">₹ {order.total}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${order.status === "Delivered"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : order.status === "Cancelled"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                          }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-gray-500 py-8 font-medium">
                    No orders placed today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 📱 Mobile Card Layout */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {todayOrders.length > 0 ? (
            todayOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/superadmin/orders/${order.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-gray-800 text-sm">{order.orderId}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.status === "Delivered"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : order.status === "Cancelled"
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                      }`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 mb-0.5">User</p>
                    <p className="font-semibold text-gray-700 truncate">{order.shipping_name || "-"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 mb-0.5">Amount</p>
                    <p className="font-bold text-green-700">₹ {order.total}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl py-8 flex flex-col items-center justify-center">
               <p className="text-gray-500 font-medium text-sm">No orders placed today.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
