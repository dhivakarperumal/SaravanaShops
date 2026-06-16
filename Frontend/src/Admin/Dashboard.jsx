import React, { useEffect, useState } from "react";
import { collection, onSnapshot, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
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
  FaUndoAlt,
  FaDollarSign,
  FaShoppingCart,
  FaClipboardList,
  FaPlusCircle,
  FaTags,
  FaUserPlus,
  FaKey,
  FaReceipt,
  FaStar,
  FaHandshake,
  FaLayerGroup,
} from "react-icons/fa";
import CustomerReviews from "./Reviews/Customer";
import { useNavigate } from "react-router-dom";

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
  const [stats, setStats] = useState({
    users: 0,
    products: 0,

    revenue: 0,
  });

  const [productsData, setProductsData] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [monthlyOrders, setMonthlyOrders] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [liveStocks, setLiveStocks] = useState([]);
  const [todayOrders, setTodayOrders] = useState([]);


  const [deliveryOrders, setDeliveryOrders] = useState(0);
  const [cancelledOrders, setCancelledOrders] = useState(0);

  const navigate = useNavigate()


  useEffect(() => {
    const fetchOrderCounts = async () => {
      const ordersRef = collection(db, "orders");

      // Delivered orders count
      const deliveredSnap = await getDocs(query(ordersRef, where("status", "==", "Delivered")));
      setDeliveryOrders(deliveredSnap.size);

      // Cancelled orders count
      const cancelledSnap = await getDocs(query(ordersRef, where("status", "==", "Cancelled")));
      setCancelledOrders(cancelledSnap.size);
    };

    fetchOrderCounts();
  }, []);

  useEffect(() => {
    const todayDate = new Date().toISOString().split("T")[0];

    // Subscribe to users and orders separately
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (usersSnap) => {
      const usersCount = usersSnap.size;
      setStats((prev) => ({ ...prev, users: usersCount }));
    });

    const unsubscribeOrders = onSnapshot(collection(db, "orders"), (ordersSnap) => {
      let revenue = 0;
      const revenueByMonth = {};
      const ordersByMonth = {};
      const topProductOrdersMap = {};
      const todayOrdersList = [];

      ordersSnap.forEach((orderDoc) => {
        const data = orderDoc.data();
        const total = data.total || 0;
        const orderDate = new Date(data.date || Date.now());
        const month = orderDate.toLocaleString("default", { month: "short" });
        const orderDateStr = orderDate.toISOString().split("T")[0];

        revenue += total;
        revenueByMonth[month] = (revenueByMonth[month] || 0) + total;
        ordersByMonth[month] = (ordersByMonth[month] || 0) + 1;

        (data.cartItems || []).forEach((item) => {
          const key = item.name;
          if (!topProductOrdersMap[key]) topProductOrdersMap[key] = {};
          topProductOrdersMap[key][month] =
            (topProductOrdersMap[key][month] || 0) + (item.qty || 1);
        });

        if (orderDateStr === todayDate) {
          todayOrdersList.push({ id: orderDoc.id, ...data });
        }
      });

      const months = Object.keys(revenueByMonth);
      const topProductChartData = Object.entries(topProductOrdersMap)
        .map(([name, monthlyData]) => ({
          label: name,
          data: months.map((m) => monthlyData[m] || 0),
        }))
        .slice(0, 3);

      setStats((prev) => ({ ...prev, revenue }));
      setMonthlyRevenue(months.map((m) => ({ month: m, amount: revenueByMonth[m] })));
      setMonthlyOrders(months.map((m) => ({ month: m, count: ordersByMonth[m] })));
      setTopProducts(topProductChartData);
      setTodayOrders(todayOrdersList);
    });




      const unsubscribeProducts = onSnapshot(collection(db, "products"), (productsSnap) => {
        const cats = {};
        const sorted = productsSnap.docs
          .map((doc) => {
            const data = doc.data();
            cats[data.category || "Other"] = (cats[data.category || "Other"] || 0) + 1;
            return { id: doc.id, ...data };
          })
          .sort((a, b) =>
            (a.productId || "").localeCompare(b.productId || "", "en", { numeric: true })
          );

        setStats((prev) => ({ ...prev, products: productsSnap.size }));
        setProductCategories(Object.entries(cats).map(([name, value]) => ({ name, value })));
        setLiveStocks(sorted);
        setProductsData(sorted);
      });

      return () => {
        unsubscribeUsers();
        unsubscribeProducts();
      };
    }, []);

  useEffect(() => {
    const todayDate = new Date().toISOString().split("T")[0];

    const unsubscribeOrders = onSnapshot(collection(db, "orders"), (ordersSnap) => {
      let revenue = 0;
      const revenueByMonth = {};
      const ordersByMonth = {};
      const topProductOrdersMap = {};
      const todayOrdersList = [];

      ordersSnap.forEach((orderDoc) => {
        const data = orderDoc.data();
        const total = data.total || 0;

        // Use createdAt timestamp instead of 'date' if available
        const orderTimestamp = data.createdAt ? data.createdAt.toDate() : new Date();
        const orderDateStr = orderTimestamp.toISOString().split("T")[0];
        const month = orderTimestamp.toLocaleString("default", { month: "short" });

        revenue += total;
        revenueByMonth[month] = (revenueByMonth[month] || 0) + total;
        ordersByMonth[month] = (ordersByMonth[month] || 0) + 1;

        (data.cartItems || []).forEach((item) => {
          const key = item.name;
          if (!topProductOrdersMap[key]) topProductOrdersMap[key] = {};
          topProductOrdersMap[key][month] =
            (topProductOrdersMap[key][month] || 0) + (item.qty || 1);
        });

        if (orderDateStr === todayDate) {
          todayOrdersList.push({ id: orderDoc.id, ...data });
        }
      });

      const months = Object.keys(revenueByMonth);
      const topProductChartData = Object.entries(topProductOrdersMap)
        .map(([name, monthlyData]) => ({
          label: name,
          data: months.map((m) => monthlyData[m] || 0),
        }))
        .slice(0, 3);

      setStats((prev) => ({ ...prev, revenue }));
      setMonthlyRevenue(months.map((m) => ({ month: m, amount: revenueByMonth[m] })));
      setMonthlyOrders(months.map((m) => ({ month: m, count: ordersByMonth[m] })));
      setTopProducts(topProductChartData);
      setTodayOrders(todayOrdersList);
    });

    return () => {
      unsubscribeOrders();
    };
  }, []);


 const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
      const monthlyOrders = {}; // { 'Jan': { 'Product A': 10, ... }, ... }
      const monthsSet = new Set();

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.createdAt || !data.items) return;

        const date = data.createdAt.toDate();
        const month = date.toLocaleString("default", { month: "short" }); // e.g., "Jan"
        monthsSet.add(month);

        data.items.forEach((item) => {
          const productName = item.name;
          if (!monthlyOrders[month]) monthlyOrders[month] = {};
          if (!monthlyOrders[month][productName]) monthlyOrders[month][productName] = 0;
          monthlyOrders[month][productName] += item.quantity;
        });
      });

      const months = Array.from(monthsSet).sort(
        (a, b) => new Date(`${a} 1, 2000`) - new Date(`${b} 1, 2000`)
      );

      // Get top 5 products overall
      const productTotals = {};
      Object.values(monthlyOrders).forEach((monthData) => {
        Object.entries(monthData).forEach(([name, qty]) => {
          productTotals[name] = (productTotals[name] || 0) + qty;
        });
      });
      const topProducts = Object.entries(productTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

      const datasets = topProducts.map((product, idx) => ({
        label: product,
        data: months.map((month) => monthlyOrders[month]?.[product] || 0),
        borderColor: `hsl(${(idx * 60) % 360}, 70%, 50%)`,
        backgroundColor: `hsl(${(idx * 60) % 360}, 70%, 50%, 0.5)`,
        tension: 0.3,
      }));

      setChartData({ labels: months, datasets });
    });

    return () => unsubscribe();
  }, []);


  const lowStockCount = productsData.filter(item => (item.stock || 0) < 3).length;

  const statsData = [
    {
      title: "Users",
      value: stats?.users || 0,
      icon: <FaUsers />,
      bgGradient: "bg-gradient-to-br from-blue-500 to-blue-700",
    },
    {
      title: "Products",
      value: stats?.products || 0,
      icon: <FaBoxOpen />,
      bgGradient: "bg-gradient-to-br from-emerald-400 to-emerald-600",
    },
    {
      title: "Delivery Orders",
      value: deliveryOrders,
      icon: <FaTruck />,
      bgGradient: "bg-gradient-to-br from-purple-500 to-purple-700",
    },
    {
      title: "Cancelled Orders",
      value: cancelledOrders,
      icon: <FaTimesCircle />,
      bgGradient: "bg-gradient-to-br from-red-500 to-rose-700",
    },
    {
      title: "Revenue",
      value: `₹ ${stats?.revenue?.toLocaleString() || 0}`,
      icon: <FaDollarSign />,
      bgGradient: "bg-gradient-to-br from-pink-500 to-pink-700",
    },
    {
      title: "Low Stock",
      value: lowStockCount || 0,
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


  const [categoryChart, setCategoryChart] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const categoryCounts = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const cat = data.category || "Other";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      const categoriesArray = Object.entries(categoryCounts).map(([name, value]) => ({
        name,
        value,
      }));

      setProductCategories(categoriesArray);

      // Prepare chart
      const colors = [
        "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1",
        "#8b5cf6", "#14b8a6", "#f43f5e", "#facc15", "#6b7280"
      ];

      setCategoryChart({
        labels: categoriesArray.map((d) => d.name),
        datasets: [
          {
            data: categoriesArray.map((d) => d.value),
            backgroundColor: categoriesArray.map((_, i) => colors[i % colors.length]),
            borderWidth: 2,
          },
        ],
      });
    });

    return () => unsubscribe();
  }, []);

 

  const stockChart = {
    labels: liveStocks.map((p) => p.name),
    datasets: [
      {
        label: "Stock ",
        data: liveStocks.map((p) => {
          if (p.combos?.length > 0) {
            return p.combos.reduce((total, combo) => total + (combo.quantity || 0), 0);
          } else {
            return p.stock || 0;
          }
        }),
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

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          font: {
            size: 14,

          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Stock ",
          font: {
            size: 14,
            weight: "600",
          },
        },
      },
      x: {
        title: {
          display: true,
          text: "Products",
          font: {
            size: 14,
            weight: "600",
          },
        },
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 30,
        },
      },
    },
  };


  return (
    <div className="p-6">
      <DashboardStats stats={statsData} />

      {/* <div className="mb-8 bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl p-6 border border-gray-200/60 shadow-sm">
       
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-lg shadow-md">
              ⚡
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-800 tracking-tight leading-none">Quick Access</h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Jump to any section instantly</p>
            </div>
          </div>
        </div> */}

        {/* Grid */}
        {/* <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {[
            { label: "New Orders",    icon: <FaShoppingCart />,  path: "/superadmin/newOrders",    color: "from-blue-500 to-blue-600",     shadow: "shadow-blue-200" },
            { label: "All Orders",    icon: <FaClipboardList />, path: "/superadmin/allOrders",    color: "from-indigo-500 to-indigo-600", shadow: "shadow-indigo-200" },
            { label: "Add Product",   icon: <FaPlusCircle />,    path: "/superadmin/addproducts",  color: "from-emerald-500 to-emerald-600",shadow: "shadow-emerald-200" },
            { label: "Add Category",  icon: <FaTags />,          path: "/superadmin/category",     color: "from-teal-500 to-teal-600",     shadow: "shadow-teal-200" },
            { label: "All Products",  icon: <FaBoxOpen />,       path: "/superadmin/allproducts",  color: "from-cyan-500 to-cyan-600",     shadow: "shadow-cyan-200" },
            { label: "Stock Details", icon: <FaLayerGroup />,    path: "/superadmin/stockDetails", color: "from-orange-500 to-orange-600", shadow: "shadow-orange-200" },
            { label: "New Users",     icon: <FaUserPlus />,      path: "/superadmin/newusers",     color: "from-purple-500 to-purple-600", shadow: "shadow-purple-200" },
            { label: "All Users",     icon: <FaUsers />,         path: "/superadmin/allusers",     color: "from-violet-500 to-violet-600", shadow: "shadow-violet-200" },
            { label: "Billings",      icon: <FaReceipt />,       path: "/superadmin/billing",      color: "from-pink-500 to-pink-600",     shadow: "shadow-pink-200" },
            { label: "Dealers",       icon: <FaHandshake />,     path: "/superadmin/dealers",      color: "from-rose-500 to-rose-600",     shadow: "shadow-rose-200" },
            { label: "Reviews",       icon: <FaStar />,          path: "/superadmin/allreviews",   color: "from-yellow-400 to-yellow-500", shadow: "shadow-yellow-200" },
            { label: "Razerpay Key",  icon: <FaKey />,           path: "/superadmin/razerpay",     color: "from-gray-600 to-gray-700",     shadow: "shadow-gray-300" },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className="group flex flex-col items-center gap-2.5 p-3 rounded-2xl bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
           
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-xl shadow-lg ${item.shadow} group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                {item.icon}
              </div>
            
              <span className="text-[11px] font-semibold text-gray-600 group-hover:text-gray-900 text-center leading-tight transition-colors duration-200">
                {item.label}
              </span>
            </button>
          ))}
        </div> 
      </div>*/}

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
            {categoryChart ? (
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
              <p className="text-gray-500 text-center mt-24">Loading chart...</p>
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
        {chartData ? (
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "bottom" } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        ) : (
          <p className="text-gray-500 text-center mt-24">Loading chart...</p>
        )}
      </div>
    </div>
      </div>

     
      <div className="bg-gradient-to-br from-white to-gray-50/90 p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-white/80 hover:shadow-[0_15px_40px_rgb(0,0,0,0.1)] transition-all duration-400 backdrop-blur-xl mt-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">Today’s Orders</h2>

        {/* 🖥️ Desktop / Tablet Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
            <thead className="bg-primary text-white">
              <tr>
                <th className="px-4 py-4">Order ID</th>
                <th className="px-4 py-4">User ID</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {todayOrders.length > 0 ? (
                todayOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/superadmin/orders/${order.id}`)}
                    className="text-center hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-4">{order.orderId}</td>
                    <td className="px-4 py-4">{order.shipping?.name}</td>
                    <td className="px-4 py-4">₹ {order.total}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${order.status === "Delivered"
                            ? "bg-green-100 text-green-600"
                            : order.status === "Cancelled"
                              ? "bg-red-100 text-red-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-gray-500 py-4">
                    No orders placed today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 📱 Mobile Card Layout */}
        <div className="md:hidden space-y-4">
          {todayOrders.length > 0 ? (
            todayOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/superadmin/orders/${order.id}`)}
                className="shadow-lg rounded-lg p-4 hover:shadow-md transition bg-gray-50"
              >
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-gray-800">Order ID</span>
                  <span className="text-gray-600">{order.orderId}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-gray-800">User</span>
                  <span className="text-gray-600">{order.shipping?.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-gray-800">Amount</span>
                  <span className="text-gray-600">₹ {order.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800">Status</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${order.status === "Delivered"
                        ? "bg-green-100 text-green-600"
                        : order.status === "Cancelled"
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No orders placed today.</p>
          )}
        </div>
      </div>


      {/* <CustomerReviews/> */}
    </div>
  );
};

export default Dashboard;

