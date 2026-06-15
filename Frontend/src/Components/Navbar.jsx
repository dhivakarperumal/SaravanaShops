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
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  // added imports
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import Search from "../Components/Search";
import Login from "./Login";
import Register from "./Register";
import Addtocart from "../Products/Addtocart";
import Wishlist from "../Products/Wishlist";
import { AuthContext } from "../PrivateRouter.jsx/AuthContext";

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
  const [subcategorySidebarOpen, setSubcategorySidebarOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState(null);

  // Data states
  const [categories, setCategories] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  // Close all sidebars except the one clicked
  const closeAllExcept = (except) => {
    if (except !== "cart") setCartOpen(false);
    if (except !== "wishlist") setWishlistOpen(false);
    if (except !== "user") setUserDropdownOpen(false);
    if (except !== "search") setSearchOpen(false);
    if (except !== "sidebar") setSidebarOpen(false);
    if (except !== "categorySidebar") setCategorySidebarOpen(false);
    if (except !== "subcategorySidebar") setSubcategorySidebarOpen(false);
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

  // Helper: migrate user document + subcollections from oldUid -> newUid
  const migrateUserData = async (oldUid, newUid) => {
    try {
      if (!oldUid || !newUid || oldUid === newUid) return;
      const oldUserRef = doc(db, "users", oldUid);
      const oldSnap = await getDoc(oldUserRef);
      if (!oldSnap.exists()) return;

      // copy main user doc to new uid (merge to not lose any existing fields)
      const newUserRef = doc(db, "users", newUid);
      await setDoc(newUserRef, { uid: newUid, ...oldSnap.data() }, { merge: true });

      // list of subcollections to migrate (adjust if you have others)
      const subcols = ["cart", "wishlist", "orders"];
      for (const colName of subcols) {
        const oldColSnap = await getDocs(collection(db, "users", oldUid, colName));
        for (const sDoc of oldColSnap.docs) {
          // copy each doc under new uid
          await setDoc(doc(db, "users", newUid, colName, sDoc.id), sDoc.data());
        }
      }

      // delete old subcollection docs then old user doc
      for (const colName of subcols) {
        const oldColSnap = await getDocs(collection(db, "users", oldUid, colName));
        for (const sDoc of oldColSnap.docs) {
          await deleteDoc(doc(db, "users", oldUid, colName, sDoc.id));
        }
      }
      await deleteDoc(oldUserRef);
    } catch (err) {
      console.error("Error migrating user data:", err);
    }
  };

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUser({ uid: currentUser.uid, ...userSnap.data() });
          } else {
            // Check for any existing user doc with same email (to avoid duplicates)
            const q = query(collection(db, "users"), where("email", "==", currentUser.email));
            const existingSnap = await getDocs(q);

            if (!existingSnap.empty) {
              // found existing document(s) with same email - pick the first and migrate
              const existingDoc = existingSnap.docs[0];
              const existingData = existingDoc.data();

              if (existingDoc.id !== currentUser.uid) {
                // migrate data and subcollections from old uid -> new auth uid
                await migrateUserData(existingDoc.id, currentUser.uid);
              }

              // ensure a user doc exists for current uid with sensible merged data
              const merged = {
                uid: currentUser.uid,
                username: currentUser.displayName || existingData.username || "User",
                email: currentUser.email,
                role: existingData.role || "user",
                createdAt: existingData.createdAt || new Date(),
              };
              await setDoc(userRef, merged, { merge: true });
              setUser({ uid: currentUser.uid, ...merged });
            } else {
              // no existing user by email -> create new user doc
              const newUser = {
                uid: currentUser.uid,
                username: currentUser.displayName || "User",
                email: currentUser.email,
                role: "user",
                createdAt: new Date(),
              };
              await setDoc(userRef, newUser);
              setUser(newUser);
            }
          }
        } catch (err) {
          console.error("Auth state handling error:", err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [setUser]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const snapshot = await getDocs(collection(db, "categories"));
      setCategories(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchCategories();
  }, []);

  // Listen for cart/wishlist/order updates
  useEffect(() => {
    if (!user?.uid) {
      setCartCount(0);
      setWishlistCount(0);
      setOrderCount(0);
      return;
    }

    const unsubCart = onSnapshot(
      collection(db, "users", user.uid, "cart"),
      (snap) => setCartCount(snap.size)
    );
    const unsubWishlist = onSnapshot(
      collection(db, "users", user.uid, "wishlist"),
      (snap) => setWishlistCount(snap.size)
    );
    const unsubOrders = onSnapshot(
      collection(db, "users", user.uid, "orders"),
      (snap) => setOrderCount(snap.size)
    );

    return () => {
      unsubCart();
      unsubWishlist();
      unsubOrders();
    };
  }, [user]);

  // Category/Subcategory click
  const handleCategoryClick = (cat) => {
    navigate("/category", {
      state: { filterType: "category", filterValue: cat.cname },
    });
    closeAllExcept();
  };

  const handleSubcategoryClick = (sub) => {
    navigate("/category", {
      state: { filterType: "subcategory", filterValue: sub },
    });
    closeAllExcept();
  };

  // Orders click
  const handleOrdersClick = () => {
    if (!user) return navigate("/login");
    navigate("/account", { state: { tab: "orders" } });
  };

  // Update click handler to properly handle navigation
  const handleAccountClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    navigate("/account");
    setUserDropdownOpen(false); // Close dropdown after navigation
  };

  return (
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
              onMouseLeave={() => setHoveredCat(null)}
            >
              <span className="flex items-center gap-1 font-semibold text-gray-700 hover:text-primary cursor-pointer">
                Category
                <FiChevronDown
                  size={16}
                  className={`transition-transform ${hoveredCat ? "rotate-180" : ""}`}
                />
              </span>

              <div
                className={`absolute left-0 mt-2 bg-white border border-primary/30 rounded-xl shadow-md transition-all ${
                  hoveredCat
                    ? "opacity-100 visible scale-100"
                    : "opacity-0 invisible scale-95"
                }`}
              >
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className="block w-full px-4 py-2 text-left text-primary hover:bg-primary hover:text-white rounded-xl"
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
                    e.stopPropagation(); // Prevent event bubbling
                    closeAllExcept("user");
                    setUserDropdownOpen((prev) => !prev);
                  }}
                  className="w-8 h-8 bg-primary text-white cursor-pointer rounded-full flex items-center justify-center font-semibold"
                >
                  {user.username?.charAt(0).toUpperCase()}
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
                      onClick={async (e) => {
                        e.stopPropagation();
                        await signOut(auth);
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 cursor-pointer text-gray-700 hover:bg-indigo-100 text-left"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <FiUser
                size={24}
                onClick={() => navigate("/login")}
                className="text-primary cursor-pointer hover:scale-110 transition"
              />
            )}

            {/* Mobile menu */}
            <div className="md:hidden">
              <FiMenu
                size={24}
                className="text-primary cursor-pointer hover:scale-110 transition"
                onClick={() => setSidebarOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebars */}
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

{/* ✅ CATEGORY SIDEBAR */}
{categorySidebarOpen && (
  <div
    className="fixed inset-0 bg-black/40 z-[9999] flex"
    onClick={(e) => {
      if (e.target === e.currentTarget) setCategorySidebarOpen(false);
    }}
  >
    <div
      className={`bg-white h-[100vh] w-[50%] shadow-lg p-6 relative transform transition-transform duration-300 ${
        categorySidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <button
        className="absolute top-4 right-4 text-gray-600"
        onClick={() => setCategorySidebarOpen(false)}
      >
        ✕
      </button>

      <div className="flex flex-col space-y-4 mt-10">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Categories
        </h2>
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

        <button
          onClick={() => {
            setCategorySidebarOpen(false);
            setSidebarOpen(true);
          }}
          className="text-gray-500 text-sm text-left mt-6"
        >
          ← Back
        </button>
      </div>
    </div>
  </div>
)}

      {cartOpen && <Addtocart isOpen onClose={() => setCartOpen(false)} />}
      {wishlistOpen && <Wishlist isOpen onClose={() => setWishlistOpen(false)} />}

      {loginOpen && (
        <Login
          onClose={() => setLoginOpen(false)}
          openRegister={() => {
            setLoginOpen(false);
            setRegisterOpen(true);
          }}
        />
      )}
      {registerOpen && (
        <Register
          onClose={() => setRegisterOpen(false)}
          openLogin={() => {
            setRegisterOpen(false);
            setLoginOpen(true);
          }}
          setUser={setUser}
        />
      )}
    </nav>
  );
}

export default Navbar;
