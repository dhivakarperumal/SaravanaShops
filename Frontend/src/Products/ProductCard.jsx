import React from "react";
import {
  FaPlus,
  FaHeart,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
} from "react-icons/fa";
import { Link } from "react-router-dom";

import { toast } from "react-hot-toast";
import api from "../api";

const ProductCard = ({ product, onOpenModal }) => {
  const fullStars = Math.floor(product.rating);
  const hasHalfStar = product.rating % 1 >= 0.5;

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

  const getProductImage = () =>
    resolveImage(product?.images) ||
    resolveImage(product?.image) ||
    resolveColorImage(product?.colors) ||
    "/placeholder.jpg";

  const handleWishlist = async () => {
    let localUserId = null;
    try {
      const localUserStr = localStorage.getItem("user");
      if (localUserStr) {
        const parsed = JSON.parse(localUserStr);
        localUserId = parsed.user_id || parsed.id || parsed.uid || (parsed.user && (parsed.user.user_id || parsed.user.id || parsed.user.uid));
      }
    } catch (e) { }

    if (!localUserId) {
      toast.error("Please login to add to wishlist");
      return;
    }

    try {
      const payload = {
        user_id: localUserId,
        product_id: product.id,
        product_name: product.name,
        mrp: product.mrp || "",
        sellingprice: product.sellingprice || "",
        image: getProductImage(),
      };

      const res = await api.post("/wishlist", payload);
      if (res.data.success) {
        toast.success(`${product.name} added to wishlist`);
        window.dispatchEvent(new Event("wishlistUpdated"));
      } else {
        toast.error(res.data.message || `Failed to add ${product.name} to wishlist`);
      }
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data.message === 'Product already in wishlist') {
        toast.info(`${product.name} is already in your wishlist`);
      } else {
        console.error("Error adding to wishlist:", error);
        toast.error(`Failed to add ${product.name} to wishlist`);
      }
    }
  };

  return (
    <div className="relative w-full h-[420px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
      {/* Image Section */}
      <div className="relative overflow-hidden">
        {product.offerBadge && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold w-10 h-10 flex items-center justify-center rounded-full z-10">
            {product.offerPercentage}%
          </span>
        )}
        <Link to={`/allproducts/${product.id}`}>
          <img
            src={
              resolveImage(product?.images) ||
              resolveImage(product?.image) ||
              resolveColorImage(product?.colors) ||
              "/placeholder.jpg"
            }
            alt={product.name}
           className="w-full h-72 object-contain bg-white transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        <div className="absolute top-2 right-2 opacity-100 md:opacity-0 lg:opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button  onClick={handleWishlist} className="bg-white p-2 rounded-full shadow text-primary hover:text-red-500 hover:scale-110 transition-all cursor-pointer">
            <FaHeart />
          </button>
        </div>

        {/* ➕ Plus Button */}
        <div className="absolute bottom-2 right-2 opacity-100 md:opacity-0 lg:opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            className="bg-white p-2 rounded-full shadow text-primary hover:bg-primary hover:text-white cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal?.(product);
            }}
          >
            <FaPlus />
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 text-center space-y-2">
        {/* <h3 className="text-primary font-semibold text-md tracking-wide uppercase">
          {product.name}
        </h3> */}
        <Link to={`/allproducts/${product.id}`}><h3
          className="text-md font-semibold text-primary overflow-hidden text-ellipsis line-clamp-1"
          title={product.name}
        >
          {product.name}
        </h3></Link>

        <div className="flex justify-center items-center gap-2">
          {product.mrp && product.mrp !== product.sellingprice && (
            <span className="text-gray-400 line-through text-sm">
              MRP ₹{product.mrp}
            </span>
          )}
         <span className="text-black font-semibold text-lg">
             ₹{Math.floor(product.sellingprice).toFixed(2)}
         </span>
        </div>

        {/* ⭐ Rating */}
        <div className="flex justify-center items-center gap-1">
          {[...Array(5)].map((_, idx) => {
            if (idx < fullStars) {
              return <FaStar key={idx} className="text-yellow-400 h-4 w-4" />;
            } else if (idx === fullStars && hasHalfStar) {
              return <FaStarHalfAlt key={idx} className="text-yellow-400 h-4 w-4" />;
            } else {
              return <FaRegStar key={idx} className="text-gray-300 h-4 w-4" />;
            }
          })}
          <span className="text-gray-500 text-sm ml-1">({product.rating})</span>
        </div>

      </div>
    </div>
  );
};

export default ProductCard;
