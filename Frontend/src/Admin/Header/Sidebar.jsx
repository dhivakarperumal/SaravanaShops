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
    <div>
      {/* Section Header */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center w-full py-2 px-3 cursor-pointer text-gray font-bold rounded hover:bg-bgcolor transition duration-300 ${
          isExpanded ? "justify-start" : "justify-center"
        }`}
      >
        <span className="w-4 h-4 text-gray flex items-center justify-center text-xl">
          {icon}
        </span>
        {isExpanded && <span className="ml-2 flex-1 text-left">{title}</span>}
        {isExpanded && (
          <span className="ml-auto">{open ? <FaChevronUp /> : <FaChevronDown />}</span>
        )}
      </button>

      {/* Dropdown Items */}
      {open && (
        <ul
          className={`text-sm space-y-2 mt-2 ${
            isExpanded ? "pl-10" : "pl-0"
          } ${
            !isExpanded
              ? "absolute left-16 top-0 bg-white shadow-md rounded-md w-48 z-50"
              : ""
          }`}
        >
          {items.map((item, idx) => (
            <li key={idx}>
              <NavLink
                to={item.path}
                onClick={() => onLinkClick?.()}
                className={({ isActive }) =>
                  `flex items-center gap-2 py-2 px-2 rounded transition font-bold duration-200 ${
                    isActive
                      ? "bg-primary text-white font-bold"
                      : "text-textcolor hover:bg-primary hover:text-white"
                  }`
                }
              >
                {item.icon && (
                  <span className="w-5 h-5 flex items-center justify-center text-lg flex-shrink-0">
                    {item.icon}
                  </span>
                )}
                {isExpanded && <span className="ml-2 flex-1 text-left">{item.name}</span>}
                {item.showCount && item.count !== undefined && (
                  <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full ml-auto">
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

  return (
    <nav className="space-y-3 p-4">
      {/* ✅ Dashboard (exact match only) */}
      <NavLink
        to="/superadmin"
        end // 👈 This makes sure it's active ONLY on /superadmin
        onClick={handleLinkClick}
        className={({ isActive }) =>
          `flex items-center rounded font-bold hover:bg-bgcolor transition ${
            isActive ? "bg-primary text-white" : ""
          } ${isExpanded ? "p-3" : "p-3 justify-center"}`
        }
      >
        <span className="w-4 h-4 text-gray flex-shrink-0 flex items-center justify-center text-xl">
          <AiFillDashboard />
        </span>
        {isExpanded && <span className="ml-2 flex-1 text-left">Dashboard</span>}
      </NavLink>

      {/* Orders */}
      <SidebarSection
        title="Orders"
        icon={<FaListAlt />}
        items={[
          {
            name: "New Orders",
            path: "/superadmin/newOrders",
            showCount: true,
            count: todayOrdersCount,
            icon: <FaShoppingCart />,
          },
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
          { name: "Add Category", path: "/superadmin/category", icon: <FaPlus /> },
          { name: "Add Product Stock", path: "/superadmin/stocks", icon: <FaWallet /> },
          { name: "Stock Details", path: "/superadmin/stockDetails", icon: <FaChartBar /> },
        ]}
        isExpanded={isExpanded}
        onLinkClick={handleLinkClick}
      />

       <NavLink
        to="/superadmin/razerpay"
        onClick={handleLinkClick}
        className={({ isActive }) =>
          `flex items-center rounded font-bold hover:bg-bgcolor transition ${
            isActive ? "bg-primary text-white" : ""
          } ${isExpanded ? "p-3" : "p-3 justify-center"}`
        }
      >
        <span className="w-4 h-4 text-gray flex-shrink-0 flex items-center justify-center text-xl">
          <FaBoxes />
        </span>
        {isExpanded && <span className="ml-2 flex-1 text-left">Razerpay Key</span>}
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
        icon={<FaBoxOpen />}
        items={[
          { name: "All Dealers", path: "/superadmin/dealers", icon: <FaPlus /> },
          { name: "Invoice", path: "/superadmin/invoice", icon: <FaPlus /> },
        ]}
        isExpanded={isExpanded}
        onLinkClick={handleLinkClick}
      />

      {/* Billings */}
      <NavLink
        to="/superadmin/billing"
        onClick={handleLinkClick}
        className={({ isActive }) =>
          `flex items-center rounded font-bold hover:bg-bgcolor transition ${
            isActive ? "bg-primary text-white" : ""
          } ${isExpanded ? "p-3" : "p-3 justify-center"}`
        }
      >
        <span className="w-4 h-4 text-gray flex-shrink-0 flex items-center justify-center text-xl">
          <FaBoxes />
        </span>
        {isExpanded && <span className="ml-2 flex-1 text-left">Billings</span>}
      </NavLink>

      {/* Upload Videos */}
      <NavLink
        to="/superadmin/videos"
        onClick={handleLinkClick}
        className={({ isActive }) =>
          `flex items-center rounded font-bold hover:bg-bgcolor transition ${
            isActive ? "bg-primary text-white" : ""
          } ${isExpanded ? "p-3" : "p-3 justify-center"}`
        }
      >
        <span className="w-4 h-4 text-gray flex-shrink-0 flex items-center justify-center text-xl">
          <AiOutlineVideoCamera />
        </span>
        {isExpanded && <span className="ml-2 flex-1 text-left">Upload Videos</span>}
      </NavLink>

      {/* Reviews */}
      <SidebarSection
        title="Reviews"
        icon={<FaStar />}
        items={[{ name: "Product Reviews", path: "/superadmin/allreviews", icon: <FaStar /> }]}
        isExpanded={isExpanded}
        onLinkClick={handleLinkClick}
      />

      {/* Settings */}
      <NavLink
        to="/superadmin/settings"
        onClick={handleLinkClick}
        className={({ isActive }) =>
          `flex items-center rounded font-bold hover:bg-bgcolor transition ${
            isActive ? "bg-primary text-white" : ""
          } ${isExpanded ? "p-3" : "p-3 justify-center"}`
        }
      >
        <span className="w-4 h-4 text-gray flex-shrink-0 flex items-center justify-center text-xl">
          <FaCog />
        </span>
        {isExpanded && <span className="ml-2 flex-1 text-left">Settings</span>}
      </NavLink>

      {/* Back Home */}
      <NavLink
        to="/"
        onClick={handleLinkClick}
        className={({ isActive }) =>
          `flex items-center rounded font-bold md:mb-3 mb-10 hover:bg-bgcolor transition ${
            isActive ? "bg-bgcolor text-gray font-bold" : "hover:bg-bgcolor"
          } ${isExpanded ? "p-3" : "p-3 justify-center"}`
        }
      >
        <span className="w-4 h-4 text-gray flex-shrink-0 flex items-center justify-center text-xl">
          <FaHome />
        </span>
        {isExpanded && <span className="ml-2 flex-1 text-left">Back Home</span>}
      </NavLink>
    </nav>
  );
};

export default Sidebar;