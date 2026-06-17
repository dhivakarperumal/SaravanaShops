import React, { useEffect, useState, useRef } from "react";
import { FaTimes, FaTrash, FaShoppingCart } from "react-icons/fa";
import api from "../api";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Addtocart = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemStocks, setItemStocks] = useState({});
  const sidebarRef = useRef(null);

  // Close sidebar when clicking outside
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

  const getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.user_id || user?.id || null;
    } catch {
      return null;
    }
  };

  // Fetch cart items when the sidebar is opened
  useEffect(() => {
    const fetchCart = async () => {
      const userId = getUserId();
      if (!userId) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/cart/${userId}`);
        setCartItems(res.data || []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load cart");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchCart();
    }
  }, [isOpen]);

  // Remove item
  const handleRemove = async (itemId) => {
    if (!user) return;
    try {
      await api.delete(`/cart/${itemId}`);
      // Remove from local state immediately
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.success("Item removed from cart");
    } catch (err) {
      console.error("Error removing item:", err);
      toast.error("Failed to remove item");
    }
  };

  // Get live stock for cart item
  const getStockForCartItem = async (item) => {
    try {
      const productId = item.product_id || item.productId;
      if (!productId) {
        console.warn("No product ID found for cart item", item);
        return 99; // Default high stock if no ID
      }
      const res = await api.get(`/products/${productId}`);
      return Number(res.data.product?.stock);
    } catch (error) {
      console.error(error);
      return 99; // Return high stock on error to prevent blocking purchases
    }
  };

  // Fetch stock for all cart items when cart changes
  useEffect(() => {
    const fetchStocks = async () => {
      const stocks = {};
      for (const item of cartItems) {
        stocks[item.id] = await getStockForCartItem(item);
      }
      setItemStocks(stocks);
    };
    if (cartItems.length > 0) fetchStocks();
  }, [cartItems]);

  // Update quantity with live stock check
  const handleQuantityChange = async (item, type) => {
    if (!user) return;
    const newQty = type === "increase" ? item.quantity + 1 : item.quantity - 1;
    if (newQty < 1) return;
    const currentStock = itemStocks[item.id] ?? item.stock ?? 99;
    if (newQty > currentStock && currentStock !== 99) {
      toast.error(`Only ${currentStock} item(s) available in stock.`);
      return;
    }
    try {
      await api.put(`/cart/${item.id}`, {
        quantity: newQty,
      });
      setCartItems((prev) =>
        prev.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: newQty } : cartItem
        )
      );
      toast.success("Quantity updated");
    } catch (err) {
      console.error("Error updating quantity:", err);
      toast.error("Failed to update quantity");
    }
  };

  const totalAmount = cartItems.reduce(
    (sum, item) =>
      sum + (parseFloat(item.sellingprice) || 0) * (item.quantity || 1),
    0
  );

  // Handle checkout click
  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  return (
    <>
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-[100vh] w-80 bg-white shadow-lg z-[100] transition-transform duration-300 overflow-y-auto`}
      >
        {/* Header */}
        <div className="relative flex justify-between items-center bg-primary rounded-tl-2xl p-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-white z-10">
            <FaShoppingCart /> Your Cart
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-red-500 transition-all z-10 cursor-pointer"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Cart items */}
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
            <p className="text-gray-500 text-center mt-10">Loading cart...</p>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-center mt-10">
              <FaShoppingCart size={50} className="text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">Your cart is empty.</p>
              <button
                onClick={() => {
                  navigate("/allproducts");
                  onClose();
                }}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-all font-medium"
              >
                Go to Shop
              </button>
            </div>
          ) : (
            cartItems.map((item) => {
              const totalPrice =
                (parseFloat(item.sellingprice) || 0) * (item.quantity || 1);
              const maxStock = itemStocks[item.id] || 0;

              return (
                <div
                  key={item.id}
                  className="relative flex items-center gap-3 p-3 rounded-lg shadow-md hover:shadow-secondary transition-all"
                >
                  <img
                    src={item.image || "/placeholder.jpg"}
                    alt={item.product_name || item.name}
                    className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between h-full">
                    <h3
                      className="text-sm font-semibold text-primary overflow-hidden text-ellipsis line-clamp-1"
                      title={item.product_name || item.name}
                    >
                      {item.product_name || "N/A"}
                    </h3>

                    <span className="text-gray-400 text-sm">
                      MRP{" "}
                      <span className="line-through">
                        ₹{Number(item.mrp).toFixed(2)}
                      </span>
                      <span className="text-black text-lg ml-3">
                        ₹{Number(item.sellingprice).toFixed(2)}
                      </span>
                    </span>
                    {item.size && (
                      <p className="text-xs text-gray-400 truncate whitespace-nowrap">
                        <strong> Size: </strong>
                        {item.size} | {item.color && `Color: ${item.color}`}
                      </p>
                    )}
                    <p className="text-gray-600 mt-1 text-sm">
                      ₹{Number(item.sellingprice).toFixed(2)} × {item.quantity} = ₹
                      {totalPrice.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleQuantityChange(item, "decrease")}
                        className="px-2 py-0.5 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item, "increase")}
                        className="px-2 py-0.5 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer"
                        disabled={item.quantity >= maxStock}
                      >
                        +
                      </button>
                      {maxStock > 0 && item.quantity >= maxStock && (
                        <span className="ml-2 text-xs text-red-500">
                          Max stock reached
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="absolute -top-2 -right-1 border text-primary border-primary bg-white hover:bg-white hover:text-red-500 p-1 rounded-full transition-all shadow-md cursor-pointer"
                  >
                    <FaTrash size={11} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-primary p-4 bg-white sticky bottom-0 shadow-t flex flex-col gap-3">
            <div className="flex justify-between font-semibold text-gray-800 text-lg">
              <span>Total:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              className={`w-full py-3 rounded-lg font-medium cursor-pointer transition-all bg-primary text-white hover:bg-purple-700`}
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Addtocart;
