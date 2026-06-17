import React, { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  FaEdit, FaTrash, FaEye, FaSearch, FaFilter,
  FaTh, FaList, FaPlus, FaTimes, FaDownload,
} from "react-icons/fa";
import { MdOutlineArrowBackIosNew, MdOutlineArrowForwardIos } from "react-icons/md";

export default function AllBillings() {
  const [billings, setBillings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("card");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewBilling, setViewBilling] = useState(null);
  const [billingsPerPage] = useState(12);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    status: "",
    dateRange: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()],
  });

  // ── Fetch ──────────────────────────────────────────
  const fetchBillings = async () => {
    try {
      const res = await api.get("/invoices");
      if (res.data.success) {
        setBillings(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching billings.");
    }
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  // Lock body scroll when mobile filter drawer is open
  useEffect(() => {
    document.body.style.overflow = showFilters ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showFilters]);

  // ── Handlers ──────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this billing?")) return;
    try {
      await api.delete(`/invoices/${id}`);
      toast.success("Deleted!");
      fetchBillings();
    } catch (e) {
      toast.error("Error deleting.");
    }
  };

  const handleEdit = (billing) => {
    navigate(`/superadmin/addbilling/${billing.id}`, { state: { billing } });
  };

  const handleDownload = (billing) => {
    if (billing.billPdfBase64) {
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${billing.billPdfBase64}`;
      link.download = billing.billPdfName || `invoice-${billing.invoiceNo}.pdf`;
      link.click();
      toast.success("PDF downloaded!");
    } else {
      toast.error("No PDF available for this billing.");
    }
  };

  // ── Filter helpers ─────────────────────────────────
  const statuses = ["Pending", "Completed", "Cancelled"];
  const setFilter = (key, val) => { setFilters((prev) => ({ ...prev, [key]: val })); setCurrentPage(1); };
  const clearFilters = () => {
    setFilters({ status: "", dateRange: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()] });
    setSearchQuery("");
    setCurrentPage(1);
  };

  const activeFilterCount = [
    filters.status,
  ].filter(Boolean).length;

  // ── Filtered & searched ────────────────────────────
  const displayed = billings.filter((b) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!b.invoiceNo?.toLowerCase().includes(query) &&
          !b.invoiceDate?.toLowerCase().includes(query)) return false;
    }
    if (filters.status && b.status !== filters.status) return false;
    return true;
  });

  const totalPages = Math.ceil(displayed.length / billingsPerPage);
  const currentItems = displayed.slice((currentPage - 1) * billingsPerPage, currentPage * billingsPerPage);

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

  // ── Filter Panel (shared between drawer & sidebar) ─
  const FilterPanel = () => (
    <div className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-800 text-base">Filters</h3>
        <button onClick={clearFilters} className="text-xs text-red-500 font-semibold hover:text-red-700 flex items-center gap-1 cursor-pointer">
          <FaTimes className="text-[10px]" /> Clear all
        </button>
      </div>

      {/* Status */}
      <div className="mb-5">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</h4>
        {["", ...statuses].map((s) => (
          <label key={s || "__all"} className="flex items-center gap-2 py-1 cursor-pointer">
            <input type="radio" name="status" value={s} checked={filters.status === s}
              onChange={() => setFilter("status", s)} className="accent-primary" />
            <span className="text-sm text-gray-700">{s || "All"}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="px-3 sm:px-5 lg:px-8 min-h-screen">

      {/* ── Toolbar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6 bg-white rounded-2xl px-3 sm:px-4 py-3 shadow-sm border border-gray-100">

        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(140,82,255,0.12)] transition-all duration-200">
          <FaSearch className="text-gray-400 text-sm flex-shrink-0" />
          <input
            type="text"
            placeholder="Search billings…"
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
          {displayed.length} billing{displayed.length !== 1 ? "s" : ""}
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

          {/* Add billing */}
          <button
            onClick={() => navigate("/superadmin/addbilling")}
            className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-primary to-secondary text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <FaPlus className="text-xs" />
            <span className="hidden sm:inline">Add Billing</span>
          </button>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl rounded-l-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="font-bold">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}

      {/* Sidebar Filters (desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Filters Sidebar */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-4">
            <FilterPanel />
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">

          {currentItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-gray-500 font-medium">No billings found</p>
              <button
                onClick={() => navigate("/superadmin/addbilling")}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Create First Billing
              </button>
            </div>
          ) : viewMode === "card" ? (
            // ── CARD VIEW ──────────────────────────────────
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
              {currentItems.map((billing) => (
                <div
                  key={billing.id}
                  className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300 p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{billing.invoiceNo}</h3>
                      <p className="text-xs text-gray-500 mt-1">{billing.invoiceDate}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      billing.status === "Completed" ? "bg-green-100 text-green-700" :
                      billing.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {billing.status || "Pending"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Value</p>
                      <p className="font-bold text-gray-900">₹{(billing.invoiceValue || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total</p>
                      <p className="font-bold text-gray-900">₹{(billing.invoiceTotalValue || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setViewBilling(billing)}
                      title="View"
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                    >
                      <FaEye className="text-sm" /> View
                    </button>
                    <button
                      onClick={() => handleEdit(billing)}
                      title="Edit"
                      className="flex-1 px-3 py-2 bg-amber-50 text-amber-600 rounded-lg font-semibold hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                    >
                      <FaEdit className="text-sm" /> Edit
                    </button>
                    <button
                      onClick={() => handleDownload(billing)}
                      title="Download"
                      className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg font-semibold hover:bg-green-100 transition-all flex items-center justify-center gap-2"
                    >
                      <FaDownload className="text-sm" /> Download
                    </button>
                    <button
                      onClick={() => handleDelete(billing.id)}
                      title="Delete"
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-all"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // ── TABLE VIEW ─────────────────────────────────
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Invoice No</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Value</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.map((billing) => (
                      <tr key={billing.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{billing.invoiceNo}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{billing.invoiceDate}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{(billing.invoiceValue || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{(billing.invoiceTotalValue || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            billing.status === "Completed" ? "bg-green-100 text-green-700" :
                            billing.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {billing.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setViewBilling(billing)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="View"
                            >
                              <FaEye className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleEdit(billing)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              title="Edit"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleDownload(billing)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Download"
                            >
                              <FaDownload className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleDelete(billing.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <FaTrash className="text-sm" />
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

          {/* ── PAGINATION ────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-6 flex-wrap">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <MdOutlineArrowBackIosNew className="text-sm" />
              </button>
              {getPageNumbers().map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => page !== "…" && setCurrentPage(page)}
                  disabled={page === "…"}
                  className={`min-w-[40px] h-10 rounded-lg font-semibold transition-all ${
                    page === currentPage
                      ? "bg-primary text-white shadow-md"
                      : page === "…"
                      ? "text-gray-400 cursor-default"
                      : "border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <MdOutlineArrowForwardIos className="text-sm" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewBilling && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Billing Details</h2>
              <button onClick={() => setViewBilling(null)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Invoice No:</span><span className="font-semibold">{viewBilling.invoiceNo}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Date:</span><span className="font-semibold">{viewBilling.invoiceDate}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Value:</span><span className="font-semibold">₹{(viewBilling.invoiceValue || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">GST:</span><span className="font-semibold">₹{(viewBilling.invoiceGSTValue || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Total:</span><span className="font-semibold">₹{(viewBilling.invoiceTotalValue || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Transport:</span><span className="font-semibold">₹{(viewBilling.transportAmount || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Status:</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  viewBilling.status === "Completed" ? "bg-green-100 text-green-700" :
                  viewBilling.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {viewBilling.status || "Pending"}
                </span>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setViewBilling(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all">Close</button>
              <button onClick={() => { handleEdit(viewBilling); setViewBilling(null); }} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:shadow-lg transition-all">Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
