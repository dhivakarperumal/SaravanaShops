import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { FaStar, FaHeart } from "react-icons/fa";
import api from "../api";
import { FiMinus, FiPlus, FiShoppingCart } from "react-icons/fi";
import { toast } from "react-hot-toast"
import Head from "../Components/Head";
import { IoIosArrowForward } from "react-icons/io";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import ProductCard from "../Products/ProductCard";
import ProductModal from "../Products/ProductModal";


const ProductDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [, setFilteredColors] = useState([]);
  const [stockForSelection, setStockForSelection] = useState(0);

  const [zoomed, setZoomed] = useState(false);
  const [backgroundPosition, setBackgroundPosition] = useState("50% 50%");
  const zoomLevel = 2.5;

  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  const [showReviews, setShowReviews] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const swiperRef = useRef(null);

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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setUserHasReviewed(false);

        const res = await api.get(`/products/${id}`);
        const data = res.data.product;

        setProduct(data);

        const user = JSON.parse(localStorage.getItem("user"));

        if (user && data.reviews) {
          const alreadyReviewed = data.reviews.some(
            (r) => r.userId === user.id
          );
          setUserHasReviewed(alreadyReviewed);
        }

        fetchRelatedProducts(data.category, data.id);

      } catch (error) {
        console.error(error);
      }
    };

    fetchProduct();
  }, [id]);

  // Initialise selectedImage whenever the product (or its images) changes
  useEffect(() => {
    if (!product) return;
    setSelectedImage(getProductImage(product));
  }, [product]);

  const fetchRelatedProducts = async (category, currentId) => {
    try {
      const res = await api.get(
        `/products/related/${category}/${currentId}`
      );

      setRelatedProducts(res.data.products || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const resolveProductImages = (prod) => {
    if (!prod) return ["/placeholder.jpg"];
    if (Array.isArray(prod.images) && prod.images.length > 0) return prod.images;
    if (Array.isArray(prod.image) && prod.image.length > 0) return prod.image;
    if (typeof prod.image === "string" && prod.image.trim()) return [prod.image];
    if (prod.colors) {
      const entries = Array.isArray(prod.colors) ? prod.colors : Object.values(prod.colors);
      const colorImages = entries
        .map((c) => resolveImage(c?.images) || resolveImage(c?.image))
        .filter(Boolean);
      if (colorImages.length > 0) return colorImages;
    }
    return ["/placeholder.jpg"];
  };

  const images = resolveProductImages(product);

  const handleMouseMove = (e) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setBackgroundPosition(`${x}% ${y}%`);
  };

  const isBangleSingleColor =
    // DB stores "Bangles" (plural) — match both "bangle" and "bangles"
    product?.category?.toLowerCase().includes("bangle") &&
    product?.count?.toLowerCase() === "singlecolor";

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
    // Try variants: exact, and padded minor (e.g., 2.1 -> 2.10)
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

  const allSizes = React.useMemo(() => {
    if (!product?.colors) return [];
    const arr = [...new Set(product.colors.flatMap((c) => c.size || []))];
    arr.sort((a, b) => parseSizeValue(a) - parseSizeValue(b));
    return arr;
  }, [product]);

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

  const validateSelection = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      toast.error("Please login to continue");
      // navigate and preserve current location so user can return after login
      try {
        // small delay so toast is visible before navigation
        setTimeout(() => navigate("/login", { state: { from: location?.pathname || "/" } }), 200);
      } catch {
        // fallback to full redirect if react-router navigate doesn't work
        window.location.href = "/login";
      }
      return false;
    }
    if (maxStock <= 0) {
      toast.error("Product is out of stock.");
      return false;
    }
    if (quantity > maxStock) {
      toast.error(`Only ${maxStock} item(s) available.`);
      return false;
    }
    if (isBangleSingleColor) {
      if (!selectedSize) {
        toast.error("Please select a size.");
        return false;
      }
      if (!selectedColor) {
        toast.error("Please select a color.");
        return false;
      }
      const stock = getStockFor(selectedColor, selectedSize);
      if (stock <= 0) {
        toast.error("Selected size/color is out of stock.");
        return false;
      }
      if (quantity > stock) {
        toast.error(`Only ${stock} item(s) available for selected size/color.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmitReview = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      toast.error("Please login to write a review.");
      return;
    }

    if (rating === 0 || !reviewText.trim()) {
      toast.error("Please provide a rating and review.");
      return;
    }

    try {
      const userId = user?.user_id || user?.id;
      await api.post("/reviews/add", {
        product_id: product.id,
        user_id: userId,
        user_name: user.username || user.name,
        rating,
        review: reviewText.trim(),
      });

      const res = await api.get(`/products/${id}`);
      setProduct(res.data.product);

      toast.success("Review added successfully!");
      setReviewText("");
      setRating(0);
      setShowReviews(false);
      setUserHasReviewed(true);
      const refresh = await api.get(`/products/${id}`);
      setProduct(refresh.data.product);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit review.");
    }
  };


  return (
    <>
      {!product ? (
        <div className="flex justify-center items-center h-screen text-gray-500">
          Loading product details...
        </div>
      ) : (
        <>
          <Head
            title={product.name}
            subtitle={
              <>
                <Link className="text-lg font-semibold text-white" to="/">
                  Home
                </Link>
                <IoIosArrowForward className="text-lg font-bold text-white mx-1" />
                <Link className="text-lg font-semibold text-white line-clamp-1">
                  {product.name}
                </Link>
              </>
            }
          />

          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="flex flex-col md:flex-row gap-8">
              {/* LEFT SIDE - Image Gallery */}
              <div className="w-full md:w-1/2 flex flex-col md:flex-row-reverse gap-3 md:sticky md:top-27 self-start">
                {/* MAIN IMAGE */}
                <div className="relative flex-1">
                  <img
                    src={selectedImage || images[0]}
                    alt={product.name}
                    className="w-full max-h-[600px] object-contain rounded-2xl shadow-lg transition-all duration-300 cursor-zoom-in"
                    onMouseEnter={() => setZoomed(true)}
                    onMouseLeave={() => setZoomed(false)}
                    onMouseMove={handleMouseMove}
                  />

                  <button
                    className="absolute top-4 right-4 bg-white text-primary hover:text-red-500 p-2 rounded-full shadow-md hover:scale-110 transition cursor-pointer"
                    onClick={async () => {
                      const user = JSON.parse(localStorage.getItem("user"));
                      const userId = user?.user_id || user?.id || user?.uid;

                      if (!userId) {
                        toast.error("Please login to add to wishlist");
                        return;
                      }

                      try {
                        const res = await api.post("/wishlist", {
                          user_id: userId,
                          product_id: product.id,
                          product_name: product.name,
                          mrp: product.mrp || "",
                          sellingprice: product.sellingprice || "",
                          image:
                            selectedImage || getProductImage(product),
                        });

                        if (res.data.success) {
                          toast.success(`${product.name} added to wishlist`);
                          window.dispatchEvent(new Event("wishlistUpdated"));
                        } else {
                          toast.error(res.data.message || "Failed to add to wishlist");
                        }
                      } catch (error) {
                        if (error.response?.status === 400 && error.response?.data?.message === 'Product already in wishlist') {
                          toast.info(`${product.name} is already in your wishlist`);
                        } else {
                          console.error("Error adding to wishlist:", error);
                          toast.error("Failed to add to wishlist");
                        }
                      }
                    }}
                  >
                    <FaHeart className="text-xl" />
                  </button>

                  {zoomed && (
                    <div
                      className="absolute hidden md:block top-0 left-full ml-4 w-[450px] h-[400px] border rounded-2xl overflow-hidden shadow-lg bg-white z-[999]"
                      style={{
                        // always fall back to images[0] so zoom is never blank
                        backgroundImage: `url('${selectedImage || images[0]}')`,
                        backgroundRepeat: "no-repeat",
                        backgroundSize: `${zoomLevel * 100}%`,
                        backgroundPosition: backgroundPosition,
                      }}
                    ></div>
                  )}
                </div>

                {/* THUMBNAILS */}
                <div className="flex md:flex-col md:w-24 justify-center gap-3 mt-4 md:mt-0">
                  {images.slice(0, 5).map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`product-${index}`}
                      onClick={() => setSelectedImage(img)}
                      className={`w-16 h-16 md:w-20 md:h-20 object-cover  rounded-md border cursor-pointer transition-transform duration-200 ${selectedImage === img
                        ? "border-2 border-primary scale-105"
                        : "border-gray-300 hover:scale-105"
                        }`}
                    />
                  ))}
                </div>
              </div>

              {/* RIGHT SIDE - Product Details */}
              <div className="md:w-1/2 space-y-5 scr">
                <h1 className="text-3xl font-semibold text-primary">
                  {product.name}
                </h1>

                {product.category && (
                  <p className="text-gray-500">{product.category}</p>
                )}

                {/* Price */}
                <div className="flex items-center gap-3">
                  {product.mrp && (
                    <span className="text-gray-400 text-md">
                      MRP <span className="line-through">₹{product.mrp}</span>
                    </span>
                  )}
                  {product.sellingprice && (
                    <span className="text-2xl font-bold text-gray-800">
                      ₹{Math.floor(product.sellingprice).toFixed(2)}
                    </span>
                  )}
                  {product.mrp && product.sellingprice && (
                    <span className="text-sm text-white bg-primary px-3 py-1 rounded-full">
                      {Math.round(
                        ((product.mrp - product.sellingprice) / product.mrp) *
                        100
                      )}
                      % OFF
                    </span>
                  )}
                </div>

                {/* Sizes */}
                {product.category?.toLowerCase() !== "saree" && product.colors && product.colors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-gray-500 font-medium mb-1">Size</p>
                    <div className="flex flex-wrap gap-2">
                      {allSizes.map((sz) => (
                        <button
                          key={sz}
                          onClick={() => {
                            setSelectedSize(sz);

                            // ✅ Get all colors that have stock for this size
                            const availableColors = product.colors.filter((c) => {
                              const stockMap = c.stock || {};
                              const stock = stockMap?.[sz] ?? stockMap?.[String(sz)] ?? 0;
                              return Number(stock) > 0;
                            });

                            setFilteredColors(availableColors);

                            if (availableColors.length > 0) {
                              // Auto-select first available color
                              const firstColor = availableColors[0];
                              setSelectedColor(firstColor.color);

                              const stockMap = firstColor.stock || {};
                              const stock =
                                stockMap?.[sz] ?? stockMap?.[String(sz)] ?? 0;
                              setStockForSelection(stock);

                              // Update image
                              const img = resolveImage(firstColor?.images) || resolveImage(firstColor?.image);
                              if (img) setSelectedImage(img);
                            } else {
                              // No available color for this size
                              setSelectedColor(null);
                              setStockForSelection(0);
                            }
                          }}

                          className={`px-3 cursor-pointer py-1 border rounded-full text-sm ${selectedSize === sz
                            ? "bg-gray-800 text-white border-gray-800"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                            }`}
                        >
                          {getSizeLabel(sz)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colors */}
                {product.category?.toLowerCase() !== "saree" && product.colors && product.colors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-gray-500 font-medium mb-1">Color</p>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((c, idx) => {
                        const thumb = resolveImage(c?.images) || resolveImage(c?.image);
                        const sizeKey = selectedSize;
                        const stockMap = c.stock || {};
                        const stock = sizeKey
                          ? stockMap?.[sizeKey] ?? stockMap?.[String(sizeKey)] ?? 0
                          : 1;
                        const isDisabled = sizeKey && stock <= 0;
                        return (
                            key={idx}
                            onClick={() => {
                              if (!isDisabled) {
                                setSelectedColor(c.color);
                                setStockForSelection(stock);

                                if (thumb) {
                                  setSelectedImage(thumb);
                                }
                              }
                            }}
                            disabled={isDisabled}
                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition
    ${selectedColor === c.color
                                ? "border-primary ring-2 ring-primary"
                                : "border-gray-300"
                              }
    ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
  `}
                          >
                            <img
                              src={thumb}
                              alt={c.color}
                              className="w-full h-full object-cover"
                            />
                          </button>

                        );
                      })}
                    </div>
                    {selectedColor && stockForSelection > 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Stock:</strong> {stockForSelection} item(s) available
                      </p>
                    )}
                  </div>
                )}

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center">
                    {[...Array(5)].map((_, idx) => (
                      <FaStar
                        key={idx}
                        className={`h-5 w-5 ${idx < Math.round(product.rating)
                          ? "text-yellow-400"
                          : "text-gray-300"
                          }`}
                      />
                    ))}
                    <span className="ml-2 text-gray-600">({product.rating})</span>
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Description: </strong>
                    {product.description}
                  </p>
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

                {product.notes && (
                  <p className="text-sm text-gray-600">
                    <strong>Notes: </strong>
                    {product.notes}
                  </p>
                )}

                {/* Quantity Selector */}
                <div className="flex items-center gap-4 mt-4">
                  <p className="font-medium text-gray-700 text-sm sm:text-base">
                    Quantity
                  </p>
                  <div className="flex items-center bg-gray-100 rounded-full shadow-inner border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-all duration-300 cursor-pointer"
                    >
                      <FiMinus className="text-sm sm:text-base" />
                    </button>
                    <div className="px-6 py-2 bg-white text-gray-800 font-semibold text-sm sm:text-base flex items-center justify-center min-w-[48px] sm:min-w-[56px]">
                      {quantity}
                    </div>
                    <button
                      onClick={() => {
                        if (quantity < maxStock) {
                          setQuantity(quantity + 1);
                        } else {
                          toast.error(`Only ${maxStock} item(s) available.`);
                        }
                      }}
                      disabled={quantity >= maxStock || maxStock <= 0}
                      className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-all duration-300 cursor-pointer ${quantity >= maxStock || maxStock <= 0
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                        }`}
                    >
                      <FiPlus className="text-sm sm:text-base" />
                    </button>
                  </div>
                  {maxStock <= 0 && (
                    <span className="ml-2 text-red-500 text-sm">Out of stock</span>
                  )}
                  {maxStock > 0 && (
                    <span className="ml-2 text-gray-500 text-xs">
                      Stock available: {maxStock}
                    </span>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 w-full">
                  <button
                    className="flex items-center cursor-pointer justify-center gap-2 bg-primary hover:bg-purple-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 w-full sm:w-1/2 shadow-md hover:shadow-lg active:scale-95"
                    onClick={async () => {
                      if (!validateSelection()) return;

                      const user = JSON.parse(localStorage.getItem("user"));
                      const userId = user?.user_id || user?.id || user?.uid;

                      try {
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
                      } catch (err) {
                        console.error(err);
                        toast.error("Failed to add to cart");
                      }
                    }}
                    disabled={maxStock <= 0}
                  >
                    <FiShoppingCart className="text-lg" /> Add To Cart
                  </button>

                  {/* Buy Now */}
                  <button
                    className="flex-1 bg-white text-primary border border-primary font-medium py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer text-sm sm:text-base"
                    onClick={() => {
                      if (!validateSelection()) return;

                      const user = JSON.parse(localStorage.getItem("user"));
                      const userId = user?.user_id || user?.id;

                      const orderItem = {
                        productId: product.id || product.productId,
                        name: product.name,
                        productName: (product.colors && selectedColor
                          ? (product.colors.find(c => String(c.color).toLowerCase() === String(selectedColor).toLowerCase())?.productName) || ""
                          : ""),
                        category: product.category || "",
                        subcategory: product.subcategory || "",
                        mrp: product.mrp ?? null,
                        sellingprice: product.sellingprice ?? 0,
                        quantity,
                        size: selectedSize || null,
                        color: selectedColor || null,
                        image: selectedImage || getProductImage(product),
                        userId,
                        status: "pending",
                      };

                      toast.success("Proceeding to checkout...");
                      navigate("/checkout", { state: { order: orderItem } });
                    }}
                    disabled={maxStock <= 0}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Related products */}
          <div className="max-w-6xl mx-auto mt-5 px-6 py-12">
            <h2 className="relative text-2xl font-bold mb-6 text-left inline-block">
              Related Products
              <span className="absolute left-0 -bottom-2 w-20 h-1 bg-gradient-to-r from-primary to-pink-400 rounded-full"></span>
            </h2>

            {loadingRelated ? (
              <div className="flex justify-center items-center h-64 text-gray-500">
                Loading related products...
              </div>
            ) : relatedProducts.length === 0 ? (
              <div className="flex justify-center items-center h-64 text-gray-500">
                No related products found.
              </div>
            ) : (
              <Swiper
                modules={[Autoplay]}
                spaceBetween={20}
                slidesPerView={1}
                loop={true}
                speed={1000}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  768: { slidesPerView: 3 },
                  1024: { slidesPerView: 4 },
                }}
                onSwiper={(swiper) => (swiperRef.current = swiper)}
              >
                {relatedProducts.map((p) => (
                  <SwiperSlide key={p.id}>
                    <div
                      className="flex justify-center mb-10"
                      onMouseEnter={() => swiperRef.current?.autoplay?.stop()}
                      onMouseLeave={() => swiperRef.current?.autoplay?.start()}
                    >
                      <ProductCard
                        product={p}
                        onOpenModal={() => setSelectedProduct(p)}
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}

            {selectedProduct && (
              <ProductModal
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
              />
            )}
          </div>

          {/* Review Section */}
          {/* <div className="mt-2 mb-7 max-w-6xl mx-auto px-6 flex flex-col items-center text-center">
            <div className="w-full max-w-3xl border-t border-gray-300 pt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Add Reviews</h2>
                <button
                  onClick={() => setShowReviews((prev) => !prev)}
                  className="bg-primary hover:bg-purple-700 text-white px-5 py-2 rounded-lg shadow-md transition-all duration-300 cursor-pointer"
                >
                  {showReviews ? "Hide Reviews" : "Write Review"}
                </button>
              </div>

              {showReviews && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left shadow-sm transition-all duration-300">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">
                    Share your experience
                  </h3>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmitReview();
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rating
                      </label>
                      <div className="flex gap-1 text-yellow-400 text-xl">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar
                            key={star}
                            onClick={() => setRating(star)}
                            className={`cursor-pointer ${
                              star <= rating ? "text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Review
                      </label>
                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="4"
                        placeholder="Write your review here..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                      ></textarea>
                    </div>

                    {userHasReviewed && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        You’ve already submitted a review for this product.
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={userHasReviewed}
                      className={`px-6 py-2 rounded-lg transition cursor-pointer ${
                        userHasReviewed
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : "bg-primary text-white hover:bg-purple-700"
                      }`}
                    >
                      {userHasReviewed ? "Already Reviewed" : "Submit Review"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div> */}

          <div className="mt-3 mb-5 max-w-6xl mx-auto px-6 flex flex-col items-center text-center">
            {!userHasReviewed && (
              <div className="w-full max-w-3xl border-t border-gray-300 pt-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Add Reviews</h2>

                  <button
                    onClick={() => setShowReviews((prev) => !prev)}
                    className="bg-primary hover:bg-purple-700 text-white px-5 py-2 rounded-lg shadow-md transition-all duration-300 cursor-pointer"
                  >
                    {showReviews ? "Hide Review Form" : "Write Review"}
                  </button>
                </div>

                {/* ✅ Review Form */}
                {showReviews && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left shadow-sm transition-all duration-300">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                      Share your experience
                    </h3>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmitReview();
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rating
                        </label>
                        <div className="flex gap-1 text-yellow-400 text-xl">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              onClick={() => setRating(star)}
                              className={`cursor-pointer ${star <= rating ? "text-yellow-400" : "text-gray-300"
                                }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Review
                        </label>
                        <textarea
                          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                          rows="4"
                          placeholder="Write your review here..."
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2 rounded-lg transition cursor-pointer bg-primary text-white hover:bg-purple-700"
                      >
                        Submit Review
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* ✅ All Product Reviews from Multiple Users */}
            <div className="w-full mt-5">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-left">
                Customer Reviews
              </h3>

              {product?.reviews && product.reviews.length > 0 ? (
                <Swiper
                  modules={[Autoplay]}
                  spaceBetween={20}
                  slidesPerView={1}
                  loop={true}
                  autoplay={{ delay: 3500, disableOnInteraction: false }}
                  speed={800}
                  breakpoints={{
                    640: { slidesPerView: 1 },
                    768: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 },
                  }}
                >
                  {product.reviews
                    .sort(
                      (a, b) =>
                        (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
                    )
                    .map((rev, idx) => (
                      <SwiperSlide key={idx}>
                        <div className="bg-white border border-gray-200 rounded-xl shadow-md p-5 text-left h-full flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                          <div>
                            <div className="flex items-center mb-3">
                              {[...Array(5)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={`text-sm ${i < rev.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                    }`}
                                />
                              ))}
                            </div>

                            <p className="text-gray-700 text-sm leading-relaxed mb-3">
                              {rev.review}
                            </p>
                          </div>

                          <div className="mt-auto border-t border-gray-100 pt-3">
                            <p className="text-sm font-semibold text-gray-800">
                              {rev.userName || "Anonymous"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {rev.createdAt?.toDate
                                ? new Date(
                                  rev.createdAt.toDate()
                                ).toLocaleDateString()
                                : ""}
                            </p>
                          </div>
                        </div>
                      </SwiperSlide>
                    ))}
                </Swiper>
              ) : (
                <p className="text-gray-500 mt-4 text-center">
                  No reviews yet. Be the first to review this product!
                </p>
              )}
            </div>
          </div>
        </>
      )
      }
    </>
  );
};

export default ProductDetails;