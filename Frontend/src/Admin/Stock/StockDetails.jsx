import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import {
  FaSearch, FaFilter, FaTh, FaList, FaTimes, FaEdit
} from "react-icons/fa";
import { MdOutlineArrowBackIosNew, MdOutlineArrowForwardIos } from "react-icons/md";

export default function StockDetails() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // New States
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);
  const [filters, setFilters] = useState({ category: "" });

  const navigate = useNavigate();

  const calculateColorStock = (c) => {
    if (!c.stock) return 0;
    return Object.values(c.stock).reduce((sum, val) => sum + (Number(val) || 0), 0);
  };

  const calculateTotalStock = (p) => {
    if (p.productType === "Bangles" && p.count === "SingleColor") {
      if (!p.colors || !Array.isArray(p.colors)) return 0;
      return p.colors.reduce((total, c) => total + calculateColorStock(c), 0);
    }
    return p.stock || 0;
  };

  const getImg = (p) =>
    p?.images?.[0] || p?.image?.[0] || p?.image ||
    (p?.colors && Object.values(p.colors)?.[0]?.images?.[0]) ||
    (p?.colors && Object.values(p.colors)?.[0]?.image) || "/placeholder.jpg";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        if (res.data.success) {
          setProducts(res.data.data);
        } else {
          setProducts(res.data || []);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;

      setIsMobile(mobile);

      if (mobile) {
        setViewMode("card");
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filter & Search logic
  const displayed = products.filter((p) => {
    if (searchQuery &&
      !p.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.productId?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filters.category && p.productType !== filters.category && p.category !== filters.category) return false;
    return true;
  });

  const totalPages = Math.ceil(displayed.length / productsPerPage) || 1;
  const currentItems = displayed.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

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

  const categories = [...new Set(products.map(p => p.productType || p.category))].filter(Boolean);

  if (loading) return <div className="p-10 text-center">Loading stock...</div>;

  return (
    <div className="max-w-7xl mx-auto mt-2 px-3 py-4 sm:px-6">



      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white shadow-sm rounded-2xl px-4 py-3 border border-gray-100">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:max-w-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus-within:border-primary transition-all">
          <FaSearch className="text-gray-400 text-sm flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by Name or ID…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="flex-1 min-w-0 bg-transparent text-sm text-gray-700 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer">✕</button>
          )}
        </div>

        <span className="text-sm text-gray-500 font-medium hidden sm:block flex-shrink-0">
          {displayed.length} item{displayed.length !== 1 ? "s" : ""}
        </span>

        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto flex-wrap justify-end">
          {/* Filters toggle */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${showFilters ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                }`}
            >
              <FaFilter className="text-xs" />
              <span className="hidden sm:inline">Filter</span>
              {filters.category && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">1</span>
              )}
            </button>

            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-sm">Categories</h4>
                  <button onClick={() => { setFilters({ category: "" }); setCurrentPage(1); }} className="text-xs text-red-500 hover:underline cursor-pointer">Clear</button>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="cat" checked={!filters.category} onChange={() => { setFilters({ category: "" }); setCurrentPage(1); }} className="accent-primary" />
                    <span className="text-sm text-gray-700">All</span>
                  </label>
                  {categories.map(c => (
                    <label key={c} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="cat" checked={filters.category === c} onChange={() => { setFilters({ category: c }); setCurrentPage(1); }} className="accent-primary" />
                      <span className="text-sm text-gray-700">{c}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View Mode */}
          {!isMobile && (
          <div className="flex items-center bg-gray-200 rounded-xl p-1">
            <button onClick={() => setViewMode("card")} className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${viewMode === "card" ? "bg-white shadow text-primary" : "text-gray-500"}`}>
              <FaTh />
            </button>
            <button onClick={() => setViewMode("table")} className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${viewMode === "table" ? "bg-white shadow text-primary" : "text-gray-500"}`}>
              <FaList />
            </button>
          </div>
          )}  

           <button
          className="bg-primary cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-primary/90 shadow whitespace-nowrap"
          onClick={() => navigate("/superadmin/stocks")}
        >
          Add Stock
        </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      {currentItems.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No stock details found.</p>
        </div>
      ) : !isMobile && viewMode === "table" ? (
        /* TABLE MODE */
        <div className="bg-white shadow rounded-lg overflow-x-auto border border-gray-100">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-primary text-white text-center">
              <tr>
                <th className="px-3 py-4 w-12">S.No</th>
                <th className="px-3 py-4 w-16">Image</th>
                <th className="px-3 py-4">Product ID</th>
                <th className="px-3 py-4">Name</th>
                <th className="px-3 py-4">Category</th>
                <th className="px-3 py-4">Total Stock</th>
                <th className="px-3 py-4 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((p, idx) => {
                const sNo = (currentPage - 1) * productsPerPage + idx + 1;
                return (
                  <React.Fragment key={p.productId}>
                    <tr
                      className="cursor-pointer text-center hover:bg-gray-50 border-b border-gray-100 transition-colors"
                      onClick={() => setExpandedId(expandedId === p.productId ? null : p.productId)}
                    >
                      <td className="px-3 py-4 font-semibold text-gray-500">{sNo}</td>
                      <td className="px-3 py-2">
                        <img src={getImg(p)} alt="product" className="w-10 h-10 object-cover rounded shadow-sm mx-auto bg-gray-50" />
                      </td>
                      <td className="px-3 py-4 font-semibold text-blue-600">{p.productId}</td>
                      <td className="px-3 py-4">{p.name}</td>
                      <td className="px-3 py-4">
                        <span className="bg-gray-100 px-2 py-1 rounded-md text-xs">{p.productType || p.category}</span>
                      </td>
                      <td className="px-3 py-4 font-bold">{calculateTotalStock(p)}</td>
                      <td className="px-3 py-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/superadmin/stocks/${p.productId}`); }}
                          className="flex items-center gap-1.5 mx-auto px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary hover:text-white transition-all cursor-pointer"
                        >
                          <FaEdit className="text-[11px]" />
                          Edit
                        </button>
                      </td>
                    </tr>

                    {/* Expanded row nested logic */}
                    {expandedId === p.productId && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={7} className="p-4 border-b border-gray-200">
                          <div className="bg-white shadow-sm rounded-lg overflow-x-auto border border-gray-200 max-w-3xl mx-auto">
                            <table className="min-w-full text-sm text-left">
                              <thead className="bg-gray-100 text-gray-700 text-center">
                                <tr><th className="px-3 py-3">Attribute</th><th className="px-3 py-3">Stock Breakdown</th></tr>
                              </thead>
                              <tbody>
                                {p.productType === "Bangles" && p.count === "SingleColor" && p.colors?.map(c => (
                                  <tr key={c.color} className="border-t border-gray-100 text-center">
                                    <td className="px-3 py-3">
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 rounded-full shadow-sm border border-gray-200" style={{ backgroundColor: c.color }} title={c.color}></div>
                                        <span className="font-medium">{c.color}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-3 text-gray-600">
                                      <div className="flex flex-wrap justify-center gap-2 mb-1">
                                        {c.size.map(sz => (
                                          <span key={sz} className="bg-gray-100 px-2 py-0.5 rounded text-xs">{sz}: {c.stock[sz]}</span>
                                        ))}
                                      </div>
                                      <div className="font-semibold text-xs text-primary">Total for color: {calculateColorStock(c)}</div>
                                    </td>
                                  </tr>
                                ))}
                                {p.productType === "Bangles" && p.count === "MultiColor" && (
                                  <tr className="text-center"><td className="px-3 py-3 font-medium">Bangles</td><td className="px-3 py-3">{p.stock}</td></tr>
                                )}
                                {p.productType === "Sarees" && (
                                  <tr className="text-center"><td className="px-3 py-3 font-medium">Saree Stock</td><td className="px-3 py-3">{p.stock}</td></tr>
                                )}
                                {p.productType === "Jewels" && (
                                  <>
                                    <tr className="text-center border-t border-gray-100"><td className="px-3 py-2 font-medium">Subcategory</td><td className="px-3 py-2">{p.subcategory}</td></tr>
                                    <tr className="text-center border-t border-gray-100"><td className="px-3 py-2 font-medium">Items</td><td className="px-3 py-2">{p.list_of_items?.join(", ")}</td></tr>
                                    <tr className="text-center border-t border-gray-100"><td className="px-3 py-2 font-medium">Stock</td><td className="px-3 py-2">{p.stock}</td></tr>
                                  </>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (isMobile || viewMode === "card") && (
        /* CARD MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentItems.map(p => (
            <div key={p.productId} className="border border-gray-100 rounded-2xl shadow-sm bg-white overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-44 sm:h-40 bg-gray-50 relative">
                <img src={getImg(p)} alt="product" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-primary shadow-sm">
                  Stock: {calculateTotalStock(p)}
                </div>
              </div>
              <div className="p-4">
                <div className="text-xs text-gray-500 mb-1">{p.productId}</div>
                <h3 className="font-semibold text-gray-800 text-sm truncate mb-1">{p.name}</h3>
                <div className="text-xs bg-gray-100 text-gray-600 inline-block px-2 py-0.5 rounded mb-3">{p.productType || p.category}</div>

                <button
                  onClick={() => setExpandedId(expandedId === p.productId ? null : p.productId)}
                  className="w-full py-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  {expandedId === p.productId ? "Hide Details" : "View Breakdown"}
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/superadmin/stocks/${p.productId}`); }}
                  className="w-full py-1.5 mt-2 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FaEdit className="text-[11px]" />
                  Edit Stock
                </button>

                {expandedId === p.productId && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    {p.productType === "Bangles" && p.count === "SingleColor" && p.colors?.map(c => (
                      <div key={c.color} className="bg-gray-50 p-2 rounded text-xs">
                        <div className="flex items-center gap-1.5 font-semibold mb-1">
                          <div className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: c.color }}></div>
                          <span>{c.color}</span>
                          <span className="ml-auto text-primary">Total: {calculateColorStock(c)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 text-[10px] text-gray-600">
                          {c.size.map(sz => <span key={sz} className="bg-white px-1 border border-gray-200 rounded">{sz}: {c.stock[sz]}</span>)}
                        </div>
                      </div>
                    ))}
                    {p.productType === "Bangles" && p.count === "MultiColor" && (
                      <div className="text-xs">Bangles Total Stock: {p.stock}</div>
                    )}
                    {p.productType === "Sarees" && (
                      <div className="text-xs">Saree Stock: {p.stock}</div>
                    )}
                    {p.productType === "Jewels" && (
                      <div className="text-xs space-y-1">
                        <div><span className="font-medium">Sub:</span> {p.subcategory}</div>
                        <div><span className="font-medium">Items:</span> {p.list_of_items?.join(", ")}</div>
                        <div><span className="font-medium">Stock:</span> {p.stock}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-primary hover:text-primary disabled:opacity-40 cursor-pointer"
          >
            <MdOutlineArrowBackIosNew className="text-xs" />
          </button>

          {getPageNumbers().map((page, i) =>
            page === "…" ? (
              <span key={`ell-${i}`} className="text-gray-400">…</span>
            ) : (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold border cursor-pointer transition-colors ${currentPage === page ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                  }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-primary hover:text-primary disabled:opacity-40 cursor-pointer"
          >
            <MdOutlineArrowForwardIos className="text-xs" />
          </button>
        </div>
      )}

    </div>
  );
}
