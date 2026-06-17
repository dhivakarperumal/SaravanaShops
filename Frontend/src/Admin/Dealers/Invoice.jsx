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
  FaFileInvoice,
  FaSearch,
  FaFilter,
  FaTh,
  FaList,
  FaEye,
} from "react-icons/fa";
import { MdDownload } from "react-icons/md";

const emptyForm = {
  invoiceNo: "",
  invoiceDate: "",
  invoiceValue: "",
  invoiceGSTValue: "",
  invoiceTotalValue: "",
  transportAmount: "",
  billPdfBase64: null,
  billPdfName: "",
};

const formFields = [
  { label: "Invoice Number *", name: "invoiceNo", placeholder: "e.g., INV001" },
  { label: "Invoice Date", name: "invoiceDate", type: "date" },
  { label: "Invoice Value (₹)", name: "invoiceValue", type: "number", placeholder: "e.g., 1000" },
  { label: "GST Value (₹)", name: "invoiceGSTValue", type: "number", placeholder: "e.g., 180" },
  { label: "Total Value (₹)", name: "invoiceTotalValue", type: "number", placeholder: "e.g., 1180" },
  { label: "Transport Amount (₹)", name: "transportAmount", type: "number", placeholder: "e.g., 50" },
];

const Invoice = () => {
  const [invoiceList, setInvoiceList]   = useState([]);
  const [invoiceData, setInvoiceData]   = useState(emptyForm);
  const [editingId, setEditingId]       = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [loading, setLoading]           = useState(false);

  // Toolbar state
  const [searchQuery, setSearchQuery]   = useState("");
  const [viewMode, setViewMode]         = useState("table");
  const [showFilters, setShowFilters]   = useState(false);
  const [filters, setFilters]           = useState({
    dateFrom: "",
    dateTo: "",
    minValue: "",
    maxValue: "",
  });

  // Lock body scroll when filter drawer open
  useEffect(() => {
    document.body.style.overflow = showFilters ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showFilters]);

  // ── Fetch all invoices from MySQL via API ──────────────────────────────────
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/invoices");
      setInvoiceList(res.data.data || []);
    } catch (err) {
      console.error("fetchInvoices error:", err);
      toast.error("Failed to fetch invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  // ── Filter / search ────────────────────────────────────────────────────────
  const displayed = invoiceList.filter((inv) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (inv.invoiceNo || "").toLowerCase().includes(q) ||
      (inv.invoiceDate || "").includes(q);

    const invDate = (inv.invoiceDate || "").slice(0, 10);
    const matchFrom = !filters.dateFrom || invDate >= filters.dateFrom;
    const matchTo   = !filters.dateTo   || invDate <= filters.dateTo;

    const total = parseFloat(inv.invoiceTotalValue) || 0;
    const matchMin = !filters.minValue || total >= parseFloat(filters.minValue);
    const matchMax = !filters.maxValue || total <= parseFloat(filters.maxValue);

    return matchSearch && matchFrom && matchTo && matchMin && matchMax;
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const clearFilters = () =>
    setFilters({ dateFrom: "", dateTo: "", minValue: "", maxValue: "" });

  // ── Form handlers ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData((prev) => {
      const newData = { ...prev, [name]: value };
      
      // Auto-calculate Total Value
      if (['invoiceValue', 'invoiceGSTValue', 'transportAmount'].includes(name)) {
        const val = parseFloat(newData.invoiceValue) || 0;
        const gst = parseFloat(newData.invoiceGSTValue) || 0;
        const transport = parseFloat(newData.transportAmount) || 0;
        newData.invoiceTotalValue = Number((val + gst + transport).toFixed(2)).toString();
      }
      
      return newData;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setInvoiceData((prev) => ({
        ...prev,
        billPdfBase64: reader.result,
        billPdfName: file.name,
      }));
    reader.readAsDataURL(file);
  };

  const resetForm    = () => { setInvoiceData(emptyForm); setEditingId(null); };

  const generateInvoiceNo = () => {
    if (!invoiceList || invoiceList.length === 0) return "INV001";
    let max = 0;
    invoiceList.forEach((inv) => {
      const match = inv.invoiceNo?.match(/^INV(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    });
    return `INV${String(max + 1).padStart(3, "0")}`;
  };

  const openAddModal = () => { 
    resetForm(); 
    setInvoiceData((prev) => ({ ...prev, invoiceNo: generateInvoiceNo() }));
    setShowModal(true); 
  };

  const openEditModal = (inv) => {
    setInvoiceData({
      invoiceNo:         inv.invoiceNo,
      invoiceDate:       (inv.invoiceDate || "").slice(0, 10),
      invoiceValue:      inv.invoiceValue ?? "",
      invoiceGSTValue:   inv.invoiceGSTValue ?? "",
      invoiceTotalValue: inv.invoiceTotalValue ?? "",
      transportAmount:   inv.transportAmount ?? "",
      billPdfBase64:     inv.billPdfBase64 || null,
      billPdfName:       inv.billPdfName || "",
    });
    setEditingId(inv.id);
    setShowModal(true);
  };

  const closeModal = () => { resetForm(); setShowModal(false); };

  // ── Save (create / update) ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceData.invoiceNo) { toast.error("Invoice Number is required."); return; }

    try {
      if (editingId) {
        await api.put(`/invoices/${editingId}`, invoiceData);
        toast.success("Invoice updated!");
      } else {
        await api.post("/invoices", invoiceData);
        toast.success("Invoice added!");
      }
      closeModal();
      fetchInvoices();
    } catch (err) {
      console.error("handleSubmit error:", err);
      toast.error(err?.response?.data?.message || "Failed to save invoice.");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    try {
      await api.delete(`/invoices/${id}`);
      toast.success("Invoice deleted!");
      fetchInvoices();
    } catch (err) {
      console.error("handleDelete error:", err);
      toast.error("Failed to delete invoice.");
    }
  };

  // ── View PDF ───────────────────────────────────────────────────────────────
  const handleViewPdf = (base64) => {
    if (!base64) {
      toast.error("No PDF uploaded for this invoice.");
      return;
    }
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    } else {
      toast.error("Popup blocked. Please allow popups for this site.");
    }
  };

  // ── Export Excel ───────────────────────────────────────────────────────────
  const downloadExcel = () => {
    if (displayed.length === 0) { toast.error("No invoices to export."); return; }
    const rows = displayed.map((inv, i) => ({
      "#":                 i + 1,
      "Invoice No":        inv.invoiceNo,
      "Invoice Date":      (inv.invoiceDate || "").slice(0, 10),
      "Invoice Value (₹)": inv.invoiceValue,
      "GST Value (₹)":     inv.invoiceGSTValue,
      "Transport (₹)":     inv.transportAmount,
      "Total (₹)":         inv.invoiceTotalValue,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), "Invoices.xlsx");
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="px-3 py-8 sm:px-5 lg:px-6 min-h-screen bg-gray-50">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 bg-white rounded-2xl px-3 sm:px-4 py-3 shadow-sm border border-gray-100">

        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(140,82,255,0.12)] transition-all duration-200">
          <FaSearch className="text-gray-400 text-sm flex-shrink-0" />
          <input
            type="text"
            placeholder="Search invoices…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0"
            >✕</button>
          )}
        </div>

        {/* Count */}
        <span className="text-xs sm:text-sm text-gray-500 font-medium hidden sm:block whitespace-nowrap flex-shrink-0">
          {displayed.length} invoice{displayed.length !== 1 ? "s" : ""}
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

          {/* Add New Invoice */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-primary to-secondary text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <FaPlus className="text-xs" />
            <span className="hidden sm:inline">Add New Invoice</span>
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

          {/* Date Range */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Date Range</p>
            <div className="flex flex-col gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Value Range */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Value (₹)</p>
            <div className="flex flex-col gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Min</label>
                <input
                  type="number"
                  placeholder="e.g. 0"
                  value={filters.minValue}
                  onChange={(e) => setFilters((p) => ({ ...p, minValue: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Max</label>
                <input
                  type="number"
                  placeholder="e.g. 100000"
                  value={filters.maxValue}
                  onChange={(e) => setFilters((p) => ({ ...p, maxValue: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
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
              <FaFileInvoice className="text-5xl mb-4 text-gray-200" />
              <p className="text-lg font-semibold text-gray-500">No invoices found</p>
              <p className="text-sm mt-1 text-gray-400">
                {searchQuery || activeFilterCount > 0
                  ? "Try adjusting your search or filters."
                  : 'Click "+ Add New Invoice" to get started.'}
              </p>
            </div>
          )}

          {!loading && displayed.length > 0 && viewMode === "table" && (
            /* ── TABLE ────────────────────────────────────────────────── */
            <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-primary text-white">
                  <tr>
                    {["#", "Invoice No", "Date", "Value (₹)", "GST (₹)", "Transport (₹)", "Total (₹)", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-4 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {displayed.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-gray-400 font-medium">{idx + 1}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-800">{item.invoiceNo}</td>
                      <td className="px-5 py-3.5 text-gray-500">{(item.invoiceDate || "").slice(0, 10)}</td>
                      <td className="px-5 py-3.5 text-gray-700">₹{item.invoiceValue}</td>
                      <td className="px-5 py-3.5 text-gray-700">₹{item.invoiceGSTValue}</td>
                      <td className="px-5 py-3.5 text-gray-700">₹{item.transportAmount}</td>
                      <td className="px-5 py-3.5 font-bold text-green-700">₹{item.invoiceTotalValue}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          {item.billPdfBase64 && (
                            <button
                              onClick={() => handleViewPdf(item.billPdfBase64)}
                              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-400 transition-all cursor-pointer"
                              title="View PDF"
                            >
                              <FaEye className="text-xs" />
                            </button>
                          )}
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
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">#{idx + 1}</p>
                      <p className="font-bold text-gray-800 text-base">{item.invoiceNo}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{(item.invoiceDate || "").slice(0, 10)}</p>
                    </div>
                    <span className="bg-green-50 text-green-700 font-bold text-sm px-3 py-1 rounded-xl border border-green-100">
                      ₹{item.invoiceTotalValue}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                    {[
                      { label: "Value",     value: `₹${item.invoiceValue}` },
                      { label: "GST",       value: `₹${item.invoiceGSTValue}` },
                      { label: "Transport", value: `₹${item.transportAmount}` },
                    ].map((r) => (
                      <div key={r.label} className="bg-gray-50 rounded-xl p-2 text-center">
                        <p className="text-gray-400 mb-0.5">{r.label}</p>
                        <p className="font-semibold text-gray-700">{r.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {item.billPdfBase64 && (
                      <button
                        onClick={() => handleViewPdf(item.billPdfBase64)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-blue-50 hover:border-blue-400 hover:text-blue-500 transition-all cursor-pointer"
                      >
                        <FaEye className="text-xs" /> View
                      </button>
                    )}
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
                  {editingId ? "Edit Invoice" : "Add New Invoice"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the details below</p>
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
                {formFields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type || "text"}
                      name={field.name}
                      placeholder={field.placeholder || ""}
                      value={invoiceData[field.name] || ""}
                      onChange={handleChange}
                      required={field.name === "invoiceNo"}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                ))}

                {/* PDF Upload */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Invoice PDF{" "}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-600 border border-gray-200 rounded-xl px-4 py-2.5 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  {invoiceData.billPdfName && (
                    <p className="text-xs mt-1.5 text-green-700 font-medium">
                      ✓ {invoiceData.billPdfName}
                    </p>
                  )}
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
                  {editingId ? "Update Invoice" : "Save Invoice"}
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

export default Invoice;
