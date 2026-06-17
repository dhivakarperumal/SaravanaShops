import React, { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  FaEdit, FaTrash, FaEye, FaSearch, FaFilter,
  FaTh, FaList, FaPlus, FaTimes, FaStar,
} from "react-icons/fa";
import { MdOutlineArrowBackIosNew, MdOutlineArrowForwardIos } from "react-icons/md";

export default function ProductList() {
  const [products, setProducts]       = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode]       = useState("card");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewProduct, setViewProduct] = useState(null);
  const [productsPerPage]             = useState(12);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    category: "",
    subcategory: "",
    color: [],
    size: [],
    price: [0, 10000],
    rating: "",
  });

  // ── Fetch ──────────────────────────────────────────
  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching products.");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Lock body scroll when mobile filter drawer is open
  useEffect(() => {
    document.body.style.overflow = showFilters ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showFilters]);

  // ── Handlers ──────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try { 
      await api.delete(`/products/${id}`);
      toast.success("Deleted!"); 
      fetchProducts();
    } catch (e) { 
      toast.error("Error deleting."); 
    }
  };
  const handleEdit = (p) => navigate(`/superadmin/addproducts/${p.id}`, { state: { product: p } });

  // ── Filter helpers ─────────────────────────────────
  const categories    = [...new Set(products.map((p) => p.category))];
  const subcategories = filters.category
    ? [...new Set(products.filter((p) => p.category === filters.category).map((p) => p.subcategory))].filter(Boolean)
    : [];

  const extractColors = (p) => {
    if (Array.isArray(p.colors)) return p.colors.map(c => c.color).filter(Boolean);
    return Array.isArray(p.color) ? p.color : [];
  };

  const extractSizes = (p) => {
    if (Array.isArray(p.colors)) return p.colors.flatMap(c => c.size || []).filter(Boolean);
    return Array.isArray(p.size) ? p.size : [];
  };

  const allColors = [...new Set(products.flatMap(extractColors))].filter(Boolean);
  const allSizes  = [...new Set(products.flatMap(extractSizes))].filter(Boolean);

  const setFilter    = (key, val) => { setFilters((prev) => ({ ...prev, [key]: val })); setCurrentPage(1); };
  const toggleMulti  = (key, val) => {
    setFilters((prev) => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
    });
    setCurrentPage(1);
  };
  const clearFilters = () => {
    setFilters({ category: "", subcategory: "", color: [], size: [], price: [0, 10000], rating: "" });
    setSearchQuery("");
    setCurrentPage(1);
  };

  const activeFilterCount = [
    filters.category, filters.subcategory,
    ...filters.color, ...filters.size,
    filters.rating,
    (filters.price[0] > 0 || filters.price[1] < 10000) ? "price" : "",
  ].filter(Boolean).length;

  // ── Filtered & searched ────────────────────────────
  const displayed = products.filter((p) => {
    if (searchQuery && !p.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filters.category   && p.category    !== filters.category)   return false;
    if (filters.subcategory && p.subcategory !== filters.subcategory) return false;
    if (filters.color.length && !filters.color.some((c) => extractColors(p).includes(c))) return false;
    if (filters.size.length  && !filters.size.some((s)  => extractSizes(p).includes(s))) return false;
    if (filters.rating && (p.rating || 0) < Number(filters.rating)) return false;
    const price = p.sellingprice || p.price || 0;
    if (price < filters.price[0] || price > filters.price[1]) return false;
    return true;
  });

  const totalPages   = Math.ceil(displayed.length / productsPerPage);
  const currentItems = displayed.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

  // Smart pagination: show at most 5 page buttons with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 5) return [...Array(totalPages)].map((_, i) => i + 1);
    const pages = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "…", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages);
    }
    return pages;
  };

  // ── Image helper ───────────────────────────────────
  const getImg = (p) =>
    p?.images?.[0] || p?.image?.[0] || p?.image ||
    (p?.colors && Object.values(p.colors)?.[0]?.image) || "/placeholder.jpg";

  // ── Filter Panel (shared between drawer & sidebar) ─
  const FilterPanel = () => (
    <div className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-800 text-base">Filters</h3>
        <button onClick={clearFilters} className="text-xs text-red-500 font-semibold hover:text-red-700 flex items-center gap-1 cursor-pointer">
          <FaTimes className="text-[10px]" /> Clear all
        </button>
      </div>

      {/* Category */}
      <div className="mb-5">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</h4>
        {["", ...categories.filter(Boolean)].map((c) => (
          <label key={c || "__all"} className="flex items-center gap-2 py-1 cursor-pointer">
            <input type="radio" name="category" value={c} checked={filters.category === c}
              onChange={() => setFilter("category", c)} className="accent-primary" />
            <span className="text-sm text-gray-700">{c || "All"}</span>
          </label>
        ))}
      </div>

      {/* Subcategory */}
      {subcategories.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subcategory</h4>
          {["", ...subcategories].map((s) => (
            <label key={s || "__all"} className="flex items-center gap-2 py-1 cursor-pointer">
              <input type="radio" name="subcategory" value={s} checked={filters.subcategory === s}
                onChange={() => setFilter("subcategory", s)} className="accent-primary" />
              <span className="text-sm text-gray-700">{s || "All"}</span>
            </label>
          ))}
        </div>
      )}

      {/* Colors */}
      {allColors.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Color</h4>
          <div className="flex flex-wrap gap-2">
            {allColors.map((c) => (
              <div key={c} onClick={() => toggleMulti("color", c)} title={c}
                className={`w-7 h-7 rounded-full cursor-pointer border-[3px] transition-all ${filters.color.includes(c) ? "border-primary scale-110 shadow-md" : "border-gray-200 hover:border-gray-400"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      {allSizes.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Size</h4>
          <div className="flex flex-wrap gap-2">
            {allSizes.map((s) => (
              <button key={s} onClick={() => toggleMulti("size", s)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${filters.size.includes(s) ? "bg-primary text-white border-primary" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary"}`}
              >{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Rating */}
      <div className="mb-5">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Min Rating</h4>
        <div className="flex gap-2 flex-wrap">
          {["", "3", "4", "4.5"].map((r) => (
            <button key={r} onClick={() => setFilter("rating", r)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${filters.rating === r ? "bg-yellow-400 text-white border-yellow-400" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-yellow-400"}`}
            >
              {r ? <><FaStar className="text-[9px]" />{r}+</> : "Any"}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="mb-2">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Price: ₹{filters.price[0]} – ₹{filters.price[1]}
        </h4>
        <input type="range" min={0} max={10000} step={100} value={filters.price[1]}
          onChange={(e) => setFilter("price", [filters.price[0], Number(e.target.value)])}
          className="w-full accent-primary" />
      </div>
    </div>
  );

  return (
    <div className="px-3 py-6 sm:px-5 lg:px-8 min-h-screen ">

      {/* ── Toolbar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6 bg-white rounded-2xl px-3 sm:px-4 py-3 shadow-sm border border-gray-100">

        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(140,82,255,0.12)] transition-all duration-200">
          <FaSearch className="text-gray-400 text-sm flex-shrink-0" />
          <input
            type="text"
            placeholder="Search products…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="flex-1 min-w-0 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0">✕</button>
          )}
        </div>

        {/* Results count */}
        <span className="text-xs sm:text-sm text-gray-500 font-medium hidden sm:block whitespace-nowrap flex-shrink-0">
          {displayed.length} product{displayed.length !== 1 ? "s" : ""}
        </span>

        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-shrink-0">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((p) => !p)}
            className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-200 cursor-pointer ${
              showFilters ? "bg-primary text-white border-primary shadow-md" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
            }`}
          >
            <FaFilter className="text-xs" />
            <span className="hidden xs:inline sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* View mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200">
            <button
              onClick={() => setViewMode("card")} title="Card View"
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 cursor-pointer ${viewMode === "card" ? "bg-white shadow text-primary" : "text-gray-400 hover:text-gray-600"}`}
            >
              <FaTh className="text-xs sm:text-sm" />
            </button>
            <button
              onClick={() => setViewMode("table")} title="Table View"
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 cursor-pointer ${viewMode === "table" ? "bg-white shadow text-primary" : "text-gray-400 hover:text-gray-600"}`}
            >
              <FaList className="text-xs sm:text-sm" />
            </button>
          </div>

          {/* Add product */}
          <button
            onClick={() => navigate("/superadmin/addproducts")}
            className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-primary to-secondary text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <FaPlus className="text-xs" />
            <span className="hidden sm:inline">Add Product</span>
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────── */}
      <div className="flex gap-4 lg:gap-5 relative">

        {/* ── Mobile Filter Drawer Overlay ─────────── */}
        {showFilters && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowFilters(false)}
          />
        )}

        {/* ── Filter Panel (drawer on mobile, sidebar on desktop) ── */}
        <aside
          className={`
            fixed lg:static top-0 left-0 h-full lg:h-auto z-50 lg:z-auto
            w-72 lg:w-64 flex-shrink-0
            bg-white lg:bg-transparent
            shadow-2xl lg:shadow-none
            transition-transform duration-300 ease-in-out lg:transition-none
            ${showFilters ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            ${!showFilters ? "lg:hidden" : "lg:block"}
          `}
        >
          {/* Close button (mobile only) */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 lg:hidden">
            <h3 className="font-bold text-gray-800">Filters</h3>
            <button onClick={() => setShowFilters(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer">
              <FaTimes className="text-sm" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto max-h-screen lg:max-h-[calc(100vh-140px)] lg:sticky lg:top-6">
            <FilterPanel />
          </div>
        </aside>

        {/* ── Products Area ───────────────────────── */}
        <div className="flex-1 min-w-0">

          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-gray-400">
              <FaSearch className="text-4xl sm:text-5xl mb-4 opacity-30" />
              <p className="text-base sm:text-lg font-semibold">No products found</p>
              <p className="text-xs sm:text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : viewMode === "card" ? (
            /* ── CARD MODE ── */
            <div className={`grid gap-3 sm:gap-4 lg:gap-5 ${
              showFilters
                ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            }`}>
              {currentItems.map((product) => (
                <div key={product.id}
                  className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative overflow-hidden bg-gray-50 h-36 sm:h-44 lg:h-48">
                    <img src={getImg(product)} alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {product.offer && (
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                        {product.offer}% OFF
                      </span>
                    )}
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 sm:gap-3">
                      <button onClick={() => setViewProduct(product)}
                        className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-full flex items-center justify-center text-gray-700 hover:text-primary shadow-md hover:scale-110 transition-all cursor-pointer">
                        <FaEye className="text-xs sm:text-sm" />
                      </button>
                      <button onClick={() => handleEdit(product)}
                        className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-full flex items-center justify-center text-gray-700 hover:text-green-600 shadow-md hover:scale-110 transition-all cursor-pointer">
                        <FaEdit className="text-xs sm:text-sm" />
                      </button>
                      <button onClick={() => handleDelete(product.id)}
                        className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-full flex items-center justify-center text-gray-700 hover:text-red-600 shadow-md hover:scale-110 transition-all cursor-pointer">
                        <FaTrash className="text-xs sm:text-sm" />
                      </button>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-2 sm:p-3">
                    <h3 className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{product.name}</h3>
                    <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5 truncate">
                      {product.category}{product.subcategory ? ` • ${product.subcategory}` : ""}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap">
                      {product.mrp && (
                        <span className="text-gray-400 line-through text-[10px] sm:text-xs">₹{Number(product.mrp).toFixed(0)}</span>
                      )}
                      <span className="text-primary font-bold text-xs sm:text-sm">₹{Number(product.sellingprice ?? product.price ?? 0).toFixed(0)}</span>
                    </div>
                    {product.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <FaStar className="text-yellow-400 text-[9px] sm:text-[10px]" />
                        <span className="text-[10px] sm:text-xs text-gray-600">{product.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── TABLE MODE ── */
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-primary to-secondary text-white">
                      <th className="px-3 sm:px-4 py-3 text-left font-semibold">Image</th>
                      <th className="px-3 sm:px-4 py-3 text-left font-semibold">Product</th>
                      <th className="px-3 sm:px-4 py-3 text-left font-semibold hidden md:table-cell">Category</th>
                      <th className="px-3 sm:px-4 py-3 text-left font-semibold hidden lg:table-cell">MRP</th>
                      <th className="px-3 sm:px-4 py-3 text-left font-semibold">Price</th>
                      <th className="px-3 sm:px-4 py-3 text-left font-semibold hidden md:table-cell">Rating</th>
                      <th className="px-3 sm:px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentItems.map((product, idx) => (
                      <tr key={product.id} className={`hover:bg-primary/5 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-3 sm:px-4 py-3">
                          <img src={getImg(product)} alt={product.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-xl border border-gray-100" />
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <p className="font-semibold text-gray-800 truncate max-w-[120px] sm:max-w-[160px] text-xs sm:text-sm">{product.name}</p>
                          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{product.productType || ""}</p>
                        </td>
                        <td className="px-3 sm:px-4 py-3 hidden md:table-cell">
                          <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-lg">{product.category}</span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 hidden lg:table-cell text-gray-400 line-through text-xs sm:text-sm">
                          {product.mrp ? `₹${Number(product.mrp).toFixed(0)}` : "-"}
                        </td>
                        <td className="px-3 sm:px-4 py-3 font-bold text-primary text-xs sm:text-sm">
                          ₹{Number(product.sellingprice ?? product.price ?? 0).toFixed(0)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 hidden md:table-cell">
                          {product.rating ? (
                            <div className="flex items-center gap-1">
                              <FaStar className="text-yellow-400 text-xs" />
                              <span className="text-gray-700 font-medium text-xs sm:text-sm">{product.rating}</span>
                            </div>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            <button onClick={() => setViewProduct(product)}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center transition-colors cursor-pointer" title="View">
                              <FaEye className="text-xs" />
                            </button>
                            <button onClick={() => handleEdit(product)}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-50 text-green-500 hover:bg-green-100 flex items-center justify-center transition-colors cursor-pointer" title="Edit">
                              <FaEdit className="text-xs" />
                            </button>
                            <button onClick={() => handleDelete(product.id)}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer" title="Delete">
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-5 sm:mt-6 flex-wrap">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <MdOutlineArrowBackIosNew className="text-xs sm:text-sm" />
              </button>
              {getPageNumbers().map((page, i) =>
                page === "…" ? (
                  <span key={`ellipsis-${i}`} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                      currentPage === page
                        ? "bg-gradient-to-br from-primary to-secondary text-white border-primary shadow-md"
                        : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <MdOutlineArrowForwardIos className="text-xs sm:text-sm" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── View Product Modal ──────────────────────── */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md relative overflow-hidden max-h-[90vh] flex flex-col">
            <button onClick={() => setViewProduct(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 z-10 cursor-pointer">
              <FaTimes className="text-sm" />
            </button>
            <img src={getImg(viewProduct)} alt={viewProduct.name} className="w-full h-44 sm:h-56 object-cover flex-shrink-0" />
            <div className="p-4 sm:p-5 overflow-y-auto">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">{viewProduct.name}</h2>
              <p className="text-xs text-gray-400 mb-3">{viewProduct.category}{viewProduct.subcategory ? ` • ${viewProduct.subcategory}` : ""}</p>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                {viewProduct.mrp && <span className="text-gray-400 line-through text-sm">₹{Number(viewProduct.mrp).toFixed(2)}</span>}
                <span className="text-primary font-extrabold text-lg sm:text-xl">₹{Number(viewProduct.sellingprice ?? viewProduct.price ?? 0).toFixed(2)}</span>
                {viewProduct.offer && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{viewProduct.offer}% OFF</span>}
              </div>
              {viewProduct.description && <p className="text-gray-600 text-sm leading-relaxed">{viewProduct.description}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => { handleEdit(viewProduct); setViewProduct(null); }}
                  className="flex-1 py-2 sm:py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition cursor-pointer">
                  Edit Product
                </button>
                <button onClick={() => setViewProduct(null)}
                  className="px-4 py-2 sm:py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition cursor-pointer">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
