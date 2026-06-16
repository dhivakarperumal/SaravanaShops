import React, { useState, useEffect, useRef } from "react";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import {
  FaEdit, FaTrash, FaPlus, FaSearch, FaTh, FaList,
  FaTimes, FaFilter, FaTag, FaLayerGroup,
} from "react-icons/fa";
import { MdOutlineCategory } from "react-icons/md";
import api from "../../api";

const EMPTY_FORM = { catId: "", cname: "", cdescription: "", cimgs: [], subcategories: [], productType: "Bangles" };

const Category = () => {
  // ── Data ─────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(false);

  // ── Modal ─────────────────────────────────────────────
  const [showModal,   setShowModal]   = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [subcatInput, setSubcatInput] = useState("");
  const [previewImgs, setPreviewImgs] = useState([]);
  const fileRef = useRef(null);

  // ── Toolbar ───────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode,    setViewMode]    = useState("card");
  const [filterOpen,  setFilterOpen]  = useState(false);
  const [filterSub,   setFilterSub]   = useState(""); // filter by subcategory

  // ── Fetch all ─────────────────────────────────────────
  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      if (res.data.success) setCategories(res.data.data);
    } catch {
      toast.error("Failed to load categories.");
    }
  };

  const fetchNextId = async () => {
    try {
      const res = await api.get("/categories/nextid");
      if (res.data.success)
        setForm((prev) => ({ ...prev, catId: res.data.catId }));
    } catch {/* silent */}
  };

  useEffect(() => { fetchCategories(); }, []);

  // ── Open modal for add ────────────────────────────────
  const openAddModal = async () => {
    setForm(EMPTY_FORM);
    setSubcatInput("");
    setPreviewImgs([]);
    setEditId(null);
    await fetchNextId();
    setShowModal(true);
  };

  // ── Open modal for edit ───────────────────────────────
  const openEditModal = (cat) => {
    setForm({
      catId:         cat.catId,
      cname:         cat.cname,
      cdescription:  cat.cdescription,
      cimgs:         cat.cimgs || [],
      subcategories: cat.subcategories || [],
      productType:   cat.productType || "Bangles",
    });
    setSubcatInput("");
    setPreviewImgs(cat.cimgs || []);
    setEditId(cat.id);
    setShowModal(true);
  };

  // ── Close modal ───────────────────────────────────────
  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setPreviewImgs([]);
    setSubcatInput("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Image compress → base64 ───────────────────────────
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    try {
      const compressed = await Promise.all(
        files.map((f) =>
          imageCompression(f, { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true })
        )
      );
      const base64 = await Promise.all(
        compressed.map(
          (f) =>
            new Promise((res, rej) => {
              const reader = new FileReader();
              reader.onload  = () => res(reader.result);
              reader.onerror = rej;
              reader.readAsDataURL(f);
            })
        )
      );
      setForm((prev) => ({ ...prev, cimgs: base64 }));
      setPreviewImgs(base64);
      toast.success("Images ready!");
    } catch {
      toast.error("Failed to process images.");
    }
  };

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cname || !form.cdescription || form.cimgs.length === 0) {
      toast.error("Fill all required fields and upload at least one image.");
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, {
          cname: form.cname, cdescription: form.cdescription,
          cimgs: form.cimgs, subcategories: form.subcategories,
          productType: form.productType,
        });
        toast.success("Category updated!");
      } else {
        await api.post("/categories", form);
        toast.success("Category added!");
      }
      closeModal();
      await fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save category.");
    }
    setLoading(false);
  };

  // ── Delete ────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success("Category deleted.");
      await fetchCategories();
    } catch {
      toast.error("Failed to delete category.");
    }
  };

  // ── Subcategory helpers ───────────────────────────────
  const addSubcat = () => {
    const t = subcatInput.trim();
    if (t && !form.subcategories.includes(t)) {
      setForm((p) => ({ ...p, subcategories: [...p.subcategories, t] }));
      setSubcatInput("");
    }
  };
  const removeSubcat = (s) =>
    setForm((p) => ({ ...p, subcategories: p.subcategories.filter((x) => x !== s) }));

  // ── Filtered list ─────────────────────────────────────
  const allSubcats = [...new Set(categories.flatMap((c) => c.subcategories || []))].filter(Boolean);
  const displayed = categories.filter((cat) => {
    const matchSearch = cat.cname?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterSub ? (cat.subcategories || []).includes(filterSub) : true;
    return matchSearch && matchFilter;
  });

  const activeFilterCount = [filterSub].filter(Boolean).length;

  // ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen  px-3 sm:px-5 lg:px-8 py-2">

      {/* ── Toolbar ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 bg-white rounded-2xl px-3 sm:px-4 py-3 shadow-sm border border-gray-100">

        {/* Search — LEFT */}
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(140,82,255,0.12)] transition-all duration-200">
          <FaSearch className="text-gray-400 text-sm flex-shrink-0" />
          <input
            type="text"
            placeholder="Search categories…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0">✕</button>
          )}
        </div>

        {/* Count */}
        <span className="text-xs sm:text-sm text-gray-500 font-medium hidden sm:block whitespace-nowrap">
          {displayed.length} categor{displayed.length !== 1 ? "ies" : "y"}
        </span>

        {/* RIGHT controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-shrink-0">

          {/* Filter — RIGHT */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen((p) => !p)}
              className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-200 cursor-pointer ${
                filterOpen || activeFilterCount > 0
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
              }`}
            >
              <FaFilter className="text-xs" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter Dropdown */}
            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-gray-100 shadow-2xl z-30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Filter by Subcategory</span>
                  {filterSub && (
                    <button onClick={() => setFilterSub("")} className="text-xs text-red-500 font-semibold hover:text-red-700 cursor-pointer flex items-center gap-1">
                      <FaTimes className="text-[9px]" /> Clear
                    </button>
                  )}
                </div>
                <div className="max-h-52 overflow-y-auto p-2">
                  {allSubcats.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">No subcategories yet</p>
                  ) : (
                    allSubcats.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setFilterSub(s === filterSub ? "" : s); setFilterOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          filterSub === s
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {s}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* View mode */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200">
            <button
              onClick={() => setViewMode("card")} title="Card View"
              className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${viewMode === "card" ? "bg-white shadow text-primary" : "text-gray-400 hover:text-gray-600"}`}
            >
              <FaTh className="text-xs sm:text-sm" />
            </button>
            <button
              onClick={() => setViewMode("table")} title="Table View"
              className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${viewMode === "table" ? "bg-white shadow text-primary" : "text-gray-400 hover:text-gray-600"}`}
            >
              <FaList className="text-xs sm:text-sm" />
            </button>
          </div>

          {/* Add Category */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 sm:gap-2 bg-primary text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:bg-blue-800 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <FaPlus className="text-xs" />
            <span className="hidden sm:inline">Add Category</span>
          </button>
        </div>
      </div>

      {/* ── Click outside to close filter ─────────────── */}
      {filterOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setFilterOpen(false)} />
      )}

      {/* ── Empty State ───────────────────────────────── */}
      {displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <MdOutlineCategory className="text-6xl mb-4 opacity-25" />
          <p className="text-lg font-semibold">No categories found</p>
          <p className="text-sm mt-1">
            {searchQuery || filterSub ? "Try adjusting your search or filter" : "Click \"Add Category\" to create one"}
          </p>
        </div>
      )}

      {/* ── CARD MODE ─────────────────────────────────── */}
      {viewMode === "card" && displayed.length > 0 && (
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayed.map((cat) => (
            <div
              key={cat.id}
              className="group bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 border-gray-200 overflow-hidden hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-primary/40 hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
            >
              {/* Image Section */}
              <div className="relative h-56 bg-gray-100 overflow-hidden">
                {cat.cimgs?.[0] ? (
                  <img
                    src={cat.cimgs[0]}
                    alt={cat.cname}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <MdOutlineCategory className="text-6xl text-gray-200" />
                  </div>
                )}
                
                {/* Floating ID Badge */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm border border-white/20">
                  <span className="text-[10px] font-black text-gray-700 tracking-wider uppercase">{cat.catId}</span>
                </div>

                {/* Floating Product Type Badge */}
                {cat.productType && (
                  <div className="absolute top-3 right-3 bg-primary text-white px-2.5 py-1 rounded-lg shadow-sm border border-white/20">
                    <span className="text-[10px] font-bold tracking-wider uppercase">{cat.productType}</span>
                  </div>
                )}

                {/* Image count badge */}
                {cat.cimgs?.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-white/10">
                    +{cat.cimgs.length - 1}
                  </div>
                )}
                
                {/* Subtle gradient overlay at bottom of image for text contrast if needed */}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Content Section */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-extrabold text-gray-800 text-lg sm:text-xl truncate mb-1.5 group-hover:text-primary transition-colors">
                  {cat.cname}
                </h3>
                
                {cat.cdescription && (
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
                    {cat.cdescription}
                  </p>
                )}

                {/* Subcategories (Pushed down if description is short) */}
                <div className="mt-auto">
                  {cat.subcategories?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {cat.subcategories.slice(0, 3).map((s, i) => (
                        <span key={i} className="bg-gray-50 text-gray-600 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-gray-100">
                          {s}
                        </span>
                      ))}
                      {cat.subcategories.length > 3 && (
                        <span className="bg-primary/5 text-primary text-[11px] font-bold px-2.5 py-1 rounded-md">
                          +{cat.subcategories.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100/80">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-600 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border border-transparent hover:border-green-100"
                    >
                      <FaEdit className="text-sm" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-500 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border border-transparent hover:border-red-100"
                    >
                      <FaTrash className="text-sm" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TABLE MODE ────────────────────────────────── */}
      {viewMode === "table" && displayed.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-4 py-3 text-center font-semibold w-12">S.No</th>
                  <th className="px-4 py-3 text-left font-semibold">Cat ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Image</th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Description</th>
                  <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Subcategories</th>
                  <th className="px-4 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map((cat, idx) => (
                  <tr key={cat.id} className={`hover:bg-primary/5 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3 text-center">
                      <span className="w-7 h-7 inline-flex items-center justify-center bg-primary/10 text-primary text-xs font-bold rounded-full">{idx + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-lg">{cat.catId}</span>
                      {cat.productType && (
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-lg ml-2 block mt-1 w-fit">
                          {cat.productType}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {cat.cimgs?.[0] ? (
                        <img src={cat.cimgs[0]} alt={cat.cname} className="w-12 h-12 object-cover rounded-xl border border-gray-100" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <MdOutlineCategory className="text-gray-300 text-xl" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800 truncate max-w-[140px]">{cat.cname}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{cat.cdescription}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(cat.subcategories || []).slice(0, 2).map((s, i) => (
                          <span key={i} className="bg-gray-100 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                        {cat.subcategories?.length > 2 && (
                          <span className="bg-gray-100 text-gray-400 text-[10px] px-2 py-0.5 rounded-full">+{cat.subcategories.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="w-8 h-8 rounded-lg bg-green-50 text-green-500 hover:bg-green-100 flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <FaEdit className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer"
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          ADD / EDIT POPUP MODAL
      ══════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal Panel */}
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-primary/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md">
                  <MdOutlineCategory className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="font-extrabold text-gray-800 text-base sm:text-lg">
                    {editId ? "Edit Category" : "Add New Category"}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {editId ? "Update category details" : "Fill in details to create a new category"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors cursor-pointer flex-shrink-0"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            {/* Modal Body — scrollable */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* Cat ID */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Category ID
                  </label>
                  <input
                    readOnly
                    value={form.catId}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-100 text-gray-500 text-sm focus:outline-none cursor-not-allowed font-mono"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.cname}
                    onChange={(e) => setForm((p) => ({ ...p, cname: e.target.value }))}
                    required
                    placeholder="e.g. Sarees, Bangles…"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  />
                </div>

                {/* Product Type Dropdown */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Product Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.productType}
                    onChange={(e) => setForm((p) => ({ ...p, productType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all cursor-pointer"
                  >
                    <option value="Bangles">Bangles</option>
                    <option value="Sarees">Sarees</option>
                    <option value="Jewels">Jewels</option>
                  </select>
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.cdescription}
                    onChange={(e) => setForm((p) => ({ ...p, cdescription: e.target.value }))}
                    required
                    placeholder="Write a short description about this category..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none"
                  />
                </div>

                {/* Subcategories */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Subcategories
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <FaTag className="text-gray-300 text-xs flex-shrink-0" />
                      <input
                        type="text"
                        value={subcatInput}
                        onChange={(e) => setSubcatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubcat())}
                        placeholder="Type & press Enter or Add…"
                        className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addSubcat}
                      className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition cursor-pointer flex-shrink-0"
                    >
                      Add
                    </button>
                  </div>
                  {form.subcategories.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {form.subcategories.map((s, i) => (
                        <span key={i} className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/20">
                          {s}
                          <button
                            type="button"
                            onClick={() => removeSubcat(s)}
                            className="text-primary/60 hover:text-red-500 transition-colors cursor-pointer leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Images */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Upload Images <span className="text-red-500">*</span>
                    {editId && <span className="text-gray-400 font-normal normal-case ml-1">(leave empty to keep existing)</span>}
                  </label>

                  {/* Dropzone-style file input */}
                  <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-xl p-5 cursor-pointer hover:border-primary hover:bg-primary/3 transition-all group">
                    <FaLayerGroup className="text-3xl text-gray-300 group-hover:text-primary/50 mb-2 transition-colors" />
                    <p className="text-sm font-semibold text-gray-500 group-hover:text-primary transition-colors">
                      Click to upload images
                    </p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP (auto-compressed)</p>
                    <input
                      ref={fileRef}
                      id="cimgs"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      required={!editId && form.cimgs.length === 0}
                      className="hidden"
                    />
                  </label>

                  {/* Previews */}
                  {previewImgs.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {previewImgs.map((img, i) => (
                        <div key={i} className="relative group/img">
                          <img
                            src={img}
                            alt={`preview-${i}`}
                            className="h-24 w-full object-cover rounded-xl border border-gray-200 shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = previewImgs.filter((_, idx) => idx !== i);
                              setPreviewImgs(updated);
                              setForm((p) => ({ ...p, cimgs: updated }));
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] items-center justify-center hidden group-hover/img:flex cursor-pointer shadow"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-primary text-white hover:bg-blue-800 rounded-xl font-semibold text-sm shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                >
                  {loading
                    ? (editId ? "Updating…" : "Adding…")
                    : (editId ? "Update Category" : "Add Category")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Category;
