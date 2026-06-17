import React, { useEffect, useState, useRef, useContext } from "react";
import {
  FiShoppingCart,
  FiUser,
  FiMenu,
  FiChevronRight,
  FiChevronDown,
} from "react-icons/fi";
import { IoMdHeartEmpty } from "react-icons/io";
import { FaBoxOpen } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Search from "../Components/Search";
import Login from "./Login";
import Register from "./Register";
import Addtocart from "../Products/Addtocart";
import Wishlist from "../Products/Wishlist";
import { AuthContext } from "../PrivateRouter.jsx/AuthContext";
import api from "../api";

function Navbar() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const userDropdownRef = useRef(null);

  // UI States
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categorySidebarOpen, setCategorySidebarOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState(null);

  // Data states
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        if (data.success) {
          setCategories(data.data);
        } else {
          setCategories(data);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  // Fetch cart count when cart opens or user changes
  useEffect(() => {
    const updateCartCount = async () => {
      if (!user) {
        setCartCount(0);
        return;
      }
      try {
        const userId = user?.user_id || user?.id;
        if (!userId) {
          setCartCount(0);
          return;
        }
        const res = await api.get(`/cart/${userId}`);
        const items = Array.isArray(res.data) ? res.data : [];
        const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(totalCount);
      } catch (error) {
        console.error("Error fetching cart count:", error);
        setCartCount(0);
      }
    };
    updateCartCount();
    // Update cart count every 2 seconds when cart is open
    const interval = cartOpen ? setInterval(updateCartCount, 2000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, cartOpen]);

  // Close all sidebars except the one clicked
  const closeAllExcept = (except) => {
    if (except !== "cart") setCartOpen(false);
    if (except !== "wishlist") setWishlistOpen(false);
    if (except !== "user") setUserDropdownOpen(false);
    if (except !== "search") setSearchOpen(false);
    if (except !== "sidebar") setSidebarOpen(false);
    if (except !== "categorySidebar") setCategorySidebarOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset sidebars when user logs out
  useEffect(() => {
    setCartOpen(false);
    setWishlistOpen(false);
  }, [user]);

  // Check user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, [setUser]);

  // Category click handler
  const handleCategoryClick = (cat) => {
    navigate("/category", {
      state: { filterType: "category", filterValue: cat.cname },
    });
    closeAllExcept();
  };

  // Orders click
  const handleOrdersClick = () => {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    navigate("/account", { state: { tab: "orders" } });
  };

  // Account click handler
  const handleAccountClick = (e) => {
    e.stopPropagation();
    navigate("/account");
    setUserDropdownOpen(false);
  };

  // Logout handler
  const handleLogout = (e) => {
    e.stopPropagation();
    try {
      // Clear all auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Update auth context
      setUser(null);
      setUserDropdownOpen(false);
      
      // Show success message and navigate
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
  };

  return (
    <>
    <nav className="sticky top-0 z-40 border-b border-primary/10 bg-white/90 backdrop-blur-md shadow-md">
      <div className="max-w-8xl mx-auto py-2 sm:px-6 lg:px-20 px-5">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/">
            <img src="/Image/logo.png" alt="Logo" className="h-16 w-auto" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex space-x-6 items-center">
            <Link to="/" className="font-semibold text-gray-700 hover:text-primary">
              Home
            </Link>
            <Link to="/allproducts" className="font-semibold text-gray-700 hover:text-primary">
              Shopping
            </Link>

            {/* Category dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setHoveredCat(true)}
              onMouseLeave={() => setHoveredCat(false)}
            >
              <span className="flex items-center gap-1 font-semibold text-gray-700 hover:text-primary cursor-pointer">
                Category
                <FiChevronDown
                  size={16}
                  className={`transition-transform ${hoveredCat ? "rotate-180" : ""}`}
                />
              </span>

              <div
                className={`absolute left-0 mt-2 w-48 bg-white border border-primary/30 rounded-xl shadow-md transition-all ${
                  hoveredCat
                    ? "opacity-100 visible scale-100"
                    : "opacity-0 invisible scale-95"
                }`}
              >
                {categories.map((cat) => (
                  <button
                    key={cat.id || cat.cname}
                    onClick={() => handleCategoryClick(cat)}
                    className="block w-full px-4 py-2 text-left text-primary hover:bg-primary hover:text-white rounded-xl whitespace-nowrap"
                  >
                    {cat.cname}
                  </button>
                ))}
              </div>
            </div>

            <Link to="/about" className="font-semibold text-gray-700 hover:text-primary">
              About us
            </Link>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Search */}
            <Search
              isOpen={searchOpen}
              onOpen={() => {
                closeAllExcept("search");
                setSearchOpen(true);
              }}
              onClose={() => setSearchOpen(false)}
            />

            {/* Cart */}
            <div className="relative">
              <FiShoppingCart
                size={20}
                onClick={() => {
                  closeAllExcept("cart");
                  setCartOpen((prev) => !prev);
                }}
                className="text-primary cursor-pointer hover:scale-110 transition"
              />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-primary text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>

            {/* Wishlist */}
            <div className="relative">
              <IoMdHeartEmpty
                size={22}
                onClick={() => {
                  closeAllExcept("wishlist");
                  setWishlistOpen((prev) => !prev);
                }}
                className="text-primary cursor-pointer hover:scale-110 transition"
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-primary text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </div>

            {/* Orders */}
            <div className="relative">
              <FaBoxOpen
                size={22}
                onClick={handleOrdersClick}
                className="text-primary cursor-pointer hover:scale-110 transition"
              />
              {orderCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-primary text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {orderCount}
                </span>
              )}
            </div>

            {/* User dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeAllExcept("user");
                    setUserDropdownOpen((prev) => !prev);
                  }}
                  className="w-8 h-8 bg-primary text-white cursor-pointer rounded-full flex items-center justify-center font-semibold"
                >
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </button>
                {userDropdownOpen && (
                  <div
                    ref={userDropdownRef}
                    className="absolute right-0 mt-2 w-40 bg-white shadow-md rounded-lg py-2 z-50"
                  >
                    <button
                      onClick={handleAccountClick}
                      className="w-full px-4 py-2 cursor-pointer text-gray-700 hover:bg-indigo-100 text-left"
                    >
                      My Account
                    </button>
                    {user.role === "admin" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/superadmin");
                          setUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 cursor-pointer text-gray-700 hover:bg-indigo-100 text-left"
                      >
                        Admin Panel
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 cursor-pointer text-gray-700 hover:bg-indigo-100 text-left"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="text-primary cursor-pointer hover:scale-110 transition"
              >
                <FiUser size={24} />
              </button>
            )}

            {/* Mobile menu */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-primary cursor-pointer hover:scale-110 transition flex items-center justify-center h-8 w-8"
              >
                <FiMenu size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

      {/* Modals */}
      {loginOpen && <Login onClose={() => setLoginOpen(false)} setUser={setUser} onOpenRegister={() => {
        setLoginOpen(false);
        setRegisterOpen(true);
      }} />}
      {registerOpen && <Register onClose={() => setRegisterOpen(false)} setUser={setUser} onOpenLogin={() => {
        setRegisterOpen(false);
        setLoginOpen(true);
      }} />}
      {cartOpen && <Addtocart isOpen={cartOpen} onClose={() => setCartOpen(false)} />}
      {wishlistOpen && <Wishlist isOpen={wishlistOpen} onClose={() => setWishlistOpen(false)} />}

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[9999] flex"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSidebarOpen(false);
          }}
        >
          <div
            className={`bg-white h-[100vh] w-[50%] shadow-lg p-6 relative transform transition-transform duration-300 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <button
              className="absolute top-4 right-4 text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>

            <div className="flex flex-col space-y-4 mt-10">
              <button
                onClick={() => {
                  navigate("/");
                  setSidebarOpen(false);
                }}
                className="text-gray-800 hover:text-indigo-600 text-left"
              >
                Home
              </button>
              <button
                onClick={() => {
                  navigate("/allproducts");
                  setSidebarOpen(false);
                }}
                className="text-gray-800 hover:text-indigo-600 text-left"
              >
                Shopping
              </button>
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  setCategorySidebarOpen(true);
                }}
                className="text-gray-800 hover:text-indigo-600 text-left"
              >
                Category
              </button>
              <button
                onClick={() => {
                  navigate("/about");
                  setSidebarOpen(false);
                }}
                className="text-gray-800 hover:text-indigo-600 text-left"
              >
                About us
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Sidebar */}
      {categorySidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[9999] flex"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCategorySidebarOpen(false);
          }}
        >
          <div className="bg-white h-[100vh] w-[50%] shadow-lg p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-600"
              onClick={() => setCategorySidebarOpen(false)}
            >
              ✕
            </button>

            <div className="flex flex-col space-y-4 mt-10">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    handleCategoryClick(cat);
                    setCategorySidebarOpen(false);
                  }}
                  className="text-gray-800 hover:text-indigo-600 text-left"
                >
                  {cat.cname}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
