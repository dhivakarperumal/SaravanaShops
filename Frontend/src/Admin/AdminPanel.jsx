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
import { useContext } from "react";
import { AuthContext } from "../PrivateRouter.jsx/AuthContext";
import api from "../api";

const AdminPanel = () => {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [orders, setOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const quickLinks = [
    { label: "New Orders", path: "/superadmin/newOrders" },
    { label: "All Orders", path: "/superadmin/allOrders" },
    { label: "All Products", path: "/superadmin/allproducts" },
    { label: "Add Product", path: "/superadmin/addproducts" },
    { label: "Add Category", path: "/superadmin/category" },
    { label: "New Users", path: "/superadmin/newusers" },
    { label: "All Users", path: "/superadmin/allusers" },
    { label: "Billings", path: "/superadmin/billing" },
    { label: "Dealers", path: "/superadmin/dealers" },
    { label: "Reviews", path: "/superadmin/allreviews" },
    { label: "Stock Details", path: "/superadmin/stockDetails" },
    { label: "Razerpay Key", path: "/superadmin/razerpay" },
  ];

  const filteredLinks = searchQuery.trim()
    ? quickLinks.filter((l) =>
      l.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

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

  // Fetch header stats from MySQL
  useEffect(() => {
    const fetchHeaderStats = async () => {
      try {
        const res = await api.get('/dashboard/header');
        const data = res.data.data;
        setOrders(data.todayOrders || []);
        setLowStockProducts(data.lowStockProducts || []);
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error('Failed to fetch header stats:', err);
      }
    };

    fetchHeaderStats();
    // Refresh every 60 seconds
    const interval = setInterval(fetchHeaderStats, 60000);
    return () => clearInterval(interval);
  }, []);

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
        className={`fixed top-0 left-0 z-50 h-screen shadow
  bg-slate-300
  text-primary transition-transform duration-300 ease-in-out
  ${sidebarWidth}
  ${mobileMenu ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Toggle Button at vertical center of right edge */}
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 w-8 h-8 bg-gray-900 border border-gray-700 shadow-lg rounded-full items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 z-50 transition-all duration-300"
        >
          {isSidebarOpen ? <FaChevronLeft size={12} /> : <FaChevronRight size={12} />}
        </button>

        <div className="flex items-center bg-primary/70 justify-between px-4 py-3 border-b border-purple-400/20 relative shadow-lg shadow-purple-500/20">
          <div className="flex items-center w-full gap-3 overflow-hidden">
            {/* Logo Image with a crisp background plate */}
            <div className="bg-white p-1 rounded-xl shadow-lg shadow-purple-400/30 flex-shrink-0 flex items-center justify-center">
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
                <span className="text-purple-200 text-[11px] font-bold tracking-[0.15em] uppercase mt-0.5 truncate">
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

        <div className="flex flex-col h-[calc(100vh-70px)] min-h-0 bg-transparent">
          {/* Scrollable sidebar links - center section */}
          <div className="flex-1 min-h-0 overflow-y-auto sidebar-scroll">
            <Sidebar
              isSidebarOpen={isSidebarOpen}
              isSidebarHovered={isSidebarHovered}
              setIsSidebarHovered={setIsSidebarHovered}
              setMobileMenu={setMobileMenu}
            />
          </div>

          {/* Back Home fixed at bottom */}
          <div className="p-3 border-t mt-5 border-purple-400/20 bg-primary/70">
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
                <span className="w-6 h-6 flex-shrink-0 text-white flex items-center justify-center text-xl">
                  <FaHome />
                </span>
                <span className="ml-2 flex-1 text-white text-left">Back Home</span>
              </NavLink>
            )}
          </div>
        </div>
      </aside>

      {/* Main content area (moves right when sidebar expanded on md+) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${contentMargin}`}
      >
        {/* ─── Header ─── */}
        <header
          className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 h-[72px] transition-all duration-300 ${contentMargin}
            bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-[0_2px_20px_rgba(0,0,0,0.06)]`}
        >
          {/* LEFT — mobile hamburger + page title */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-xl flex items-center justify-center h-9 w-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              onClick={() => setMobileMenu(true)}
            >
              <FaBars />
            </button>
            <div className="hidden sm:flex flex-col justify-center">
              <h1 className="font-extrabold text-[22px] text-gray-800 tracking-tight capitalize leading-tight">
                {activeTab || "Dashboard"}
              </h1>
              <p className="text-[12px] font-medium text-gray-400 mt-0.5">
                Welcome back,{" "}
                <span className="text-primary font-bold">{userName || "Admin"}</span>{" "}
                👋
              </p>
            </div>
          </div>


          {/* RIGHT — search + action icons */}
          <div className="flex items-center gap-2" ref={profileRef}>

            {/* Search bar (right side) */}
            <div className="relative hidden sm:block">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 ${searchFocused
                  ? "border-primary bg-white shadow-[0_0_0_3px_rgba(140,82,255,0.15)] w-64"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300 w-44"
                  }`}
                style={{ transition: "width 0.3s ease, border-color 0.2s, box-shadow 0.2s" }}
              >
                <FaSearch className={`text-xs flex-shrink-0 transition-colors ${searchFocused ? "text-primary" : "text-gray-400"}`} />
                <input
                  type="text"
                  placeholder="Search…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => { setSearchFocused(false); setSearchQuery(""); }, 150)}
                  className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none font-medium min-w-0"
                />
                {searchQuery && (
                  <button
                    onMouseDown={(e) => { e.preventDefault(); setSearchQuery(""); }}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
              {/* Dropdown results */}
              {filteredLinks.length > 0 && searchFocused && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Pages</p>
                  </div>
                  {filteredLinks.map((link, i) => (
                    <button
                      key={i}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchFocused(false);
                        setSearchQuery("");
                        navigate(link.path);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 hover:text-primary text-sm font-medium text-gray-700 transition-colors border-b border-gray-50 last:border-none text-left"
                    >
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FaSearch className="text-[9px] text-primary" />
                      </div>
                      {link.label}
                    </button>
                  ))}
                </div>
              )}
              {searchQuery && filteredLinks.length === 0 && searchFocused && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 px-4 py-4 text-center">
                  <p className="text-sm text-gray-400">No results for <span className="font-semibold text-gray-600">"{searchQuery}"</span></p>
                </div>
              )}
            </div>

            <div className="relative" ref={bellRef}>
              <button
                onClick={() =>
                  setActivePanel((prev) =>
                    prev === "notifications" ? null : "notifications"
                  )
                }
                className="relative w-10 h-10 bg-gray-100 hover:bg-primary/10 text-gray-600 hover:text-primary cursor-pointer rounded-xl flex items-center justify-center transition-all duration-200 border border-gray-200 hover:border-primary/30"
              >
                <FaBell className="text-[17px]" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[10px] w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full font-bold shadow-md">
                    {notifications.length}
                  </span>
                )}
              </button>

              {activePanel === "notifications" && (
                <div
                  className="
    absolute top-12
    left-1 -translate-x-1/2
    md:right-0 md:left-auto md:translate-x-0
    w-[92vw] max-w-sm
    bg-white rounded-2xl
    border border-gray-100
    shadow-2xl
    z-[9999]
    overflow-hidden
  "
                >
                  <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-secondary/5">
                    <h3 className="font-bold text-gray-800 text-sm">🔔 Notifications</h3>
                  </div>
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
            <div className="relative" ref={stockRef}>
              <button
                onClick={() =>
                  setActivePanel((prev) =>
                    prev === "stock" ? null : "stock"
                  )
                }
                className="relative w-10 h-10 bg-gray-100 hover:bg-orange-50 text-gray-600 hover:text-orange-500 cursor-pointer rounded-xl flex items-center justify-center transition-all duration-200 border border-gray-200 hover:border-orange-200"
              >
                <AiOutlineStock className="text-[19px]" />
                {lowStockProducts.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-br from-orange-400 to-orange-600 text-white text-[10px] min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full font-bold shadow-md">
                    {lowStockProducts.length}
                  </span>
                )}
              </button>

              {activePanel === "stock" && (
                <div
                  className="
      absolute top-12
     -translate-x-3/4 left-1/1
      md:left-auto md:right-0 md:translate-x-0
      w-[92vw] max-w-[360px]
      bg-white rounded-2xl
      border border-gray-100
      shadow-2xl
      z-[9999]
      overflow-hidden
    "
                >
                  <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50">
                    <h2 className="text-sm font-bold text-orange-600 flex items-center gap-2">⚠️ Low Stock</h2>
                  </div>
                  <div className="p-3">
                    {lowStockProducts && lowStockProducts.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto rounded-xl">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-primary text-white sticky top-0">
                            <tr>
                              <th className="px-3 py-2 font-medium rounded-tl-lg">PID</th>
                              <th className="px-3 py-2 font-medium">Name</th>
                              <th className="px-3 py-2 font-medium">Category</th>
                              <th className="px-3 py-2 font-medium rounded-tr-lg">Stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lowStockProducts.map((item, idx) => (
                              <tr key={idx} className="text-center hover:bg-orange-50 transition-colors">
                                <td className="px-3 py-2 text-gray-600">{item.productId}</td>
                                <td className="px-3 py-2 font-medium text-gray-800">{item.name}</td>
                                <td className="px-3 py-2 text-gray-500">{item.category || "-"}</td>
                                <td className="px-3 py-2">
                                  <span className="bg-red-100 text-red-600 font-bold text-xs px-2 py-0.5 rounded-full">{item.stock}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">✅ All items are in stock.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() =>
                  setActivePanel((prev) =>
                    prev === "profile" ? null : "profile"
                  )
                }
                className="flex items-center gap-2.5 pl-1 pr-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 cursor-pointer"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md">
                  {userName?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <span className="hidden md:block text-sm font-semibold text-gray-700 max-w-[90px] truncate">{userName || "Admin"}</span>
                <svg className="w-3.5 h-3.5 text-gray-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              {activePanel === "profile" && (
                <div className="absolute right-0 top-14 w-64 bg-white rounded-2xl border border-gray-100 shadow-2xl z-50 overflow-hidden">
                  {/* Profile header */}
                  <div className="flex items-center gap-3 px-4 py-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-b border-gray-100">
                    <div className="w-11 h-11 bg-gradient-to-br from-primary to-secondary text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
                      {userName?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{userName || "Admin"}</p>
                      <p className="text-xs text-primary font-semibold mt-0.5">
                        {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Administrator"}
                      </p>
                    </div>
                  </div>
                  {/* Menu items */}
                  <div className="p-2">
                    <Link to="/superadmin/settings" onClick={() => setActivePanel(null)}>
                      <button className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-primary flex items-center gap-3 text-sm font-medium transition-colors">
                        <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                          <FaUserCircle className="text-sm" />
                        </div>
                        My Profile
                      </button>
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-500 hover:text-red-600 flex items-center gap-3 text-sm font-medium transition-colors"
                    >
                      <div className="w-7 h-7 bg-red-100 text-red-500 rounded-lg flex items-center justify-center">
                        <FaSignOutAlt className="text-sm" />
                      </div>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-gray-50 mt-15 px-2 md:px-2 py-6 overflow-y-auto">
          <Outlet />
        </main>

        <footer className="bg-gray-50 text-gray-600 text-sm py-6 shadow">
          <div className="max-w-screen-xl mx-auto px-4 flex justify-center items-center text-center">
            <div>
              © {new Date().getFullYear()} <strong>Sri Saravana Shoppings</strong>.
              All rights reserved. | Built by{" "}
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
