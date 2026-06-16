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
import dayjs from "dayjs";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

// ---------------- Section Component ----------------
const SidebarSection = ({ title, icon, items, isExpanded, onLinkClick }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isExpanded) setOpen(false);
  }, [isExpanded]);

  return (
    <div className="mb-2">
      {/* Section Header */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center w-full py-3 px-3 cursor-pointer font-bold rounded-xl transition-all duration-300 group ${
          open ? "text-white" : "text-gray-400"
        } hover:bg-gray-800 hover:text-white ${
          isExpanded ? "justify-start" : "justify-center"
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
          className={`text-sm space-y-1.5 mt-2 overflow-hidden transition-all duration-500 ease-in-out ${
            isExpanded ? "pl-8" : "pl-0"
          } ${
            !isExpanded
              ? "absolute left-20 top-0 bg-gray-800 shadow-2xl rounded-xl w-52 z-50 border border-gray-700 py-2"
              : ""
          }`}
        >
          {items.map((item, idx) => (
            <li key={idx}>
              <NavLink
                to={item.path}
                onClick={() => onLinkClick?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-3 px-3 rounded-sm transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-white font-bold shadow-md shadow-primary/30 translate-x-1"
                      : "text-gray-400 hover:text-white hover:bg-gray-700 hover:translate-x-1"
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
    const todayStart = dayjs().startOf("day").toDate();
    const todayEnd = dayjs().endOf("day").toDate();
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("createdAt", ">=", todayStart), where("createdAt", "<=", todayEnd));
    const unsubscribe = onSnapshot(q, (snapshot) => setTodayOrdersCount(snapshot.size));
    return () => unsubscribe();
  }, []);

  // Approved / Non-approved products
  useEffect(() => {
    const productsRef = collection(db, "products");
    const unsubscribeApproved = onSnapshot(
      query(productsRef, where("isVisiable", "==", true)),
      (snapshot) => setApprovedUsersCount(snapshot.size)
    );
    const unsubscribeNonApproved = onSnapshot(
      query(productsRef, where("isVisiable", "==", false)),
      (snapshot) => setNonApprovedUsersCount(snapshot.size)
    );
    return () => {
      unsubscribeApproved();
      unsubscribeNonApproved();
    };
  }, []);

  // New users today
  useEffect(() => {
    const todayStart = dayjs().startOf("day").toDate();
    const todayEnd = dayjs().endOf("day").toDate();
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("createdAt", ">=", todayStart), where("createdAt", "<=", todayEnd));
    const unsubscribe = onSnapshot(q, (snapshot) => setNewUsersCount(snapshot.size));
    return () => unsubscribe();
  }, []);

  const handleLinkClick = () => {
    if (typeof setMobileMenu === "function" && window.innerWidth < 768) {
      setMobileMenu(false);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center font-medium rounded-sm transition-all duration-300 group mb-2 ${
      isActive
        ? "bg-primary text-white shadow-md shadow-primary/30"
        : "text-gray-400 hover:bg-gray-800 hover:text-white"
    } ${isExpanded ? "px-3 py-3" : "p-3 justify-center"}`;

  return (
    <nav className="space-y-2 p-4 flex flex-col h-full bg-gray-900 shadow-xl border-r border-gray-800">
      {/* ✅ Dashboard (exact match only) */}
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
          { name: "Add New Products", path: "/superadmin/addproducts", icon: <FaPlus /> },
          { name: "Add Category", path: "/superadmin/category", icon: <FaTags /> },
          { name: "Add Product Stock", path: "/superadmin/stocks", icon: <FaLayerGroup /> },
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
      <NavLink
        to="/"
        onClick={handleLinkClick}
        className={({ isActive }) =>
          `flex items-center font-medium rounded-xl transition-all duration-300 group mt-auto ${
            isActive
              ? "bg-gray-800 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          } ${isExpanded ? "px-3 py-2.5 mb-10 md:mb-3" : "p-3 justify-center mb-10 md:mb-3"}`
        }
      >
        <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110">
          <FaHome />
        </span>
        {isExpanded && <span className="ml-3 flex-1 font-bold text-left tracking-wide">Back Home</span>}
      </NavLink>
    </nav>
  );
};

export default Sidebar;