import React, { useState, useEffect } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
  FaUserTie,
  FaSearch,
  FaFilter,
  FaTh,
  FaList,
} from "react-icons/fa";
import { MdDownload } from "react-icons/md";

const emptyForm = {
  dealerName: "",
  gstNumber: "",
  phone: "",
  email: "",
  address: "",
  invoiceNumber: "",
};

const Dealers = () => {
  const [dealersList, setDealersList] = useState([]);
  const [dealerData, setDealerData] = useState(emptyForm);
  const [invoiceOptions, setInvoiceOptions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    invoiceNumber: "",
  });

  // Lock body scroll when filter drawer open
  useEffect(() => {
    document.body.style.overflow = showFilters ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showFilters]);

  // ── Fetch Dealers & Invoices via API ──────────────────────────────────────
  const fetchDealers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/dealers");
      setDealersList(res.data.data || []);
    } catch (err) {
      console.error("fetchDealers error:", err);
      toast.error("Failed to fetch dealers.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceOptions = async () => {
    try {
      const res = await api.get("/invoices");
      const data = (res.data.data || []).map((inv) => inv.invoiceNo);
      setInvoiceOptions(data);
    } catch (err) {
      console.error("Error fetching invoice numbers:", err);
      toast.error("Failed to load invoice numbers.");
    }
  };

  useEffect(() => {
    fetchDealers();
    fetchInvoiceOptions();
  }, []);

  // ── Filter / search ────────────────────────────────────────────────────────
  const displayed = dealersList.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (d.dealerName || "").toLowerCase().includes(q) ||
      (d.gstNumber || "").toLowerCase().includes(q) ||
      (d.phone || "").toLowerCase().includes(q) ||
      (d.dealerId || "").toLowerCase().includes(q);

    const matchInvoice = !filters.invoiceNumber || d.invoiceNumber === filters.invoiceNumber;

    return matchSearch && matchInvoice;
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const clearFilters = () => setFilters({ invoiceNumber: "" });

  // ── Form handlers ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDealerData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setDealerData(emptyForm);
    setEditingId(null);
  };

  const openAddModal = async () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (d) => {
    setDealerData({
      dealerName: d.dealerName || "",
      gstNumber: d.gstNumber || "",
      phone: d.phone || "",
      email: d.email || "",
      address: d.address || "",
      invoiceNumber: d.invoiceNumber || "",
    });
    setEditingId(d.id);
    setShowModal(true);
  };

  const closeModal = () => {
    resetForm();
    setShowModal(false);
  };

  // ── Save (create / update) ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dealerData.dealerName) {
      toast.error("Dealer Name is required.");
      return;
    }

    try {
      if (editingId) {
        await api.put(`/dealers/${editingId}`, dealerData);
        toast.success("Dealer updated successfully!");
      } else {
        await api.post("/dealers", dealerData);
        toast.success("Dealer added successfully!");
      }
      closeModal();
      fetchDealers();
    } catch (err) {
      console.error("handleSubmit error:", err);
      toast.error(err?.response?.data?.message || "Failed to save dealer.");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this dealer?")) return;
    try {
      await api.delete(`/dealers/${id}`);
      toast.success("Dealer deleted!");
      fetchDealers();
    } catch (err) {
      console.error("handleDelete error:", err);
      toast.error("Failed to delete dealer.");
    }
  };

  // ── Export Excel ───────────────────────────────────────────────────────────
  const downloadExcel = () => {
    if (displayed.length === 0) {
      toast.error("No dealers to export.");
      return;
    }
    const rows = displayed.map((d, i) => ({
      "#": i + 1,
      "Dealer ID": d.dealerId,
      "Dealer Name": d.dealerName,
      "GST Number": d.gstNumber,
      "Phone": d.phone,
      "Email": d.email,
      "Address": d.address,
      "Invoice No": d.invoiceNumber,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dealers");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), "Dealers.xlsx");
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="px-3 sm:px-5 lg:px-6 min-h-screen bg-gray-50 py-6">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 bg-white rounded-2xl px-3 sm:px-4 py-3 shadow-sm border border-gray-100">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(140,82,255,0.12)] transition-all duration-200">
          <FaSearch className="text-gray-400 text-sm flex-shrink-0" />
          <input
            type="text"
            placeholder="Search dealers…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0"
            >
              ✕
            </button>
          )}
        </div>

        {/* Count */}
        <span className="text-xs sm:text-sm text-gray-500 font-medium hidden sm:block whitespace-nowrap flex-shrink-0">
          {displayed.length} dealer{displayed.length !== 1 ? "s" : ""}
        </span>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-shrink-0">
          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters((p) => !p)}
            className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-200 cursor-pointer ${
              showFilters
                ? "bg-primary text-white border-primary shadow-md"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
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

          {/* Grid / List toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200">
            <button
              onClick={() => setViewMode("card")}
              title="Card View"
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                viewMode === "card" ? "bg-white shadow text-primary" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <FaTh className="text-xs sm:text-sm" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                viewMode === "table" ? "bg-white shadow text-primary" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <FaList className="text-xs sm:text-sm" />
            </button>
          </div>

          {/* Export Excel */}
          <button
            onClick={downloadExcel}
            title="Download Excel"
            className="hidden sm:flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-gray-200 bg-gray-50 text-gray-600 hover:border-green-500 hover:text-green-600 transition-all duration-200 cursor-pointer"
          >
            <MdDownload className="text-base" />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* Add New Dealer */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-primary to-secondary text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <FaPlus className="text-xs" />
            <span className="hidden sm:inline">Add Dealer</span>
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-4 lg:gap-5 relative">
        {/* Mobile filter overlay */}
        {showFilters && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowFilters(false)}
          />
        )}

        {/* ── Filter Drawer ─────────────────────────────────────────────── */}
        <aside
          className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl border-r border-gray-100 p-5 transition-transform duration-300 ease-in-out overflow-y-auto
            lg:static lg:h-auto lg:shadow-none lg:border lg:rounded-2xl lg:border-gray-100 lg:transition-none
            ${showFilters ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            ${!showFilters ? "lg:hidden" : "lg:block"}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Filters</h3>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-500 font-semibold hover:text-red-700 cursor-pointer"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer lg:hidden"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          </div>

          {/* Invoice Number Filter */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Invoice No.</p>
            <div className="flex flex-col gap-2">
              <select
                value={filters.invoiceNumber}
                onChange={(e) => setFilters((p) => ({ ...p, invoiceNumber: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">All Invoices</option>
                {invoiceOptions.map((inv) => (
                  <option key={inv} value={inv}>
                    {inv}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Loading skeleton */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && displayed.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100">
              <FaUserTie className="text-5xl mb-4 text-gray-200" />
              <p className="text-lg font-semibold text-gray-500">No dealers found</p>
              <p className="text-sm mt-1 text-gray-400">
                {searchQuery || activeFilterCount > 0
                  ? "Try adjusting your search or filters."
                  : 'Click "+ Add Dealer" to get started.'}
              </p>
            </div>
          )}

          {!loading && displayed.length > 0 && viewMode === "table" && (
            /* ── TABLE ────────────────────────────────────────────────── */
            <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-primary text-white">
                  <tr>
                    {["#", "ID", "Name", "GST", "Phone", "Invoice", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-4 font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {displayed.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-gray-400 font-medium">{idx + 1}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-800">{item.dealerId}</td>
                      <td className="px-5 py-3.5 text-gray-800 font-medium">{item.dealerName}</td>
                      <td className="px-5 py-3.5 text-gray-500">{item.gstNumber || "-"}</td>
                      <td className="px-5 py-3.5 text-gray-700">{item.phone || "-"}</td>
                      <td className="px-5 py-3.5 text-gray-700">{item.invoiceNumber || "-"}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-primary hover:border-primary transition-all cursor-pointer"
                            title="Edit"
                          >
                            <FaEdit className="text-xs" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-400 transition-all cursor-pointer"
                            title="Delete"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && displayed.length > 0 && viewMode === "card" && (
            /* ── CARDS ────────────────────────────────────────────────── */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayed.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">#{idx + 1}</p>
                      <p className="font-bold text-gray-800 text-base">{item.dealerName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.dealerId}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4 flex-1">
                    <div className="bg-gray-50 rounded-xl p-2">
                      <p className="text-gray-400 mb-0.5">GST</p>
                      <p className="font-semibold text-gray-700 truncate">{item.gstNumber || "-"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2">
                      <p className="text-gray-400 mb-0.5">Phone</p>
                      <p className="font-semibold text-gray-700 truncate">{item.phone || "-"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2">
                      <p className="text-gray-400 mb-0.5">Email</p>
                      <p className="font-semibold text-gray-700 truncate">{item.email || "-"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2">
                      <p className="text-gray-400 mb-0.5">Invoice</p>
                      <p className="font-semibold text-gray-700 truncate">{item.invoiceNumber || "-"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => openEditModal(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 hover:border-primary hover:text-primary transition-all cursor-pointer"
                    >
                      <FaEdit className="text-xs" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-red-50 hover:border-red-400 hover:text-red-500 transition-all cursor-pointer"
                    >
                      <FaTrash className="text-xs" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ ADD / EDIT MODAL ══════════════════════════════════════════════════ */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div className="absolute inset-0" onClick={closeModal} />
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            style={{ animation: "modalIn 0.22s ease" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-secondary/5 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {editingId ? "Edit Dealer" : "Add New Dealer"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the dealer details below</p>
              </div>
              <button
                onClick={closeModal}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dealer Name *
                  </label>
                  <input
                    type="text"
                    name="dealerName"
                    value={dealerData.dealerName}
                    onChange={handleChange}
                    required
                    placeholder="Enter dealer's name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={dealerData.gstNumber}
                    onChange={handleChange}
                    placeholder="Enter GST number"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={dealerData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={dealerData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={dealerData.address}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Enter full address"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Invoice Number
                  </label>
                  <select
                    name="invoiceNumber"
                    value={dealerData.invoiceNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                  >
                    <option value="">Select invoice number (Optional)</option>
                    {invoiceOptions.map((inv) => (
                      <option key={inv} value={inv}>
                        {inv}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md cursor-pointer"
                >
                  {editingId ? "Update Dealer" : "Save Dealer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Dealers;
