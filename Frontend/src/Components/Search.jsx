import { useEffect, useState } from "react";
import { IoIosSearch } from "react-icons/io";
import api from "../api";
import { useNavigate } from "react-router-dom";

const Search = ({ isOpen, onOpen, onClose }) => {
  // const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");

        const products = res.data?.data || res.data || [];

        setAllProducts(products);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSuggestions([]);
      return;
    }

    const safeSearch = (searchTerm || "").toLowerCase();
    const filtered = allProducts.filter((p) => {
      const name = (
        p?.productname ||
        p?.name ||
        ""
      ).toLowerCase();

      const description = (
        p?.description ||
        ""
      ).toLowerCase();
      const category = (p?.category || "").toLowerCase();
      const subcategory = String(p?.subcategory || "").toLowerCase();
      return (
        name.includes(safeSearch) ||
        category.includes(safeSearch) ||
        subcategory.includes(safeSearch) ||
        description.includes(safeSearch)
      );
    });

    setSuggestions(filtered.slice(0, 5));
  }, [searchTerm, allProducts]);

  const handleSelectProduct = (productId) => {
    onClose();
    setSearchTerm("");
    setSuggestions([]);
    navigate(`/allproducts/${productId}`);
  };

  return (
    <div className="relative">
      {/* 🔍 Search Icon */}
      <IoIosSearch
        className="text-primary text-2xl md:text-2xl hover:scale-110 transition-transform cursor-pointer hover:text-primary/80"
        onClick={() => {
          if (!isOpen) onOpen();
          else onClose();
        }}

      />

      {/* 🔎 Search Bar Dropdown */}
      {isOpen && (
        <div
          className="
    absolute 
    top-12
    -left-24       /* 📱 default — 320px */
    [@media(min-width:360px)]:-left-37  /* 📏 for ~375px */
    [@media(min-width:400px)]:-left-50  /* 📏 for ~425px */
    md:-top-1 md:-left-60              /* 💻 desktop */
    w-[90vw] md:w-72 max-w-sm
    bg-white rounded-lg shadow-lg z-50 animate-slideDown
-translate-x-0 md:-translate-x-1/3 md:-translate-2.5/4 

  "
        >

          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-1 border-primary rounded-md px-3 py-2  placeholder-primary focus:outline-none focus:ring-2 focus:primary text-sm"
          />

          {suggestions.length > 0 && (
            <div className="mt-2 border-t border-white pt-2 max-h-48 overflow-y-auto">
              {suggestions.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleSelectProduct(prod.id)}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/10 rounded transition-colors"
                >
                  <img
                    src={
                      prod?.image ||
                      (Array.isArray(prod?.images) && prod.images.length > 0
                        ? prod.images[0]
                        : null) ||
                      (Array.isArray(prod?.colors) &&
                        prod.colors.length > 0 &&
                        Array.isArray(prod.colors[0]?.images) &&
                        prod.colors[0].images.length > 0
                        ? prod.colors[0].images[0]
                        : null) ||
                      "/placeholder.jpg"
                    }
                    alt={prod?.productname || prod?.name || "Product"}
                    className="h-8 w-8 rounded object-cover border border-white"
                  />
                  <span className="text-primary text-sm truncate">
                    {prod?.productname || prod?.name || "Unnamed Product"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🎞 Animation for dropdown */}
      <style>
        {`
          @keyframes slideDown {
            0% { opacity: 0; transform: translateY(-10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-slideDown {
            animation: slideDown 0.3s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
};

export default Search;