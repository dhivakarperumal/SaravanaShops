import React, { useEffect, useState, useRef } from "react";
import { FaTimes, FaHeart, FaTrash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import api from "../api";

const Wishlist = ({ isOpen, onClose }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const sidebarRef = useRef(null);

  // 🔹 Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        isOpen
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // 🔹 Fetch Wishlist
  useEffect(() => {
    const fetchWishlist = async () => {
      let localUserId = null;
      try {
        const localUserStr = localStorage.getItem("user");
        if (localUserStr) {
          const parsed = JSON.parse(localUserStr);
          localUserId = parsed.user_id || parsed.id || parsed.uid || (parsed.user && (parsed.user.user_id || parsed.user.id || parsed.user.uid));
        }
      } catch (e) { }

      if (!localUserId) {
        setWishlist([]);
        setLoading(false);
        return;
      }

      setUser({ uid: localUserId });

      try {
        const res = await api.get(`/wishlist/${localUserId}`);
        if (res.data.success) {
          setWishlist(res.data.data);
        } else {
          setWishlist([]);
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        toast.error("Failed to load wishlist");
        setWishlist([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      setLoading(true);
      fetchWishlist();
    }
  }, [isOpen]);

  // 🔹 Remove item
  const handleRemove = async (itemId) => {
    if (!user) return;
    try {
      const res = await api.delete(`/wishlist/${itemId}`);
      if (res.data.success) {
        setWishlist(wishlist.filter(item => item.id !== itemId));
        toast.success("Item removed from wishlist");
      }
    } catch (err) {
      console.error("Error removing item:", err);
      toast.error("Failed to remove item");
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-[100vh] w-80 bg-white shadow-lg z-[100] transition-transform duration-300 overflow-y-auto`}
      >
        {/* Header */}
        <div className="relative flex justify-between items-center bg-primary rounded-tl-3xl p-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-white z-10">
            <FaHeart className="text-white" /> Wishlist
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-red-500 transition-all z-10 cursor-pointer"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Wishlist Items */}
        <div
          className="flex-1 p-4 space-y-4 overflow-y-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style>
            {`
              div::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>

          {loading ? (
            <p className="text-gray-500 text-center mt-10">Loading wishlist...</p>
          ) : wishlist.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-center mt-10">
              <FaHeart size={50} className="text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">Your wishlist is empty.</p>
              <Link
                to="/allproducts"
                onClick={onClose}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-all font-medium"
              >
                Go to Shop
              </Link>
            </div>
          ) : (
            wishlist.map((item) => (
              <div
                key={item.id}
                className="relative flex items-center gap-3 p-3 rounded-lg shadow-md hover:shadow-secondary transition-all"
              >
                {/* ✅ Close sidebar when clicking product image */}
                <Link to={`/allproducts/${item.product_id}`} onClick={onClose}>
                  <img
                    src={item.image || "/placeholder.jpg"}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                  />
                </Link>

                <div className="flex-1 flex flex-col justify-between h-full">
                  <h3
                    className="text-sm font-semibold text-primary overflow-hidden text-ellipsis line-clamp-1"
                    title={item.product_name}
                  >
                    {item.product_name}
                  </h3>

                  <span className="text-gray-400 text-sm">
                    MRP{" "}
                    <span className="line-through">₹{Number(item.mrp).toFixed(2)}</span>
                    <span className="text-black text-lg ml-3">
                      ₹{Number(item.sellingprice).toFixed(2)}
                    </span>
                  </span>
                </div>

                <button
                  onClick={() => handleRemove(item.id)}
                  className="absolute -top-2 -right-1 border text-primary border-primary bg-white hover:bg-white hover:text-red-500 p-1 rounded-full transition-all shadow-md cursor-pointer"
                >
                  <FaTrash size={11} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Wishlist;
