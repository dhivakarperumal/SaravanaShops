import React, { useEffect, useState, useRef } from "react";
import {
  FaBars,
  FaSearch,
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaHome,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "/Image/logo.png";
import Sidebar from "./Header/Sidebar";
import { AiOutlineStock } from "react-icons/ai";
import { db } from "../firebase";
import { useContext } from "react";
import { AuthContext } from "../PrivateRouter.jsx/AuthContext";

import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";

const AdminPanel = () => {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [orders, setOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activePanel, setActivePanel] = useState(null);

  // Helper to compute total stock for a product
  const computeStock = (product) => {
    if (!product) return 0;
    // If there is a top-level stock number (MultiColor, Sarees, Jewels), use that
    if (product.stock != null && !isNaN(Number(product.stock))) {
      return Number(product.stock);
    }

    let total = 0;

    // Handle Bangles with colors -> per-size stock objects
    if (Array.isArray(product.colors)) {
      product.colors.forEach((c) => {
        const stockObj = c.stock || c.stocks || {};
        if (stockObj && typeof stockObj === "object") {
          Object.values(stockObj).forEach((v) => {
            const n = Number(v);
            if (!isNaN(n)) total += n;
          });
        } else if (!isNaN(Number(stockObj))) {
          total += Number(stockObj);
        }
      });
    }

    return total;
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const isExpanded = isSidebarOpen || isSidebarHovered;
  const sidebarWidth = isExpanded ? "w-74" : "w-20";
  const contentMargin = isExpanded ? "md:ml-72" : "md:ml-20";

  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (user && user.username) {
      setUserName(user.username);
    }
  }, [user]);


  const profileRef = useRef();
  const sidebarRef = useRef(null);
  const bellRef = useRef();
  const stockRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch today's orders (kept as you had it)
  useEffect(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const startTimestamp = Timestamp.fromDate(startOfToday);
    const endTimestamp = Timestamp.fromDate(startOfTomorrow);

    const ordersRef = collection(db, "orders");
    const ordersQuery = query(
      ordersRef,
      where("createdAt", ">=", startTimestamp),
      where("createdAt", "<", endTimestamp)
    );

    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const todayOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          type: "order",
          ...doc.data(),
        }));
        setOrders(todayOrders);
      },
      (error) => console.error("Error listening to orders:", error)
    );

    return () => unsubscribeOrders();
  }, []);

  // Low stock (kept)
  useEffect(() => {
    const productsRef = collection(db, "products");
    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        const allProducts = snapshot.docs.map((docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() };
          // compute aggregated stock
          return { ...data, stockComputed: computeStock(data) };
        });
        // flag low-stock using the computed stock
        setLowStockProducts(allProducts.filter((product) => (product.stockComputed ?? 0) < 5));
      },
      (error) => console.error("Error listening to products:", error)
    );
    return () => unsubscribe();
  }, []);

  // Retailer requests -> notifications (kept)
  useEffect(() => {
    const retailerRef = collection(db, "users");
    const unsubscribeRetailer = onSnapshot(
      retailerRef,
      (snapshot) => {
        const retailerRequests = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
              createdAt: data.createdAt?.toDate
                ? data.createdAt.toDate()
                : null,
            };
          })
          .filter(
            (user) =>
              user.message === "I am interested in joining as a retailer"
          );

  setNotifications(() => [...orders, ...retailerRequests]);
      },
      (error) => console.error("Error listening to retailer requests:", error)
    );

    return () => unsubscribeRetailer();
  }, [orders]);

  // Various route -> active tab mapping (kept)
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/superadmin/allOrders")) setActiveTab("All Orders");
    else if (path.startsWith("/superadmin/allproducts"))
      setActiveTab("All Products");

    else if (path.startsWith("/superadmin/addproducts"))
      setActiveTab("Add Products");
    else if (path.startsWith("/superadmin/deliveryOrder"))
      setActiveTab("Delivered");
    else if (path.startsWith("/superadmin/cancleOrders"))
      setActiveTab("Cancelled");
    else if (path.startsWith("/superadmin/newOrders"))
      setActiveTab("New Orders");
   
   
   
    else if (path.startsWith("/superadmin/stocks"))
      setActiveTab("Add Product Stock");
    
    else if (path.startsWith("/superadmin/category")) 
      setActiveTab("Add Category");
  
    

    else if (path.startsWith("/superadmin/videos"))
      setActiveTab("Upload Videos");
   
    else if (path.startsWith("/superadmin/newusers")) setActiveTab("New Users");
    else if (path.startsWith("/superadmin/allusers")) setActiveTab("All Users");
    else if (path.startsWith("/superadmin/billing")) setActiveTab("Billing");
    else if (path.startsWith("/superadmin/invoice")) setActiveTab("Invoice");
    else if (path.startsWith("/superadmin/dealer")) setActiveTab("Dealers");
  
    else if (path.startsWith("/superadmin/allreviews")) setActiveTab("Reviews");
    else if (path.startsWith("/superadmin/stockDetails"))
      setActiveTab("StockDetails");
    else if (path.startsWith("/superadmin/settings")) setActiveTab("Settings");
    else if (path === "/superadmin") setActiveTab("Dashboard");
    else setActiveTab("");
  }, [location]);

  // close dropdowns when clicking outside (kept)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        (profileRef.current && profileRef.current.contains(e.target)) ||
        (bellRef.current && bellRef.current.contains(e.target)) ||
        (stockRef.current && stockRef.current.contains(e.target))
      )
        return;
      setActivePanel(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay (covers content when sidebar open on mobile) */}
      {mobileMenu && (
        <div
          className="fixed inset-0 bg-black/30 bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* Sidebar container (fixed so it slides in/out) */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 z-50 h-screen shadow bg-gray-900 text-gray-300 transition-transform duration-300 ease-in-out ${sidebarWidth} ${mobileMenu ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        {/* Toggle Button at vertical center of right edge */}
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 w-8 h-8 bg-gray-900 border border-gray-700 shadow-lg rounded-full items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 z-50 transition-all duration-300"
        >
          {isSidebarOpen ? <FaChevronLeft size={12} /> : <FaChevronRight size={12} />}
        </button>

        <div className="flex items-center bg-gray-900 justify-between px-4 py-3 border-b border-gray-800 relative">
          <div className="flex items-center w-full gap-3 overflow-hidden">
            {/* Logo Image with a crisp background plate */}
            <div className="bg-white p-1 rounded-xl shadow-md flex-shrink-0 flex items-center justify-center">
              <img
                src={logo}
                alt="Admin Logo"
                className="w-12 h-12 object-contain"
              />
            </div>
            
            {/* Stacked Shop Name */}
            {isExpanded && (
              <div className="flex flex-col flex-1 overflow-hidden transition-all duration-300">
                <span className="text-white font-extrabold text-[15px] leading-tight tracking-wide truncate">
                  Sri Saravana
                </span>
                <span className="text-primary/80 text-[11px] font-bold tracking-[0.15em] uppercase mt-0.5 truncate">
                  Shoppings
                </span>
              </div>
            )}
          </div>

          <button
            className="md:hidden absolute right-4 top-4 cursor-pointer text-gray-400 hover:text-white text-xl bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center"
            onClick={() => setMobileMenu(false)}
          >
            ✕
          </button>
        </div>

        <div className="h-full flex flex-col">
          {/* Scrollable sidebar links */}
          <div className="flex-1 overflow-y-auto sidebar-scroll">
            <Sidebar
              isSidebarOpen={isSidebarOpen}
              isSidebarHovered={isSidebarHovered}
              setIsSidebarHovered={setIsSidebarHovered}
              setMobileMenu={setMobileMenu}
            />
          </div>

          {/* Back Home always at bottom */}
          <div className="mt-auto p-3">
            {isSidebarOpen && (
              <NavLink
                to="/"
                onClick={() => setMobileMenu(false)}
                className={({ isActive }) =>
                  `flex items-center rounded font-bold hidden md:inline-flex hover:bg-bgcolor transition duration-200 ${isActive
                    ? "bg-bgcolor text-gray font-bold"
                    : "text-textcolor hover:bg-bgcolor hover:text-textcolor"
                  } p-3`
                }
              >
                <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-xl">
                  <FaHome />
                </span>
                <span className="ml-2 flex-1 text-left">Back</span>
              </NavLink>
            )}
          </div>
        </div>
      </aside>

      {/* Main content area (moves right when sidebar expanded on md+) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${contentMargin}`}
      >
        {/* Header */}
        <header
          className={`fixed top-0 left-0 right-0 z-40 shadow bg-white text-primary flex items-center justify-between px-4 h-20 py-3 transition-all duration-300 ${contentMargin}`}
        >
          <div className="flex items-center gap-4 w-full md:w-auto ml-10 md:ml-0">
            {/* Mobile hamburger (opens mobile menu) */}
            <button
              className="md:hidden text-2xl flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenu(true)}
            >
              <FaBars />
            </button>

            <div className="flex-col hidden sm:flex justify-center ml-2">
              <h1 className="font-extrabold text-2xl text-gray-800 tracking-tight whitespace-nowrap capitalize leading-tight drop-shadow-sm">
                {activeTab || "Dashboard"}
              </h1>
              <p className="text-[13px] font-medium text-gray-500 mt-0.5">
                Welcome back, <span className="text-primary font-semibold">{userName || "Admin"}</span> 👋
              </p>
            </div>
          </div>

          {/* Right side - notifications / profile etc (unchanged) */}
          <div
            className="flex items-center gap-4 md:gap-1 ml-auto relative"
            ref={profileRef}
          >
            {/* ... notification bell, low-stock, profile dropdown remain exactly as you had ... */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() =>
                  setActivePanel((prev) =>
                    prev === "notifications" ? null : "notifications"
                  )
                }
                className="relative w-10 h-10 bg-primary cursor-pointer text-white rounded-full flex items-center justify-center shadow"
              >
                <FaBell className="text-xl" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-red-500 text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                    {notifications.length}
                  </span>
                )}
              </button>

              {activePanel === "notifications" && (
                <div className="absolute -right-36 top-12 w-[90vw] max-w-xs sm:max-w-sm bg-white shadow-xl rounded-lg z-50">
                  <ul className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <li className="p-4 text-gray-500 text-sm text-center">
                        No new notifications
                      </li>
                    ) : (
                      notifications.map((item) => (
                        <li
                          key={item.id}
                          className="flex gap-3 p-4 hover:bg-gray-50 transition cursor-pointer"
                        >
                          <div className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center">
                            {item.type === "order" ? "📦" : "🛒"}
                          </div>
                          <div className="flex-1 min-w-0">
                            {item.type === "order" ? (
                              <>
                                <p className="font-medium text-gray-800 truncate">
                                  {item.shippingAddress?.firstname}
                                </p>
                                <p className="text-sm text-gray-600 truncate">
                                  Placed an order - #{item.orderId}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {item.time}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-medium text-gray-800 truncate">
                                  {item.name}
                                </p>
                                <p className="text-sm text-gray-600 truncate">
                                  {item.message}
                                </p>
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between"
                                >
                                  <p className="font-medium text-gray-800 truncate">
                                    {item.name}
                                  </p>
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={() =>
                                        handleAcceptRetailer(item.id)
                                      }
                                      className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleRejectRetailer(item.id)
                                      }
                                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Low stock button */}
            <div
              className="relative p-4 flex justify-end items-center"
              ref={stockRef}
            >
              <div className="relative">
                <button
                  onClick={() =>
                    setActivePanel((prev) =>
                      prev === "stock" ? null : "stock"
                    )
                  }
                  className="w-10 h-10 bg-primary text-white cursor-pointer rounded-full flex items-center justify-center shadow hover:bg-gray-700"
                >
                  <AiOutlineStock className="text-xl" />
                  {lowStockProducts.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-red-500 text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                      {lowStockProducts.length}
                    </span>
                  )}
                </button>

                {activePanel === "stock" && (
                  <div className="absolute -right-17 top-12 w-[90vw] max-w-xs sm:max-w-sm bg-white shadow-xl rounded-lg z-50">
                    <div className="p-4 relative">
                      <h2 className="text-lg font-semibold mb-3 text-yellow-600">
                        Low Stock Items
                      </h2>
                      {lowStockProducts && lowStockProducts.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto rounded-md">
                          <table className="min-w-full text-left text-sm">
                            <thead className="bg-primary text-white sticky top-0">
                              <tr>
                                <th className="px-4 py-2 font-medium">PID</th>
                                <th className="px-4 py-2 font-medium">Name</th>
                                <th className="px-4 py-2 font-medium">
                                  Category
                                </th>
                                <th className="px-4 py-2 font-medium">Stock</th>
                                
                              </tr>
                            </thead>
                            <tbody>
                              {lowStockProducts.map((item, idx) => (
                                <tr key={idx} className="text-center">
                                  <td className="px-1 py-2">
                                    {item.productId}
                                  </td>
                                  <td className="px-1 py-2">{item.name}</td>
                                   <td className="px-1 py-2">
                                    {item.category || "-"}
                                  </td>
                                  <td className="px-1 py-2">{item.stock}</td>
                                 
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500">All items are in stock.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() =>
                  setActivePanel((prev) =>
                    prev === "profile" ? null : "profile"
                  )
                }
                className="w-10 h-10 bg-primary text-white cursor-pointer rounded-full flex items-center justify-center shadow"
              >
                <span className="font-bold">{userName?.charAt(0)?.toUpperCase()}</span>


              </button>

              {activePanel === "profile" && (
                <div className="absolute right-2 top-14 w-64 bg-white text-black shadow-md rounded-lg z-50">
                  <div className="flex items-center px-4 py-3 gap-3">
                    <div>
                      <p className="font-semibold">{userName || "Admin"}</p>
                      <p className="text-xs text-gray-500">

                        <p className="text-xs text-gray-500">
                          {user?.role
                            ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                            : "Admin"}
                        </p>

                      </p>
                    </div>
                  </div>

                  <Link to="/superadmin/settings">
                    <button
                      onClick={() =>
                        setActivePanel((prev) =>
                          prev === "profile" ? null : "profile"
                        )
                      }
                      className="w-full text-left  px-4 cursor-pointer py-2 hover:bg-gray-900 text-gray-800 hover:text-white flex items-center gap-2"
                    >
                      <FaUserCircle className="text-gray-600 " />
                      My Profile
                    </button>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 cursor-pointer py-2 hover:bg-red-100 text-red-600 hover:text-red-800 flex items-center gap-2"
                  >
                    <FaSignOutAlt className="text-red-600" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 mt-20 px-2 md:px-2 py-6 overflow-y-auto">
          <Outlet />
        </main>

        <footer className="text-gray text-sm py-6 shadow mt-10">
          <div className="max-w-screen-xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              © {new Date().getFullYear()} <strong>Sri Saravana Shoppings </strong>
              . All rights reserved. | Built by{" "}
              <a
                href="https://qtechx.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary font-medium"
              >
                Q-Techx Solutions
              </a>
            </div>

           
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminPanel;
