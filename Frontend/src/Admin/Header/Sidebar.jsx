import React, { useState, useEffect } from "react";
import {
  FaListAlt,
  FaBoxOpen,
  FaUserFriends,
  FaStar,
  FaChevronDown,
  FaChevronUp,
  FaHome,
  FaCog,
  FaShoppingCart,
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaBoxes,
  FaPlus,
  FaWallet,
  FaChartBar,
  FaUserPlus,
  FaUsers,
  FaTags,
  FaLayerGroup,
  FaKey,
  FaHandshake,
  FaFileInvoiceDollar,
  FaReceipt,
  FaStore,
} from "react-icons/fa";
import { AiFillDashboard, AiOutlineVideoCamera } from "react-icons/ai";
import { NavLink } from "react-router-dom";
import api from "../../api";
import dayjs from "dayjs";
// import { collection, query, where, onSnapshot } from "firebase/firestore";
// import { db } from "../../firebase";

// ---------------- Section Component ----------------
const SidebarSection = ({ title, icon, items, isExpanded, onLinkClick }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isExpanded) setOpen(false);
  }, [isExpanded]);

  return (
    <div className="mb-2 relative">
      {/* Section Header */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center w-full py-3 px-3 cursor-pointer font-semibold rounded-3xl transition-all duration-300 group ${open ? "bg-slate-800/95 text-white shadow-xl shadow-slate-900/40 border border-white/10" : "text-slate-200 hover:text-white hover:bg-slate-800/70"
          } ${isExpanded ? "justify-start" : "justify-center"
          }`}
      >
        <span className={`w-5 h-5 flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110 ${open ? "text-white" : ""}`}>
          {icon}
        </span>
        {isExpanded && <span className="ml-3 flex-1 text-left tracking-wide">{title}</span>}
        {isExpanded && (
          <span className="ml-auto text-sm transition-transform duration-300">
            {open ? <FaChevronUp /> : <FaChevronDown />}
          </span>
        )}
      </button>

      {/* Dropdown Items */}
      {open && (
        <ul
          className={`text-sm space-y-2 mt-3 overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? "pl-8" : "pl-0"
            } ${!isExpanded
              ? "absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-slate-950 shadow-[0_40px_80px_rgba(15,23,42,0.45)] rounded-3xl min-w-[220px] w-[220px] z-50 border border-white/10 py-3"
              : ""
            }`}
        >
          {items.map((item, idx) => (
            <li key={idx}>
              <NavLink
                to={item.path}
                onClick={() => onLinkClick?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-3 px-3 rounded-xl font-semibold transition-all duration-300 ${isActive
                    ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 border border-white/10 translate-x-1"
              : "text-slate-200 hover:text-white hover:bg-slate-800/70 hover:translate-x-1"
                  }`
                }
              >
                {item.icon && (
                  <span className="w-4 h-4 flex items-center justify-center text-lg flex-shrink-0">
                    {item.icon}
                  </span>
                )}
                {isExpanded && <span className="flex-1 text-left">{item.name}</span>}
                {!isExpanded && <span className="flex-1 text-left ml-2">{item.name}</span>}
                {item.showCount && item.count !== undefined && item.count > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto animate-pulse">
                    {item.count}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ---------------- Main Sidebar ----------------
const Sidebar = ({ isSidebarOpen, isSidebarHovered, setIsSidebarHovered, setMobileMenu }) => {
  const [todayOrdersCount, setTodayOrdersCount] = useState(0);
  const [approvedUsersCount, setApprovedUsersCount] = useState(0);
  const [nonApprovedUsersCount, setNonApprovedUsersCount] = useState(0);
  const [newUsersCount, setNewUsersCount] = useState(0);

  const isExpanded = isSidebarOpen || isSidebarHovered;

  // Orders today
  useEffect(() => {
    // const todayStart = dayjs().startOf("day").toDate();
    // const todayEnd = dayjs().endOf("day").toDate();
    // const ordersRef = collection(db, "orders");
    // const q = query(ordersRef, where("createdAt", ">=", todayStart), where("createdAt", "<=", todayEnd));
    // const unsubscribe = onSnapshot(q, (snapshot) => setTodayOrdersCount(snapshot.size));
    // return () => unsubscribe();
  }, []);

  // Approved / Non-approved products
  useEffect(() => {
    // const productsRef = collection(db, "products");
    // const unsubscribeApproved = onSnapshot(
    //   query(productsRef, where("isVisiable", "==", true)),
    //   (snapshot) => setApprovedUsersCount(snapshot.size)
    // );
    // const unsubscribeNonApproved = onSnapshot(
    //   query(productsRef, where("isVisiable", "==", false)),
    //   (snapshot) => setNonApprovedUsersCount(snapshot.size)
    // );
    // return () => {
    //   unsubscribeApproved();
    //   unsubscribeNonApproved();
    // };
  }, []);

  // New users today
  useEffect(() => {
    const fetchNewUsersCount = async () => {
      try {
        const res = await api.get("/users");
        if (Array.isArray(res.data)) {
          const todayStart = dayjs().startOf("day").toDate();
          const count = res.data.filter(u => {
            const createdAt = new Date(u.created_at || u.createdAt);
            if (isNaN(createdAt.getTime())) return false;
            return createdAt >= todayStart;
          }).length;
          setNewUsersCount(count);
        } else {
          setNewUsersCount(0);
        }
      } catch (err) {
        console.error("Error fetching new users:", err);
      }
    };
    fetchNewUsersCount();
  }, []);

  const handleLinkClick = () => {
    if (typeof setMobileMenu === "function" && window.innerWidth < 768) {
      setMobileMenu(false);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center font-medium rounded-3xl transition-all duration-300 group mb-2 ${isActive
      ? "bg-gradient-to-r from-primary to-secondary text-white shadow-xl shadow-primary/20"
      : "text-slate-200 hover:bg-slate-800/70 hover:text-white"
    } ${isExpanded ? "px-3 py-3" : "p-3 justify-center"}`;

  return (
    <nav
      onMouseEnter={() => setIsSidebarHovered(true)}
      onMouseLeave={() => setIsSidebarHovered(false)}
      className="relative space-y-4 p-4 flex flex-col min-h-screen h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white backdrop-blur-2xl border-r border-white/10 shadow-2xl overflow-x-visible overflow-y-auto"
    >

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-56 h-56 bg-purple-300/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-0 bg-transparent">
        <div className={`mb-6 rounded-3xl p-4 border transition-all duration-300 ${isExpanded ? "border-white/10 bg-slate-900/90 shadow-[0_24px_80px_rgba(15,23,42,0.35)]" : "border-white/5 bg-slate-950/95"}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-xl shadow-primary/30">
              <FaStore className="text-xl" />
            </div>
            {isExpanded && (
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Sri Saravana</p>
                <h2 className="text-lg font-semibold text-white tracking-tight">Admin Portal</h2>
              </div>
            )}
          </div>
        </div>

        <NavLink to="/superadmin" end onClick={handleLinkClick} className={navLinkClass}>
          <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110">
            <AiFillDashboard />
          </span>
          {isExpanded && <span className="ml-3 font-bold flex-1 text-left tracking-wide">Dashboard</span>}
        </NavLink>

        {/* Orders */}
        <SidebarSection
          title="Orders"
          icon={<FaListAlt />}
          items={[
            { name: "New Orders", path: "/superadmin/newOrders", showCount: true, count: todayOrdersCount, icon: <FaShoppingCart /> },
            { name: "All Orders", path: "/superadmin/allOrders", icon: <FaClipboardList /> },
            { name: "Delivered", path: "/superadmin/deliveryOrder", icon: <FaCheckCircle /> },
            { name: "Cancelled", path: "/superadmin/cancleOrders", icon: <FaTimesCircle /> },
          ]}
          isExpanded={isExpanded}
          onLinkClick={handleLinkClick}
        />

        {/* Products */}
        <SidebarSection
          title="Products"
          icon={<FaBoxOpen />}
          items={[
            { name: "All Products", path: "/superadmin/allproducts", icon: <FaBoxes /> },
            // { name: "Add New Products", path: "/superadmin/addproducts", icon: <FaPlus /> },
            { name: "Category", path: "/superadmin/category", icon: <FaTags /> },
            // { name: "Add Product Stock", path: "/superadmin/stocks", icon: <FaLayerGroup /> },
            { name: "Stock Details", path: "/superadmin/stockDetails", icon: <FaChartBar /> },
          ]}
          isExpanded={isExpanded}
          onLinkClick={handleLinkClick}
        />

        <NavLink to="/superadmin/razerpay" onClick={handleLinkClick} className={navLinkClass}>
          <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110">
            <FaKey />
          </span>
          {isExpanded && <span className="ml-3 font-bold flex-1 text-left tracking-wide">Razerpay Key</span>}
        </NavLink>

        {/* Users */}
        <SidebarSection
          title="Users"
          icon={<FaUserFriends />}
          items={[
            { name: "New Users", path: "/superadmin/newusers", showCount: true, count: newUsersCount, icon: <FaUserPlus /> },
            { name: "All Users", path: "/superadmin/allusers", icon: <FaUsers /> },
          ]}
          isExpanded={isExpanded}
          onLinkClick={handleLinkClick}
        />

        {/* Dealers */}
        <SidebarSection
          title="Dealers"
          icon={<FaStore />}
          items={[
            { name: "All Dealers", path: "/superadmin/dealers", icon: <FaHandshake /> },
            { name: "Invoice", path: "/superadmin/invoice", icon: <FaFileInvoiceDollar /> },
          ]}
          isExpanded={isExpanded}
          onLinkClick={handleLinkClick}
        />

        {/* Billings */}
        <NavLink to="/superadmin/billing" onClick={handleLinkClick} className={navLinkClass}>
          <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110">
            <FaReceipt />
          </span>
          {isExpanded && <span className="ml-3 font-bold flex-1 text-left tracking-wide">Billings</span>}
        </NavLink>

        {/* Upload Videos */}
        <NavLink to="/superadmin/videos" onClick={handleLinkClick} className={navLinkClass}>
          <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110">
            <AiOutlineVideoCamera />
          </span>
          {isExpanded && <span className="ml-3 flex-1 font-bold text-left tracking-wide">Upload Videos</span>}
        </NavLink>

        {/* Reviews */}
        <NavLink to="/superadmin/allreviews" onClick={handleLinkClick} className={navLinkClass}>
          <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110">
            <FaStar />
          </span>
          {isExpanded && <span className="ml-3 flex-1 font-bold text-left tracking-wide">Reviews</span>}
        </NavLink>

        {/* Settings */}
        {/* <NavLink to="/superadmin/settings" onClick={handleLinkClick} className={navLinkClass}>
        <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110">
          <FaCog />
        </span>
        {isExpanded && <span className="ml-3 flex-1 text-left tracking-wide">Settings</span>}
      </NavLink> */}

        {/* Spacer to push back home to bottom if needed */}
        <div className="flex-grow"></div>

        {/* Back Home */}

      </div>
    </nav>
  );
};

export default Sidebar;