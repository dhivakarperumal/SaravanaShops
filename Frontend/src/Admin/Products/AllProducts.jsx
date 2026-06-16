import React, { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import {
  FaEdit, FaTrash, FaEye, FaSearch, FaFilter,
  FaTh, FaList, FaPlus, FaTimes, FaStar,
} from "react-icons/fa";
import { MdOutlineArrowBackIosNew, MdOutlineArrowForwardIos } from "react-icons/md";

export default function ProductList() {
  const [products, setProducts]     = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode]     = useState("card"); // "card" | "table"
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewProduct, setViewProduct] = useState(null);
  const [productsPerPage]            = useState(12);
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
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => { console.error(err); toast.error("Error fetching products."); });
    return () => unsub();
  }, []);

  // ── Handlers ──────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try { await deleteDoc(doc(db, "products", id)); toast.success("Deleted!"); }
    catch (e) { toast.error("Error deleting."); }
  };
  const handleEdit = (p) => navigate(`/superadmin/addproducts/${p.id}`, { state: { product: p } });

  // ── Filter helpers ─────────────────────────────────
  const categories    = [...new Set(products.map((p) => p.category))];
  const subcategories = filters.category
    ? [...new Set(products.filter((p) => p.category === filters.category).map((p) => p.subcategory))].filter(Boolean)
    : [];
  const allColors = [...new Set(products.flatMap((p) => p.color || []))].filter(Boolean);
  const allSizes  = [...new Set(products.flatMap((p) => p.size  || []))].filter(Boolean);

  const setFilter = (key, val) => { setFilters((prev) => ({ ...prev, [key]: val })); setCurrentPage(1); };
  const toggleMulti = (key, val) => {
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
    if (filters.category && p.category !== filters.category) return false;
    if (filters.subcategory && p.subcategory !== filters.subcategory) return false;
    if (filters.color.length && !filters.color.some((c) => (p.color || []).includes(c))) return false;
    if (filters.size.length  && !filters.size.some((s)  => (p.size  || []).includes(s))) return false;
    if (filters.rating && (p.rating || 0) < Number(filters.rating)) return false;
    const price = p.sellingprice || p.price || 0;
    if (price < filters.price[0] || price > filters.price[1]) return false;
    return true;
  });

  const totalPages    = Math.ceil(displayed.length / productsPerPage);
  const currentItems  = displayed.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

  // ── Image helper ───────────────────────────────────
  const getImg = (p) =>
    p?.images?.[0] || p?.image?.[0] || p?.image ||
    (p?.colors && Object.values(p.colors)?.[0]?.image) || "/placeholder.jpg";

  return (
    <div className="px-8 min-h-screen bg-gray-50">

      {/* ── Toolbar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">

        {/* LEFT — Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(140,82,255,0.12)] transition-all duration-200">
          <FaSearch className="text-gray-400 text-sm flex-shrink-0" />
          <input
            type="text"
            placeholder="Search products…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          )}
        </div>

        {/* Results count */}
        <span className="text-sm text-gray-500 font-medium hidden sm:block whitespace-nowrap">
          {displayed.length} product{displayed.length !== 1 ? "s" : ""}
        </span>

        <div className="flex items-center gap-2 ml-auto">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((p) => !p)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 cursor-pointer ${
              showFilters ? "bg-primary text-white border-primary shadow-md" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
            }`}
          >
            <FaFilter className="text-xs" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* View mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200">
            <button
              onClick={() => setViewMode("card")}
              title="Card View"
              className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${viewMode === "card" ? "bg-white shadow text-primary" : "text-gray-400 hover:text-gray-600"}`}
            >
              <FaTh className="text-sm" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${viewMode === "table" ? "bg-white shadow text-primary" : "text-gray-400 hover:text-gray-600"}`}
            >
              <FaList className="text-sm" />
            </button>
          </div>

          {/* Add product */}
          <button
            onClick={() => navigate("/superadmin/addproducts")}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <FaPlus className="text-xs" />
            <span className="hidden sm:inline">Add Product</span>
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────── */}
      <div className="flex gap-5">

        {/* ── Filter Sidebar ──────────────────────── */}
        {showFilters && (
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto">
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
              <div className="mb-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Price: ₹{filters.price[0]} – ₹{filters.price[1]}
                </h4>
                <input type="range" min={0} max={10000} step={100} value={filters.price[1]}
                  onChange={(e) => setFilter("price", [filters.price[0], Number(e.target.value)])}
                  className="w-full accent-primary" />
              </div>
            </div>
          </aside>
        )}

        {/* ── Products Area ───────────────────────── */}
        <div className="flex-1 min-w-0">

          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <FaSearch className="text-5xl mb-4 opacity-30" />
              <p className="text-lg font-semibold">No products found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : viewMode === "card" ? (
            /* ── CARD MODE ── */
            <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {currentItems.map((product) => (
                <div key={product.id}
                  className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative overflow-hidden bg-gray-50 h-48">
                    <img src={getImg(product)} alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {product.offer && (
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {product.offer}% OFF
                      </span>
                    )}
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                      <button onClick={() => setViewProduct(product)}
                        className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-gray-700 hover:text-primary shadow-md hover:scale-110 transition-all cursor-pointer">
                        <FaEye className="text-sm" />
                      </button>
                      <button onClick={() => handleEdit(product)}
                        className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-gray-700 hover:text-green-600 shadow-md hover:scale-110 transition-all cursor-pointer">
                        <FaEdit className="text-sm" />
                      </button>
                      <button onClick={() => handleDelete(product.id)}
                        className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-gray-700 hover:text-red-600 shadow-md hover:scale-110 transition-all cursor-pointer">
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{product.name}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{product.category}{product.subcategory ? ` • ${product.subcategory}` : ""}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {product.mrp && (
                        <span className="text-gray-400 line-through text-xs">₹{Number(product.mrp).toFixed(0)}</span>
                      )}
                      <span className="text-primary font-bold text-sm">₹{Number(product.sellingprice ?? product.price ?? 0).toFixed(0)}</span>
                    </div>
                    {product.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <FaStar className="text-yellow-400 text-[10px]" />
                        <span className="text-xs text-gray-600">{product.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── TABLE MODE ── */
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-primary to-secondary text-white">
                      <th className="px-4 py-3 text-left font-semibold">Image</th>
                      <th className="px-4 py-3 text-left font-semibold">Product</th>
                      <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Category</th>
                      <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">MRP</th>
                      <th className="px-4 py-3 text-left font-semibold">Price</th>
                      <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Rating</th>
                      <th className="px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentItems.map((product, idx) => (
                      <tr key={product.id} className={`hover:bg-primary/5 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-4 py-3">
                          <img src={getImg(product)} alt={product.name}
                            className="w-12 h-12 object-cover rounded-xl border border-gray-100" />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800 truncate max-w-[160px]">{product.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{product.productType || ""}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-lg">{product.category}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-gray-400 line-through">
                          {product.mrp ? `₹${Number(product.mrp).toFixed(0)}` : "-"}
                        </td>
                        <td className="px-4 py-3 font-bold text-primary">
                          ₹{Number(product.sellingprice ?? product.price ?? 0).toFixed(0)}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {product.rating ? (
                            <div className="flex items-center gap-1">
                              <FaStar className="text-yellow-400 text-xs" />
                              <span className="text-gray-700 font-medium">{product.rating}</span>
                            </div>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setViewProduct(product)}
                              className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center transition-colors cursor-pointer" title="View">
                              <FaEye className="text-xs" />
                            </button>
                            <button onClick={() => handleEdit(product)}
                              className="w-8 h-8 rounded-lg bg-green-50 text-green-500 hover:bg-green-100 flex items-center justify-center transition-colors cursor-pointer" title="Edit">
                              <FaEdit className="text-xs" />
                            </button>
                            <button onClick={() => handleDelete(product.id)}
                              className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer" title="Delete">
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
            <div className="flex justify-center items-center gap-2 mt-6">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                <MdOutlineArrowBackIosNew className="text-sm" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${currentPage === i + 1 ? "bg-gradient-to-br from-primary to-secondary text-white border-primary shadow-md" : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                <MdOutlineArrowForwardIos className="text-sm" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── View Product Modal ──────────────────────── */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden">
            <button onClick={() => setViewProduct(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 z-10 cursor-pointer">
              <FaTimes className="text-sm" />
            </button>
            <img src={getImg(viewProduct)} alt={viewProduct.name} className="w-full h-56 object-cover" />
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-800 mb-1">{viewProduct.name}</h2>
              <p className="text-xs text-gray-400 mb-3">{viewProduct.category}{viewProduct.subcategory ? ` • ${viewProduct.subcategory}` : ""}</p>
              <div className="flex items-center gap-3 mb-3">
                {viewProduct.mrp && <span className="text-gray-400 line-through text-sm">₹{Number(viewProduct.mrp).toFixed(2)}</span>}
                <span className="text-primary font-extrabold text-xl">₹{Number(viewProduct.sellingprice ?? viewProduct.price ?? 0).toFixed(2)}</span>
                {viewProduct.offer && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{viewProduct.offer}% OFF</span>}
              </div>
              {viewProduct.description && <p className="text-gray-600 text-sm leading-relaxed">{viewProduct.description}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => { handleEdit(viewProduct); setViewProduct(null); }}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition cursor-pointer">
                  Edit Product
                </button>
                <button onClick={() => setViewProduct(null)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition cursor-pointer">
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
