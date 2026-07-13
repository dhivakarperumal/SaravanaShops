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
        className={`group relative ${stat.bgGradient} overflow-hidden rounded-[32px] p-6 transition-transform duration-300 hover:-translate-y-2 shadow-[0_24px_80px_rgba(15,23,42,0.18)] border border-slate-700/20`}
      >
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-slate-950/20 blur-3xl" />
        <div className="absolute -left-10 bottom-8 w-36 h-36 rounded-full bg-slate-950/15 blur-2xl" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/75">{stat.title}</p>
            <h3 className="text-4xl font-bold text-white mt-4 tracking-tight">{stat.value}</h3>
          </div>
          <div className="w-16 h-16 rounded-3xl bg-slate-950/40 border border-slate-700/30 flex items-center justify-center text-3xl text-white shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
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
      bgGradient: "bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500",
    },
    {
      title: "Products",
      value: formatToK(stats.products),
      icon: <FaBoxOpen />,
      bgGradient: "bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500",
    },
    {
      title: "Delivery Orders",
      value: formatToK(stats.deliveryOrders),
      icon: <FaTruck />,
      bgGradient: "bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-700",
    },
    {
      title: "Cancelled Orders",
      value: formatToK(stats.cancelledOrders),
      icon: <FaTimesCircle />,
      bgGradient: "bg-gradient-to-br from-rose-500 via-fuchsia-500 to-purple-600",
    },
    {
      title: "Revenue",
      value: `₹ ${formatToK(stats.revenue)}`,
      icon: <FaDollarSign />,
      bgGradient: "bg-gradient-to-br from-indigo-700 via-violet-600 to-fuchsia-600",
    },
    {
      title: "Low Stock",
      value: formatToK(stats.lowStockCount),
      icon: <FaBoxOpen />,
      bgGradient: "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500",
    },
  ];

  const revenueChart = {
    labels: monthlyRevenue.map((d) => d.month),
    datasets: [
      {
        label: "Revenue",
        data: monthlyRevenue.map((d) => d.amount),
        backgroundColor: "rgba(74, 222, 128, 0.45)",
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
        backgroundColor: "rgba(34, 197, 94, 0.25)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const colors = [
    "#4d7c0f", "#65a30d", "#22c55e", "#84cc16", "#bef264",
    "#d9f99d", "#a3e635", "#86efac", "#166534", "#15803d"
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
      backgroundColor: `hsl(${(idx * 60) % 360}, 70%, 50%, 0.35)`,
      tension: 0.3,
    })),
  };

  const lowStockAlerts = liveStocks
    .filter((item) => item.stock !== undefined)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  const topSellingProducts = topProducts.slice(0, 5).map((product, idx) => {
    const totalSales = product.data?.reduce((acc, value) => acc + (Number(value) || 0), 0) || 0;
    const score = Math.min(100, Math.round((totalSales / 1000) * 100));
    return {
      name: product.label || `Product ${idx + 1}`,
      sales: formatToK(totalSales),
      progress: score,
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-10 rounded-[36px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 shadow-[0_32px_120px_rgba(15,23,42,0.16)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Admin Portal</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">Welcome back, admin</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Run the store with confidence. Monitor orders, inventory health, top performing products, and revenue in one place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 w-full lg:w-auto">
            <div className="rounded-[24px] border border-slate-700/60 bg-slate-900/90 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.30em] text-slate-400">Today</p>
              <p className="mt-2 text-2xl font-semibold text-white">{todayOrders.length}</p>
              <p className="text-xs text-slate-400">Recent orders</p>
            </div>
            <div className="rounded-[24px] border border-slate-700/60 bg-slate-900/90 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.30em] text-slate-400">Revenue</p>
              <p className="mt-2 text-2xl font-semibold text-white">₹ {formatToK(stats.revenue)}</p>
              <p className="text-xs text-slate-400">Total earnings</p>
            </div>
            <div className="rounded-[24px] border border-slate-700/60 bg-slate-900/90 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.30em] text-slate-400">Low Stock</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.lowStockCount}</p>
              <p className="text-xs text-slate-400">Items below threshold</p>
            </div>
          </div>
        </div>
      </div>

      <DashboardStats stats={statsData} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-6 mb-10">
        <div className="rounded-[32px] border border-slate-700/40 bg-slate-950/90 p-6 shadow-[0_24px_100px_rgba(15,23,42,0.20)] backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white tracking-tight">Sales Insights</h2>
              <p className="text-sm text-slate-400">Key figures and performance indicators for the last 30 days.</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-800/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300 shadow-sm">
              Live overview
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-[28px] bg-slate-900/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.25)] border border-slate-700/50">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Orders</p>
              <p className="mt-3 text-3xl font-bold text-white">{formatToK(stats.deliveryOrders)}</p>
              <p className="mt-2 text-sm text-slate-400">Orders in transit</p>
            </div>
            <div className="rounded-[28px] bg-slate-900/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.25)] border border-slate-700/50">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Cancelled</p>
              <p className="mt-3 text-3xl font-bold text-white">{formatToK(stats.cancelledOrders)}</p>
              <p className="mt-2 text-sm text-slate-400">Cancelled shipments</p>
            </div>
            <div className="rounded-[28px] bg-slate-900/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.25)] border border-slate-700/50">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Products</p>
              <p className="mt-3 text-3xl font-bold text-white">{formatToK(stats.products)}</p>
              <p className="mt-2 text-sm text-slate-400">Active inventory items</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-[32px] bg-slate-900/90 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.25)] border border-slate-700/50">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Top Selling Products</h3>
                  <p className="text-sm text-slate-400">Latest revenue drivers</p>
                </div>
                <span className="text-xs uppercase tracking-[0.3em] text-cyan-300">Top 5</span>
              </div>
              <div className="space-y-4">
                {topSellingProducts.length > 0 ? (
                  topSellingProducts.map((item) => (
                    <div key={item.name} className="rounded-3xl bg-slate-950/90 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.18)] border border-slate-700/60 overflow-hidden">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white truncate">{item.name}</p>
                          <p className="text-sm text-slate-400">Sales ₹ {item.sales}</p>
                        </div>
                        <div className="text-sm font-semibold text-cyan-300 flex-shrink-0">{item.progress}%</div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-cyan-400" style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No top seller data available.</p>
                )}
              </div>
            </div>

            <div className="rounded-[32px] bg-slate-900/90 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.25)] border border-slate-700/50">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Low Stock Alerts</h3>
                  <p className="text-sm text-slate-400">Products needing restock soon</p>
                </div>
                <span className="text-xs uppercase tracking-[0.3em] text-rose-300">Urgent</span>
              </div>
              <div className="space-y-4">
                {lowStockAlerts.length > 0 ? (
                  lowStockAlerts.map((item) => (
                    <div key={item.id || item.name} className="rounded-3xl bg-slate-950/90 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.18)] border border-slate-700/60 overflow-hidden">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white truncate">{item.name}</p>
                          <p className="text-sm text-slate-400">Stock left: {item.stock}</p>
                        </div>
                        <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300 flex-shrink-0 whitespace-nowrap">{item.stock <= 5 ? "Critical" : "Low"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No low-stock alerts at the moment.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-700/40 bg-slate-950/90 p-6 shadow-[0_24px_100px_rgba(15,23,42,0.20)] backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white tracking-tight">Action Center</h2>
              <p className="text-sm text-slate-400">Review the most important metrics and tasks for the dashboard.</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-800/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300 shadow-sm">
              Focus mode
            </span>
          </div>
          <div className="grid gap-4">
            <div className="rounded-[28px] bg-slate-900/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.25)] border border-slate-700/50">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white text-2xl shadow-lg">
                  <FaDollarSign />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Revenue Pace</p>
                  <p className="mt-2 text-3xl font-bold text-white">₹ {formatToK(stats.revenue)}</p>
                  <p className="text-sm text-slate-400">Revenue trending upward compared to last period.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[28px] bg-slate-900/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.25)] border border-slate-700/50">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white text-2xl shadow-lg">
                  <FaTruck />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Delivery Flow</p>
                  <p className="mt-2 text-3xl font-bold text-white">{formatToK(stats.deliveryOrders)}</p>
                  <p className="text-sm text-slate-400">Orders currently in delivery pipeline.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[28px] bg-slate-900/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.25)] border border-slate-700/50">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-500 to-slate-700 text-white text-2xl shadow-lg">
                  <FaUsers />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Active Users</p>
                  <p className="mt-2 text-3xl font-bold text-white">{formatToK(stats.users)}</p>
                  <p className="text-sm text-slate-400">Number of users engaging with the portal.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="relative overflow-hidden rounded-[32px] border border-slate-700/40 bg-slate-950/90 p-6 shadow-[0_24px_100px_rgba(15,23,42,0.20)] backdrop-blur-xl">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-white mb-4 tracking-tight">Monthly Revenue</h2>
            <div className="h-72 rounded-[28px] bg-slate-950/80 p-3 shadow-inner shadow-slate-900/40">
              <Bar data={revenueChart} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-slate-700/40 bg-slate-950/90 p-6 shadow-[0_24px_100px_rgba(15,23,42,0.20)] backdrop-blur-xl">
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-white mb-4 tracking-tight">Product Category Distribution</h2>
            <div className="w-full h-64 rounded-[28px] bg-slate-950/80 p-3 shadow-inner shadow-slate-900/40">
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

      <div className="bg-slate-950/90 p-6 rounded-3xl shadow-[0_18px_60px_rgba(15,23,42,0.22)] border border-slate-700/50 transition-all duration-400 backdrop-blur-xl w-full overflow-x-auto hidden">
        <h2 className="text-lg font-bold text-white mb-4 tracking-tight">
          Current Product Stock Levels
        </h2>
        <div className="rounded-[28px] bg-slate-900/80 p-4 shadow-inner shadow-slate-950/30">
          <Bar data={stockChart} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 mt-10 gap-6">
        <div className="relative overflow-hidden rounded-[32px] border border-slate-700/40 bg-slate-950/90 p-6 shadow-[0_24px_100px_rgba(15,23,42,0.20)] backdrop-blur-xl">
          <div className="absolute -right-10 -top-8 h-28 w-28 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-white mb-4 tracking-tight">Monthly Orders</h2>
            <div className="rounded-[28px] bg-slate-950/80 p-4 shadow-inner shadow-slate-900/30">
              <Line data={ordersChart} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-slate-700/40 bg-slate-950/90 p-6 shadow-[0_24px_100px_rgba(15,23,42,0.20)] backdrop-blur-xl">
          <div className="absolute -left-10 -bottom-8 h-28 w-28 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-white mb-4 tracking-tight">Top Product Orders Over Months</h2>
            <div className="w-full h-64 rounded-[28px] bg-slate-950/80 p-4 shadow-inner shadow-slate-900/30">
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
                <p className="text-slate-400 text-center mt-24">No product order data...</p>
              )}
            </div>
          </div>
        </div>
      </div>

     
      <div className="rounded-[32px] border border-slate-700/40 bg-slate-950/90 p-6 shadow-[0_24px_100px_rgba(15,23,42,0.20)] backdrop-blur-xl mt-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Today’s Orders</h2>
            <p className="text-sm text-slate-400 mt-1">Recent order activity and status overview.</p>
          </div>
          <button className="inline-flex items-center rounded-full bg-slate-800/80 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700/80">
            View all orders
          </button>
        </div>

        <div className="overflow-x-auto hidden md:block rounded-[28px] border border-slate-700/50 bg-slate-950/80 shadow-[0_16px_40px_rgba(15,23,42,0.2)]">
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
            <tbody className="bg-slate-950/80 divide-y divide-slate-700/40 text-white">
              {todayOrders.length > 0 ? (
                todayOrders.map((order, ind) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/superadmin/orders/${order.id}`)}
                    className="hover:bg-slate-900/90 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4 font-semibold text-white">{ind + 1}</td>
                    <td className="px-5 py-4 font-semibold text-white">{order.orderId}</td>
                    <td className="px-5 py-4 text-slate-300">{order.shipping_name}</td>
                    <td className="px-5 py-4 text-slate-300 font-medium">₹ {order.total}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${order.status === "Delivered"
                          ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/20"
                          : order.status === "Cancelled"
                            ? "bg-rose-500/15 text-rose-200 border border-rose-500/20"
                            : "bg-amber-500/15 text-amber-200 border border-amber-500/20"
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
                className="rounded-[28px] border border-slate-700/40 bg-slate-950/95 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:shadow-lg cursor-pointer"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">{order.orderId}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.status === "Delivered"
                        ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/20"
                        : order.status === "Cancelled"
                          ? "bg-rose-500/15 text-rose-200 border border-rose-500/20"
                          : "bg-amber-500/15 text-amber-200 border border-amber-500/20"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                    <div className="rounded-3xl bg-slate-900/80 p-3 border border-slate-700/40">
                      <p className="text-slate-400 mb-1">Customer</p>
                      <p className="font-semibold text-white truncate">{order.shipping_name || "-"}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-900/80 p-3 border border-slate-700/40">
                      <p className="text-slate-400 mb-1">Amount</p>
                      <p className="font-semibold text-white">₹ {order.total}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[28px] border border-slate-700/40 bg-slate-950/90 py-10 flex flex-col items-center justify-center">
              <p className="text-slate-400 font-medium text-sm">No orders placed today.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
