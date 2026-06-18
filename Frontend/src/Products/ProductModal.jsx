import { useEffect, useMemo, useState } from "react";
import {
  FaTimes,
  FaHeart,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaShoppingCart,
} from "react-icons/fa";
import api from "../api";
import { toast } from "react-hot-toast"
import { useNavigate, useLocation } from "react-router-dom";

const ProductModal = ({ product, onClose }) => {


  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // selection states
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // favourite / wishlist states
  const [isFavourited, setIsFavourited] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const resolveImage = (img) => {
    if (Array.isArray(img) && img.length > 0) return img.find(Boolean) || null;
    if (typeof img === "string" && img.trim() !== "") return img;
    return null;
  };

  const resolveColorImage = (colors) => {
    if (!colors) return null;
    const entries = Array.isArray(colors) ? colors : Object.values(colors);
    for (const color of entries) {
      const image = resolveImage(color?.images) || resolveImage(color?.image);
      if (image) return image;
    }
    return null;
  };

  const getProductImage = (prod) =>
    resolveImage(prod?.images) ||
    resolveImage(prod?.image) ||
    resolveColorImage(prod?.colors) ||
    "/placeholder.jpg";

  // Map specific bangle sizes to centimeter equivalents
  const sizeCmMap = {
    "2.2": "5.4",
    "2.4": "5.7",
    "2.6": "6.0",
    "2.8": "6.3",
    "2.10": "6.6",
    "2.12": "7.0",
  };

  const getSizeLabel = (sz) => {
    if (sz === undefined || sz === null) return "";
    const s = String(sz).trim();
    const candidates = [s];
    const parts = s.split(".");
    if (parts.length === 2 && parts[1].length === 1) {
      candidates.push(`${parts[0]}.${parts[1]}0`);
    }
    for (const k of candidates) {
      if (sizeCmMap[k]) return `${k} (${sizeCmMap[k]} cm)`;
    }
    return s;
  };

  const parseSizeValue = (s) => {
    const str = String(s ?? "").trim();
    if (!str) return 0;
    const parts = str.split(".");
    const major = Number(parts[0]) || 0;
    const minor = parts[1] ? Number(parts[1]) : 0;
    return major * 100 + minor;
  };

  const fullStars = Math.floor(product?.rating || 0);
  const hasHalfStar = (product?.rating || 0) % 1 >= 0.5;

  useEffect(() => {
    const img = getProductImage(product);
    setSelectedImage(img);
  }, [product]);



  // ── Wishlist helpers ──────────────────────────────────────────────────────
  const getLocalUserId = () => {
    try {
      const str = localStorage.getItem("user");
      if (!str) return null;
      const parsed = JSON.parse(str);
      return (
        parsed.user_id ||
        parsed.id ||
        parsed.uid ||
        (parsed.user &&
          (parsed.user.user_id || parsed.user.id || parsed.user.uid)) ||
        null
      );
    } catch {
      return null;
    }
  };

  // Check whether this product is already in the user's wishlist on open
  useEffect(() => {
    const checkFavourited = async () => {
      const userId = getLocalUserId();
      if (!userId || !product?.id) return;
      try {
        const res = await api.get(`/wishlist/${userId}`);
        if (res.data.success) {
          const already = (res.data.data || []).some(
            (item) => String(item.product_id) === String(product.id)
          );
          setIsFavourited(already);
        }
      } catch {
        // silently ignore — don't break the modal
      }
    };
    checkFavourited();
  }, [product?.id]);

  // Toggle wishlist: add if not favourited, remove if already favourited
  const handleWishlist = async () => {
    if (wishlistLoading) return;
    const userId = getLocalUserId();

    if (!userId) {
      toast.error("Please login to add to wishlist");
      navigate("/login", { state: { from: location?.pathname || "/" } });
      return;
    }

    setWishlistLoading(true);
    try {
      if (isFavourited) {
        // Find the wishlist item id for this product and remove it
        const listRes = await api.get(`/wishlist/${userId}`);
        if (listRes.data.success) {
          const item = (listRes.data.data || []).find(
            (i) => String(i.product_id) === String(product.id)
          );
          if (item) {
            const delRes = await api.delete(`/wishlist/${item.id}`);
            if (delRes.data.success) {
              setIsFavourited(false);
              toast.success(`${product.name} removed from wishlist`);
              window.dispatchEvent(new Event("wishlistUpdated"));
            } else {
              toast.error("Failed to remove from wishlist");
            }
          }
        }
      } else {
        const payload = {
          user_id: userId,
          product_id: product.id,
          product_name: product.name,
          mrp: product.mrp || "",
          sellingprice: product.sellingprice || "",
          image: selectedImage || getProductImage(product),
        };
        const res = await api.post("/wishlist", payload);
        if (res.data.success) {
          setIsFavourited(true);
          toast.success(`${product.name} added to wishlist`);
          window.dispatchEvent(new Event("wishlistUpdated"));
        } else {
          toast.error(res.data.message || "Failed to add to wishlist");
        }
      }
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.message === "Product already in wishlist"
      ) {
        setIsFavourited(true);
        toast.info(`${product.name} is already in your wishlist`);
      } else {
        console.error("Wishlist error:", error);
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setWishlistLoading(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const isBangleSingleColor = useMemo(() => {
    // DB stores "Bangles" (plural) — match both "bangle" and "bangles"
    const cat = (product?.category || "").toLowerCase();
    const count = (product?.count || "").toLowerCase();
    return cat.includes("bangle") && count === "singlecolor";
  }, [product]);

  const allSizes = useMemo(() => {
    if (!product?.colors) return [];
    const arr = [...new Set(product.colors.flatMap((c) => c.size || []))];
    arr.sort((a, b) => parseSizeValue(a) - parseSizeValue(b));
    return arr;
  }, [product]);

  useEffect(() => {
    if (!selectedColor) return;
    const colorObj = product.colors?.find(
      (c) =>
        String(c.color).toLowerCase() === String(selectedColor).toLowerCase()
    );
    if (!colorObj) return;
    const img =
      resolveImage(colorObj?.images) ||
      resolveImage(colorObj?.image) ||
      getProductImage(product);
    setSelectedImage(img);
  }, [selectedColor, product]);

  const getStockFor = (colorName, sizeVal) => {
    if (!product?.colors) return 0;
    const colorObj = product.colors.find(
      (c) => String(c.color).toLowerCase() === String(colorName).toLowerCase()
    );
    if (!colorObj) return 0;
    const stockMap = colorObj.stock || {};
    const raw = stockMap?.[sizeVal] ?? stockMap?.[String(sizeVal)] ?? 0;
    const n = Number(raw);
    return Number.isNaN(n) ? 0 : n;
  };

  // Helper for color/size availability
  const colorAvailableForSize = (colorObj, sizeVal) => {
    if (!colorObj || !sizeVal) return true;
    return (colorObj.size || []).includes(sizeVal);
  };

  // Calculate max stock for current selection
  const maxStock = (() => {
    if (isBangleSingleColor && selectedColor && selectedSize) {
      return getStockFor(selectedColor, selectedSize);
    }
    return product?.stock || 0;
  })();

  // Reset quantity to 1 when size or color changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedSize, selectedColor]);


  // Inside your component:
  useEffect(() => {
    if (product?.colors && product.colors.length > 0) {
      if (!selectedSize && allSizes.length > 0) {
        setSelectedSize(allSizes[0]);
      }
      if (!selectedColor) {
        setSelectedColor(product.colors[0].color);
      }
    }
  }, [product, allSizes, selectedSize, selectedColor]);

  // --- Buy Now ---
  const handleBuyNow = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      toast.error("Please login to add to cart");
      navigate("/login");
      return;
    }

    if (maxStock <= 0) {
      toast.error("Product is out of stock.");
      setIsProcessing(false);
      return;
    }
    if (quantity > maxStock) {
      toast.error(`Only ${maxStock} item(s) available.`);
      setIsProcessing(false);
      return;
    }
    if (isBangleSingleColor) {
      if (!selectedSize) {
        toast.error("Please select a size.");
        setIsProcessing(false);
        return;
      }
      if (!selectedColor) {
        toast.error("Please select a color.");
        setIsProcessing(false);
        return;
      }
      const stock = getStockFor(selectedColor, selectedSize);
      if (stock <= 0) {
        toast.error("Selected size/color is out of stock.");
        setIsProcessing(false);
        return;
      }
      if (quantity > stock) {
        toast.error(`Only ${stock} item(s) available for selected size/color.`);
        setIsProcessing(false);
        return;
      }
    }

    // Only pass product details to checkout, do NOT create order here!
    const orderItem = {
      productId: product.id || product.productId || null,
      name: product.name,
      category: product.category || "",
      subcategory: product.subcategory || "",
      mrp: product.mrp ?? null,
      sellingprice: product.sellingprice ?? 0,
      quantity,
      size: selectedSize || null,
      color: selectedColor || null,
      image: selectedImage || getProductImage(product),
    };

    try {
      navigate("/checkout", { state: { order: orderItem } });
      onClose?.();
    } catch (err) {
      console.error("Navigation failed:", err);
      toast.error("Something went wrong, try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Add to Cart ---
  const handleAddToCart = async () => {
    if (loading) return;
    setLoading(true);

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      toast.error("Please login to add to cart");
      try {
        setTimeout(() => navigate("/login", { state: { from: location?.pathname || "/" } }), 200);
      } catch {
        window.location.href = "/login";
      }
      setLoading(false);
      return;
    }

    if (maxStock <= 0) {
      toast.error("Product is out of stock.");
      setLoading(false);
      return;
    }
    if (quantity > maxStock) {
      toast.error(`Only ${maxStock} item(s) available.`);
      setLoading(false);
      return;
    }
    if (isBangleSingleColor) {
      if (!selectedSize) {
        toast.error("Please select a size.");
        setLoading(false);
        return;
      }
      if (!selectedColor) {
        toast.error("Please select a color.");
        setLoading(false);
        return;
      }
      const stock = getStockFor(selectedColor, selectedSize);
      if (stock <= 0) {
        toast.error("Selected size/color is out of stock.");
        setLoading(false);
        return;
      }
      if (quantity > stock) {
        toast.error(`Only ${stock} item(s) available for selected size/color.`);
        setLoading(false);
        return;
      }
    }

    try {
      const userId = user?.user_id || user?.id || user?.uid;
      const payload = {
        user_id: userId,
        product_id: product.id || product.productId || product.product_id,
        product_name: product.name,
        category: product.category,
        subcategory: product.subcategory,
        image: selectedImage || getProductImage(product),
        mrp: product.mrp ?? null,
        sellingprice: product.sellingprice ?? null,
        quantity,
        size: selectedSize || null,
        color: selectedColor || null,
      };
      await api.post("/cart", payload);
      window.dispatchEvent(new Event("cartUpdated"));
      toast.success("Added to cart");

      if (onClose) onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add cart");
    } finally {
      setLoading(false);
    }
  };

  // Quantity handlers
  const handleDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleIncrease = () => {
    if (quantity < maxStock) {
      setQuantity(quantity + 1);
    } else {
      toast.error(`Only ${maxStock} item(s) available.`);
    }
  };

  const getFirstAvailableColorForSize = (sizeVal) => {
    if (!product?.colors) return null;
    for (let c of product.colors) {
      if (colorAvailableForSize(c, sizeVal)) return c.color;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-3">
      <div className="bg-white w-full sm:w-11/12 md:w-4/5 lg:w-3/5 rounded-3xl shadow-2xl overflow-hidden relative animate-fadeIn max-h-[95vh] flex flex-col">
        <button
          className="absolute top-3 right-3 bg-white p-2 rounded-full text-primary hover:text-red-500 transition-colors cursor-pointer z-10"
          onClick={onClose}
        >
          <FaTimes size={18} />
        </button>

        {/* Layout */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden ">
          {/* Image Section */}
          <div className="relative w-full md:w-1/2 flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full h-[340px] sm:h-[400px] md:h-[420px] lg:h-[440px] flex items-center justify-center bg-gray-100 rounded-2xl overflow-hidden">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-contain"
                style={{ maxHeight: "100%", maxWidth: "100%" }}
              />
            </div>
            {/* Favourite Button */}
            <div className="absolute top-6 left-6 opacity-100 transition-opacity duration-300 group-hover:opacity-100">
              <button
                onClick={handleWishlist}
                disabled={wishlistLoading}
                title={isFavourited ? "Remove from wishlist" : "Add to wishlist"}
                className={`bg-white p-2 rounded-full shadow hover:scale-110 transition-all cursor-pointer ${
                  wishlistLoading ? "opacity-50 cursor-not-allowed" : ""
                } ${isFavourited ? "text-red-500" : "text-primary hover:text-red-500"}`}
              >
                <FaHeart />
              </button>
            </div>
          </div>
          {/* Details Section */}
          <div className="w-full md:w-1/2 p-5 md:p-8 flex flex-col justify-between overflow-y-auto">
            <div className=" text-gray-800 mb-3 font-semibold text-sm sm:text-base">
              Sri Saravana Shoppings
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-primary mb-1">
                {product.name}
              </h2>
              <p className="text-sm text-gray-500 mb-3">
                {product.category} • {product.subcategory}
              </p>

              {/* Price */}
              <div className="flex items-center gap-2 mb-3">
                {product.mrp && product.mrp !== product.sellingprice && (
                  <span className="text-gray-400 line-through text-sm">
                    ₹{product.mrp}
                  </span>
                )}
                <span className="text-primary font-bold text-lg sm:text-xl">
                  ₹{Math.floor(product.sellingprice).toFixed(2)}
                </span>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-3 mb-4">
                <span className="font-medium text-gray-700 text-sm sm:text-base">
                  Quantity:
                </span>
                <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                  <button
                    onClick={handleDecrease}
                    className="px-3 py-1 text-lg text-gray-700 hover:bg-gray-200 transition-all cursor-pointer"
                    disabled={loading || quantity <= 1 || maxStock <= 0}
                  >
                    -
                  </button>
                  <span className="px-4 font-semibold text-gray-800 text-sm sm:text-base">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrease}
                    className="px-3 py-1 text-lg text-gray-700 hover:bg-gray-200 transition-all cursor-pointer"
                    disabled={loading || quantity >= maxStock || maxStock <= 0}
                  >
                    +
                  </button>
                </div>
                {/* show available stock badge for selected size/color */}
                {maxStock <= 0 && (
                  <span className="ml-3 text-sm text-red-500">Out of stock</span>
                )}
                {maxStock > 0 && (
                  <span className="ml-3 text-sm text-gray-500">
                    Stock: {maxStock}
                  </span>
                )}
              </div>

              {/* If product.colors exists: show sizes & colors */}
              {product.category?.toLowerCase() !== "saree" && product.colors && product.colors.length > 0 && (
                <>
                  {/* Size selector - show merged sizes */}
                  <div className="mt-3">
                    <p className="text-gray-500 font-medium mb-1">Size</p>
                    <div className="flex flex-wrap gap-2">
                      {allSizes.map((sz) => {
                        const isSelected = String(selectedSize) === String(sz);
                        return (
                          <button
                            key={sz}
                            onClick={() => {
                              const newSize = selectedSize === sz ? null : sz;
                              setSelectedSize(newSize);

                              // Auto-switch color if current color is not available
                              if (newSize) {
                                const chosenColorObj = product.colors?.find(
                                  (c) => String(c.color).toLowerCase() === String(selectedColor)?.toLowerCase()
                                );
                                if (!chosenColorObj || !colorAvailableForSize(chosenColorObj, newSize)) {
                                  const firstAvailable = getFirstAvailableColorForSize(newSize);
                                  setSelectedColor(firstAvailable);
                                }
                              }
                            }}

                            className={`px-3 py-1 border rounded-full text-sm cursor-pointer ${isSelected
                              ? "bg-gray-800 text-white border-gray-800"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                              }`}
                            disabled={loading}
                          >
                            {getSizeLabel(sz)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Colours */}
                  <div className="mt-3 mb-3">
                    <p className="text-gray-500 font-medium mb-1">Colour</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      {product.colors.map((c, idx) => {
                        const isSelected = selectedColor === c.color;
                        const available = colorAvailableForSize(c, selectedSize);
                        const thumb = resolveImage(c?.images) || resolveImage(c?.image);
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (!available) {
                                toast.info(
                                  "Selected color not available for chosen size."
                                );
                                return;
                              }
                              setSelectedColor(c.color);
                            }}
                            title={`${c.color}${selectedSize
                              ? ` — stock: ${getStockFor(c.color, selectedSize)}`
                              : ""
                              }`}
                            className={`flex items-center justify-center w-12 h-12 rounded-full border-2 overflow-hidden transition-transform ${isSelected ? "scale-110 border-gray-800 p-0.5" : "border-gray-300 "
                              } ${!available ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:scale-105"
                              }`}
                            style={
                              thumb ? {} : { backgroundColor: String(c.color || "#ddd") }
                            }
                            disabled={loading}
                          >
                            <div className={`w-full h-full rounded-full overflow-hidden`}>
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={c.color}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="sr-only">{c.color}</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center mb-3 gap-1">
                {[...Array(5)].map((_, idx) => {
                  if (idx < fullStars) {
                    return (
                      <FaStar
                        key={idx}
                        className="text-yellow-400 h-4 w-4 sm:h-5 sm:w-5 "
                      />
                    );
                  } else if (idx === fullStars && hasHalfStar) {
                    return (
                      <FaStarHalfAlt
                        key={idx}
                        className="text-yellow-400 h-4 w-4 sm:h-5 sm:w-5"
                      />
                    );
                  } else {
                    return (
                      <FaRegStar
                        key={idx}
                        className="text-gray-300 h-4 w-4 sm:h-5 sm:w-5"
                      />
                    );
                  }
                })}
                <span className="ml-2 text-gray-600 text-sm">
                  ({product.rating ?? 0})
                </span>
              </div>

              {/* Description & notes (conditional) */}
              {!(
                (product.category?.toLowerCase() === "bangle" &&
                  product.count?.toLowerCase() === "singlecolor") ||
                product.category?.toLowerCase() === "jewelset"
              ) && (
                  <>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                      <strong className="text-primary">Description: </strong>
                      {product.description || "No description available."}
                    </p>

                    {product.notes && (
                      <p className="text-gray-500 text-sm">
                        <strong className="text-primary">Notes:</strong> {product.notes}
                      </p>
                    )}
                  </>
                )}

              {product.list_of_items && (
                <div className="text-gray-500 text-sm mb-3">
                  <strong className="block mb-1">List Of Items</strong>
                  <ul className="list-disc list-inside space-y-1">
                    {Array.isArray(product.list_of_items)
                      ? product.list_of_items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))
                      : product.list_of_items
                        .split(",")
                        .map((item, idx) => <li key={idx}>{item.trim()}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                className={`flex-1 ${loading || maxStock <= 0 ? "opacity-60 cursor-not-allowed" : ""} bg-primary hover:bg-purple-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer text-sm sm:text-base`}
                disabled={loading || maxStock <= 0}
              >
                {loading ? (
                  <span className="animate-spin mr-2 h-5 w-5 border-t-2 border-white border-solid rounded-full"></span>
                ) : (
                  <FaShoppingCart />
                )}
                {loading ? "Adding..." : "Add to Cart"}
              </button>
              <button
                disabled={isProcessing || maxStock <= 0}
                onClick={handleBuyNow}
                className={`flex-1 ${isProcessing || maxStock <= 0 ? "opacity-60 cursor-not-allowed" : ""} bg-white text-primary border border-primary font-medium py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer text-sm sm:text-base`}
              >
                {isProcessing ? "Processing..." : "Buy Now"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✨ Animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProductModal;