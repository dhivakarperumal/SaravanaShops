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
  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
    {stats.map((stat, i) => (
      <div
        key={i}
        className={`group relative overflow-hidden rounded-xl p-4 transform transition duration-300 ease-in-out hover:scale-105 hover:shadow-xl ${stat.bgColor}`}
      >
        <div
          className={`absolute bottom-0 right-0 w-32 h-32 ${stat.round1} opacity-30 rounded-full translate-x-1/3 translate-y-1/3 transition-all duration-300 group-hover:opacity-50 group-hover:scale-110`}
        ></div>
        <div
          className={`absolute bottom-0 right-0 w-24 h-24 ${stat.round2} opacity-40 rounded-full translate-x-1/3 translate-y-1/3 transition-all duration-300 group-hover:opacity-60 group-hover:scale-105`}
        ></div>

        <div className="flex items-start justify-between">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${stat.iconBg}`}
          >
            {stat.icon}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
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
      bgColor: "bg-blue-100",
      iconBg: "bg-blue-500 text-white",
      round1: "bg-blue-300",
      round2: "bg-blue-200",
    },
    {
      title: "Products",
      value: stats?.products || 0,
      icon: <FaBoxOpen />,
      bgColor: "bg-green-100",
      iconBg: "bg-green-500 text-white",
      round1: "bg-green-300",
      round2: "bg-green-200",
    },
    {
      title: "Delivery Orders",
      value: deliveryOrders,
      icon: <FaTruck />,
      bgColor: "bg-purple-100",
      iconBg: "bg-purple-500 text-white",
      round1: "bg-purple-300",
      round2: "bg-purple-200",
    },
    {
      title: "Cancelled Orders",
      value: cancelledOrders,
      icon: <FaTimesCircle />,
      bgColor: "bg-red-100",
      iconBg: "bg-red-500 text-white",
      round1: "bg-red-300",
      round2: "bg-red-200",
    },
    {
      title: "Revenue",
      value: `₹ ${stats?.revenue?.toLocaleString() || 0}`,
      icon: <FaDollarSign />,
      bgColor: "bg-pink-100",
      iconBg: "bg-pink-500 text-white",
      round1: "bg-pink-300",
      round2: "bg-pink-200",
    },
    {
      title: "Low Stock",
      value: lowStockCount || 0,
      icon: <FaBoxOpen />,
      bgColor: "bg-red-100",
      iconBg: "bg-red-500 text-white",
      round1: "bg-red-300",
      round2: "bg-red-200",
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Revenue</h2>
          <Bar data={revenueChart} />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
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

      <div className="bg-white p-6 rounded-2xl shadow-md w-full overflow-x-auto hidden ">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Current Product Stock Levels
        </h2>
        <Bar data={stockChart} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 mt-10 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Orders</h2>
          <Line data={ordersChart} />
        </div>

       <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
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

     
      <div className="bg-white p-6 rounded-2xl shadow-md mt-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Today’s Orders</h2>

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

