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
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
    {stats.map((stat, i) => (
      <div
        key={i}
        className={`group relative ${stat.bgGradient} overflow-hidden rounded-[32px] p-6 transition-transform duration-300 hover:-translate-y-2 shadow-[0_24px_80px_rgba(15,23,42,0.18)] border border-white/10`}
      >
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -left-10 bottom-8 w-36 h-36 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/75">{stat.title}</p>
            <h3 className="text-4xl font-bold text-white mt-4 tracking-tight">{stat.value}</h3>
          </div>
          <div className="w-16 h-16 rounded-3xl bg-white/20 border border-white/10 flex items-center justify-center text-3xl text-white shadow-[0_10px_40px_rgba(255,255,255,0.12)]">
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
      bgGradient: "bg-gradient-to-br from-emerald-400 via-emerald-500 to-lime-600",
    },
    {
      title: "Products",
      value: formatToK(stats.products),
      icon: <FaBoxOpen />,
      bgGradient: "bg-gradient-to-br from-teal-500 via-emerald-500 to-lime-600",
    },
    {
      title: "Delivery Orders",
      value: formatToK(stats.deliveryOrders),
      icon: <FaTruck />,
      bgGradient: "bg-gradient-to-br from-emerald-500 via-lime-500 to-emerald-700",
    },
    {
      title: "Cancelled Orders",
      value: formatToK(stats.cancelledOrders),
      icon: <FaTimesCircle />,
      bgGradient: "bg-gradient-to-br from-lime-400 via-emerald-500 to-emerald-700",
    },
    {
      title: "Revenue",
      value: `₹ ${formatToK(stats.revenue)}`,
      icon: <FaDollarSign />,
      bgGradient: "bg-gradient-to-br from-emerald-400 via-lime-500 to-emerald-600",
    },
    {
      title: "Low Stock",
      value: formatToK(stats.lowStockCount),
      icon: <FaBoxOpen />,
      bgGradient: "bg-gradient-to-br from-lime-300 via-emerald-400 to-emerald-600",
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
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.24)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const colors = [
    "#22c55e", "#16a34a", "#4d7c0f", "#52b788", "#65a30d",
    "#86efac", "#15803d", "#4ade80", "#a3e635", "#a7f3d0"
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
          (_, i) => [
            "rgba(16, 185, 129, 0.7)",
            "rgba(34, 197, 94, 0.7)",
            "rgba(52, 211, 153, 0.7)",
            "rgba(5, 150, 105, 0.7)",
            "rgba(74, 222, 128, 0.7)",
          ][i % 5]
        ),
        borderColor: "#16a34a",
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
    <div className="px-6 py-6">
      <DashboardStats stats={statsData} />

      {/* ── Quick Access ────────────────────────────────────────────────── */}
      <div className="mb-10 rounded-[32px] border border-white/10 bg-slate-950/5 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-emerald-500 via-lime-500 to-emerald-700 flex items-center justify-center text-white shadow-xl shadow-emerald-200/40">
              ⚡
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Quick Access</h2>
              <p className="text-sm text-slate-500">Important shortcuts for daily admin tasks.</p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 shadow-sm">
            Fast navigation
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "New Orders",   icon: <FaShoppingCart />,  path: "/superadmin/newOrders",   color: "from-emerald-500 to-emerald-700" },
            { label: "All Orders",   icon: <FaClipboardList />, path: "/superadmin/allOrders",   color: "from-lime-500 to-emerald-600" },
            { label: "Add Product",  icon: <FaPlusCircle />,    path: "/superadmin/addproducts", color: "from-emerald-400 to-lime-500" },
            { label: "All Products", icon: <FaBoxOpen />,       path: "/superadmin/allproducts", color: "from-teal-500 to-emerald-600" },
            { label: "Invoices",     icon: <FaReceipt />,       path: "/superadmin/invoice",     color: "from-lime-400 to-emerald-500" },
            { label: "Dealers",      icon: <FaHandshake />,     path: "/superadmin/dealers",     color: "from-emerald-500 to-lime-600" },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className="group flex flex-col items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-white/90 px-4 py-5 text-slate-900 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-white"
            >
              <div className={`w-12 h-12 rounded-3xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-xl shadow-xl transition-transform duration-300 group-hover:scale-110`}>
                {item.icon}
              </div>
              <span className="text-xs font-semibold tracking-wide text-slate-700">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/5 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 tracking-tight">Monthly Revenue</h2>
            <div className="h-72">
              <Bar data={revenueChart} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/5 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 tracking-tight">Product Category Distribution</h2>
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
                <p className="text-slate-500 text-center mt-24">No category data...</p>
              )}
            </div>
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
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/5 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="absolute -right-10 -top-8 h-28 w-28 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 tracking-tight">Monthly Orders</h2>
            <Line data={ordersChart} />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/5 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="absolute -left-10 -bottom-8 h-28 w-28 rounded-full bg-pink-300/20 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 tracking-tight">Top Product Orders Over Months</h2>
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
                <p className="text-slate-500 text-center mt-24">No product order data...</p>
              )}
            </div>
          </div>
        </div>
      </div>

     
      <div className="rounded-[32px] border border-white/10 bg-slate-950/5 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl mt-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Today’s Orders</h2>
            <p className="text-sm text-slate-500 mt-1">Recent order activity and status overview.</p>
          </div>
          <button className="inline-flex items-center rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white">
            View all orders
          </button>
        </div>

        <div className="overflow-x-auto hidden md:block rounded-[28px] border border-white/10 bg-white/95 shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">S No</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">Order ID</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">User</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">Amount</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {todayOrders.length > 0 ? (
                todayOrders.map((order, ind) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/superadmin/orders/${order.id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-900">{ind + 1}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{order.orderId}</td>
                    <td className="px-5 py-4 text-slate-700">{order.shipping_name}</td>
                    <td className="px-5 py-4 text-slate-700 font-medium">₹ {order.total}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${order.status === "Delivered"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : order.status === "Cancelled"
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-slate-500 py-8 font-medium">
                    No orders placed today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden grid grid-cols-1 gap-4">
          {todayOrders.length > 0 ? (
            todayOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/superadmin/orders/${order.id}`)}
                className="rounded-[28px] border border-white/10 bg-slate-950/95 p-5 shadow-sm transition hover:shadow-md cursor-pointer"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100 text-sm">{order.orderId}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.status === "Delivered"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : order.status === "Cancelled"
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-amber-100 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                    <div className="rounded-3xl bg-white/5 p-3">
                      <p className="text-slate-400 mb-1">Customer</p>
                      <p className="font-semibold text-slate-100 truncate">{order.shipping_name || "-"}</p>
                    </div>
                    <div className="rounded-3xl bg-white/5 p-3">
                      <p className="text-slate-400 mb-1">Amount</p>
                      <p className="font-semibold text-slate-100">₹ {order.total}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[28px] border border-white/10 bg-white/90 py-10 flex flex-col items-center justify-center">
              <p className="text-slate-500 font-medium text-sm">No orders placed today.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
