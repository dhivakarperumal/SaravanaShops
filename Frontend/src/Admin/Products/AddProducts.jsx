import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import api from "../../api";
import toast from "react-hot-toast";
import { FaTrash, FaTimes } from "react-icons/fa";

const MAX_FILE_SIZE = 2 * 1024 * 1024; 
const MAX_IMAGE_SIZE = 1080; 


export default function AddProducts() {
  const location = useLocation();
  const initialData = location.state?.product || null;
  const navigate = useNavigate();

  const productDocId = initialData?.id ?? null;
  const existingProductId = initialData?.productId ?? null;
  const productId = initialData?.id || null;

  const [productType, setProductType] = useState("Bangles");
  const [categories, setCategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const fileInputRefs = {
    Bangles: useRef(null),
    Sarees: useRef(null),
    Jewels: useRef(null),
  };

  const [form, setForm] = useState({
    name: "",
    description: "",
    notes: "",
    mrp: "",
    offer: "",
    sellingprice: "",
    rating: "",
    category: "",
    subcategory: "",
    sellingpriceManually: false,
  });

  // BANGLES
  const [banglesCountType, setBanglesCountType] = useState("SingleColor");
  const [banglesColorTable, setBanglesColorTable] = useState([{ id: 1, color: "", size: [], stock: {}, images: [], productName: "" }]);
  const [banglesMultiImages, setBanglesMultiImages] = useState([]);
  const [banglesStock, setBanglesStock] = useState("");

  // SAREES
  const [sareeFabricType, setSareeFabricType] = useState("");
  const [sareeBlouseAvailable, setSareeBlouseAvailable] = useState("No");
  const [sareeImages, setSareeImages] = useState([]);
  const [sareeStock, setSareeStock] = useState("");

  // JEWELS
  const [jewelListItems, setJewelListItems] = useState([""]);
  const [jewelImages, setJewelImages] = useState([]);
  const [jewelStock, setJewelStock] = useState("");

  const bangleSizes = [2.2, 2.4, 2.6, 2.8, 2.10, 2.12];

  const ensureFlatArray = (val) => {
    if (val == null) return [];
    if (!Array.isArray(val)) return [val];
    return val.some(Array.isArray) ? val.flat() : val;
  };

  const uploadToGoDaddy = async (files, category = productType) => {
    // Accept array of File or Blob; ensure we append File objects with names
    const formData = new FormData();
    const arr = Array.isArray(files) ? files : [files];

    arr.forEach((file, idx) => {
      // If it's already a File use it, otherwise wrap Blob into File preserving a filename if present
      if (file instanceof File) {
        formData.append("files[]", file, file.name || `upload_${Date.now()}_${idx}.jpg`);
      } else {
        const filename = file && file.name ? file.name : `upload_${Date.now()}_${idx}.jpg`;
        try {
          const f = new File([file], filename, { type: file.type || "image/jpeg" });
          formData.append("files[]", f, filename);
        } catch (e) {
          // If File constructor not available, fallback to append blob (server may still accept it)
          formData.append("files[]", file);
        }
      }
    });

    // optional category for server-side organization
    if (category) formData.append("category", category);

    try {
      const controller = new AbortController();
      // increase timeout to 30s to allow larger uploads
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch("https://saravanashoppings.com/api/upload.php", {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Upload failed ${res.status} ${res.statusText} ${txt}`);
      }

      // handle non-JSON responses safely
      const data = await res.json().catch((e) => {
        throw new Error("Invalid JSON response from upload endpoint");
      });

      if (data && data.success) {
        // support different possible keys returned by server
        return data.urls || data.data || data.files || [];
      }
      throw new Error(data?.error || "Upload failed");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Image upload failed or took too long");
      return [];
    }
  };


  // -------- Generate Product ID (SKU)
  const generateProductId = async () => {
    try {
      const res = await api.get("/products/nextid");
      if (res.data.success) return res.data.productId;
      throw new Error("Failed to get next ID");
    } catch (err) {
      console.error("Error generating product ID:", err);
      return `SP${Date.now().toString().slice(-3)}`;
    }
  };

  // -------- Fetch Categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching categories", err);
      }
    };
    fetchCategories();
  }, []);

  // -------- Compress and Convert to Base64
  const compressAndConvertToBase64 = async (file) => {
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: MAX_FILE_SIZE,
        maxWidthOrHeight: MAX_IMAGE_SIZE,
        useWebWorker: true,
        initialQuality: 1.0,
      });
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
      });
    } catch (err) {
      console.error("Compression error:", err);
      toast.error("Image compression failed");
      return null;
    }
  };

  // NEW: small wrapper used by single-file inputs (returns uploaded url or null)
  const compressAndUpload = async (file) => {
    try {
      // compress
      const compressedBlob = await imageCompression(file, {
        maxSizeMB: MAX_FILE_SIZE,
        maxWidthOrHeight: MAX_IMAGE_SIZE,
        useWebWorker: true,
        initialQuality: 0.7,
      });

      // wrap into File preserving original name
      const filename = file.name || `img_${Date.now()}.jpg`;
      const compressedFile = new File([compressedBlob], filename, {
        type: compressedBlob.type || file.type || "image/jpeg",
      });

      // upload
      const urls = await uploadToGoDaddy([compressedFile]);
      return urls[0] || null;
    } catch (err) {
      console.error("compressAndUpload error:", err);
      toast.error("Failed to process image");
      return null;
    }
  };

  const handleFiles = async (e, type) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    toast.loading(`Compressing ${files.length} image(s)...`);

    try {
      // Compress all files in parallel
      const compressedBlobs = await Promise.all(
        files.map((file) =>
          imageCompression(file, {
            maxSizeMB: MAX_FILE_SIZE,
            maxWidthOrHeight: MAX_IMAGE_SIZE,
            useWebWorker: true,
            initialQuality: 1.0,
          })
        )
      );

      // Wrap compressed blobs into File objects preserving original filenames
      const compressedFiles = compressedBlobs.map((blob, idx) => {
        const original = files[idx];
        const filename = original?.name || `img_${Date.now()}_${idx}.jpg`;
        try {
          return new File([blob], filename, { type: blob.type || original.type || "image/jpeg" });
        } catch (e) {
          // fallback if File constructor not available
          return blob;
        }
      });

      toast.dismiss();
      toast.loading(`Uploading ${compressedFiles.length} image(s)...`);

      // Upload all compressed images at once
      const urls = await uploadToGoDaddy(compressedFiles, type);

      if (urls.length > 0) {
        if (type === "Bangles") setBanglesMultiImages((p) => [...p, ...urls]);
        if (type === "Sarees") setSareeImages((p) => [...p, ...urls]);
        if (type === "Jewels") setJewelImages((p) => [...p, ...urls]);
        toast.success(`Uploaded ${urls.length} image(s) successfully`);
      } else {
        toast.error("No image URLs returned");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload images");
    } finally {
      toast.dismiss();
      // clear input so same files can be selected again
      try {
        e.target.value = "";
      } catch (_) {}
    }
  };


  const removeImage = (idx, type) => {
    if (type === "Bangles")
      setBanglesMultiImages((p) => p.filter((_, i) => i !== idx));
    if (type === "Sarees")
      setSareeImages((p) => p.filter((_, i) => i !== idx));
    if (type === "Jewels")
      setJewelImages((p) => p.filter((_, i) => i !== idx));
  };

  const handleCategoryChange = (e) => {
    const selected = e.target.value;
    setForm((prev) => ({ ...prev, category: selected, subcategory: "" }));
    const selectedCat = categories.find(
      (c) => c.cname === selected || c.name === selected
    );
    setFilteredSubcategories(
      selectedCat?.subcategories && Array.isArray(selectedCat.subcategories)
        ? selectedCat.subcategories
        : []
    );
  };

  const calcsellingprice = (mrp, offer) => {
    const m = parseFloat(mrp);
    const o = parseFloat(offer);
    if (isNaN(m) || isNaN(o)) return "";
    return (m - (m * o) / 100).toFixed(2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if ((name === "mrp" || name === "offer") && !prev.sellingpriceManually) {
        next.sellingprice = calcsellingprice(
          name === "mrp" ? value : prev.mrp,
          name === "offer" ? value : prev.offer
        );
      }
      return next;
    });
  };

  const handleSellingPriceChange = (e) => {
    const { value } = e.target;
    setForm((prev) => ({
      ...prev,
      sellingprice: value,
      sellingpriceManually: true,
    }));
  };

  const handleBangleSizeChange = (rowId, size) => {
    const sStr = String(size);
    setBanglesColorTable((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const has = (r.size || []).includes(sStr);
        const newSizes = has ? (r.size || []).filter((s) => String(s) !== sStr) : [...(r.size || []).map(String), sStr];
        const newStock = { ...r.stock };
        if (has) delete newStock[sStr];
        else newStock[sStr] = "";
        return { ...r, size: newSizes, stock: newStock };
      })
    );
  };

  const handleBangleStockChange = (rowId, size, value) => {
    setBanglesColorTable((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, stock: { ...r.stock, [size]: value } } : r
      )
    );
  };

  const handleAddBangleRow = () => {
    setBanglesColorTable((prev) => [
      ...prev,
      { id: prev.length + 1, color: "", size: [], stock: {}, images: [], productName: "" },
    ]);
  };

  // -------- Prefill effect: ensure we capture the Firestore document id for updates
  useEffect(() => {
    if (!initialData || categories.length === 0) return;

    // populate form fields
    setProductType(initialData.productType || "Bangles");
    setForm((prev) => ({ ...prev, ...initialData }));

    // if the passed initialData doesn't include the id,
    // attempt to lookup the document by productId (SKU) to set productDocId
    (async () => {
      try {
        if (!initialData.id && initialData.productId) {
          const res = await api.get("/products");
          if (res.data.success) {
            const foundDoc = res.data.data.find(p => p.productId === initialData.productId);
            if (foundDoc) {
              setForm((prev) => ({ ...prev, id: foundDoc.id }));
            }
          }
        } else if (initialData.id) {
          // ensure form.id is set to the doc id if provided
          setForm((prev) => ({ ...prev, id: initialData.id }));
        }
      } catch (err) {
        console.warn("Prefill lookup failed:", err);
      }
    })();

    // Set filtered subcategories based on category
    const selectedCat = categories.find(
      (c) => c.cname === initialData.category || c.name === initialData.category
    );
    if (selectedCat?.subcategories && Array.isArray(selectedCat.subcategories)) {
      setFilteredSubcategories(selectedCat.subcategories);
    }

    // Prefill product-type specific data
    if (initialData.productType === "Bangles") {
      setBanglesCountType(initialData.count || "SingleColor");

      // SingleColor: restore colors table with sizes and stock
        if (initialData.count === "SingleColor" && Array.isArray(initialData.colors)) {
        const restoreColorTable = initialData.colors.map((color, idx) => ({
          id: idx + 1,
          color: color.color || "#ffffff",
          size: Array.isArray(color.size) ? color.size.map(s => String(s)) : [],
          stock: color.stock && typeof color.stock === "object" 
            ? Object.fromEntries(
                Object.entries(color.stock).map(([k, v]) => [String(k), v])
              )
            : {},
          images: Array.isArray(color.images) ? color.images : (color.image ? [color.image] : []),
          productName: color.productName || "",
        }));
        setBanglesColorTable(restoreColorTable);
      } else if (initialData.count === "MultiColor") {
        // MultiColor: restore multi images and stock
        if (Array.isArray(initialData.images)) {
          setBanglesMultiImages(initialData.images);
        }
        setBanglesStock(initialData.stock || "");
      }
    }

    if (initialData.productType === "Sarees") {
      setSareeFabricType(initialData.fabricdetails?.[0] || "");
      setSareeBlouseAvailable(initialData.fabricdetails?.[1] || "No");
      if (Array.isArray(initialData.images)) {
        setSareeImages(initialData.images);
      }
      setSareeStock(initialData.stock || "");
    }

    if (initialData.productType === "Jewels") {
      setJewelListItems(Array.isArray(initialData.list_of_items) ? initialData.list_of_items : [""]);
      if (Array.isArray(initialData.images)) {
        setJewelImages(initialData.images);
      }
      setJewelStock(initialData.stock || "");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, categories]);

  // -------- Submit
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // basic validation
      if (!form.name || !form.category) {
        toast.error("Please provide product name and category");
        setLoading(false);
        return;
      }

      // determine SKU
      const finalProductId =
        (form.productId && String(form.productId).trim()) ||
        existingProductId ||
        (await generateProductId());

      const data = {
        ...form,
        productType,
        productId: finalProductId,
        id: form.id || finalProductId, // ensure we have an id to reference
      };

      // product-type specific mapping (convert stocks etc.)
      if (productType === "Bangles") {
        data.count = banglesCountType;
        if (banglesCountType === "SingleColor") {
          data.colors = banglesColorTable.map((row) => ({
            ...row,
            stock: Object.fromEntries(
              Object.entries(row.stock || {}).map(([size, val]) => [size, Number(val) || 0])
            ),
          }));
        } else {
          data.images = ensureFlatArray(banglesMultiImages);
          data.stock = Number(banglesStock) || 0;
        }
      }
      if (productType === "Sarees") {
        data.fabricdetails = [sareeFabricType, sareeBlouseAvailable];
        data.images = ensureFlatArray(sareeImages);
        data.stock = Number(sareeStock) || 0;
      }
      if (productType === "Jewels") {
        data.list_of_items = jewelListItems;
        data.images = ensureFlatArray(jewelImages);
        data.stock = Number(jewelStock) || 0;
      }

      // Determine document to update/create
      let targetDocId = form.id || null;
      if (!targetDocId) {
        // try lookup by productId
        try {
          const res = await api.get("/products");
          if (res.data.success) {
            const foundDoc = res.data.data.find(p => p.productId === finalProductId);
            if (foundDoc) {
              targetDocId = foundDoc.id;
            }
          }
        } catch (err) {
          console.warn("Lookup by SKU failed:", err);
        }
      }

      if (targetDocId) {
        // update
        await api.put(`/products/${targetDocId}`, data);
        toast.success("Product updated successfully");
      } else {
        // create
        await api.post("/products", data);
        toast.success("Product saved successfully");
      }

      // Reset form state
      setForm({
        name: "",
        description: "",
        notes: "",
        mrp: "",
        offer: "",
        sellingprice: "",
        rating: "",
        category: "",
        subcategory: "",
        sellingpriceManually: false,
        id: "",
        productId: "",
      });
      setBanglesColorTable([]);
      setBanglesMultiImages([]);
      setSareeImages([]);
      setJewelImages([]);
      setJewelListItems([""]);
      setSareeFabricType("");
      setSareeBlouseAvailable("No");
      setSareeStock("");
      setJewelStock("");

      navigate("/superadmin/allproducts");
    } catch (err) {
      console.error("Save error:", err);
      toast.error(`Error saving product: ${err?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">
            {productId ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {productId ? "Update product details and pricing" : "Fill in the details to list a new product in the catalog"}
          </p>
        </div>
        <button
          onClick={() => navigate("/superadmin/allproducts")}
          className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:text-gray-800 transition shadow-sm cursor-pointer w-fit"
        >
          Cancel
        </button>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Basic Details Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50/80 border-b border-gray-100 px-6 sm:px-8 py-4">
            <h2 className="text-base font-bold text-gray-800">1. Basic Details</h2>
          </div>
          
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Product Type */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Product Type <span className="text-red-500">*</span>
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all cursor-pointer"
              >
                <option value="Bangles">Bangles</option>
                <option value="Sarees">Sarees</option>
                <option value="Jewels">Jewels</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleCategoryChange}
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all cursor-pointer"
              >
                <option value="">Select Category</option>
                {categories
                  .filter(c => c.productType === productType || !c.productType)
                  .map((c) => (
                    <option key={c.id} value={c.cname || c.name}>
                      {c.cname || c.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Subcategory
              </label>
              <select
                value={form.subcategory}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, subcategory: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all cursor-pointer"
              >
                <option value="">Select Subcategory</option>
                {filteredSubcategories.map((s, idx) => (
                  <option key={idx} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Red Silk Saree"
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Product description..."
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Additional notes..."
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50/80 border-b border-gray-100 px-6 sm:px-8 py-4">
            <h2 className="text-base font-bold text-gray-800">2. Pricing & Rating</h2>
          </div>
          
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                MRP (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="mrp"
                value={form.mrp}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Offer (%)
              </label>
              <input
                type="number"
                name="offer"
                value={form.offer}
                onChange={handleChange}
                placeholder="e.g. 15"
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Selling Price (₹)
              </label>
              <input
                type="number"
                value={form.sellingprice}
                onChange={handleSellingPriceChange}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-green-50/50 font-bold text-green-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Rating
              </label>
              <input
                type="number"
                name="rating"
                step="0.1"
                min="0"
                max="5"
                value={form.rating}
                onChange={handleChange}
                placeholder="4.5"
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>
      {/* BANGLES */}
      {productType === "Bangles" && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50/80 border-b border-gray-100 px-6 sm:px-8 py-4">
            <h2 className="text-base font-bold text-gray-800">3. Bangles Specifics</h2>
          </div>
          
          <div className="p-6 sm:p-8">
            <div className="mb-6 max-w-sm">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Count Type
              </label>
              <select
                value={banglesCountType}
                onChange={(e) => setBanglesCountType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all cursor-pointer"
              >
                <option value="SingleColor">Single Color</option>
                <option value="MultiColor">Multi Color</option>
              </select>
            </div>

            {/* Single Color Table */}
            {banglesCountType === "SingleColor" && (
              <div>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
                  <span>Colors & Stock Inventory</span>
                  <button
                    type="button"
                    onClick={handleAddBangleRow}
                    className="px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-md hover:bg-primary hover:text-white transition-all cursor-pointer"
                  >
                    + Add New Color
                  </button>
                </h3>

              {/* Desktop Table */}
              <div className="hidden sm:block bg-white shadow rounded-2xl overflow-x-auto">
                <table className="min-w-full table-fixed text-sm rounded-lg overflow-hidden">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="px-3 py-4 w-24">Color</th>
                      <th className="px-3 py-4 w-48">Product Name</th>
                      <th className="px-3 py-4 w-56">Sizes</th>
                   
                      <th className="px-3 py-4 w-40">Image</th>
                      
                      <th className="px-3 py-4 w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banglesColorTable.map((row) => (
                      <tr key={row.id}>
                        <td className="border border-gray-200  p-2 align-middle">
                          <input
                            type="color"
                            value={row.color || "#ffffff"}
                            onChange={(e) =>
                              setBanglesColorTable((prev) =>
                                prev.map((r) =>
                                  r.id === row.id
                                    ? { ...r, color: e.target.value }
                                    : r
                                )
                              )
                            }
                            className="w-16 h-8 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="border border-gray-300 p-2 align-middle">
                          <input
                            type="text"
                            value={row.productName || ""}
                            onChange={(e) =>
                              setBanglesColorTable((prev) =>
                                prev.map((r) =>
                                  r.id === row.id ? { ...r, productName: e.target.value } : r
                                )
                              )
                            }
                            className="w-full border border-gray-300 rounded px-2 py-1"
                          />
                        </td>
                        <td className="border border-gray-300 p-2 flex flex-wrap gap-1 align-top">
                          {bangleSizes.map((s) => (
                            <label key={s} className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={row.size.includes(String(s))}
                                onChange={() => handleBangleSizeChange(row.id, s)}
                              />{" "}
                              {s}
                            </label>
                          ))}
                        </td>
                        <td className="border border-gray-300 p-2 flex flex-wrap gap-1">
                          {row.size.map((s) => (
                            <input
                              key={s}
                              type="number"
                              placeholder={`${s} stock`}
                              value={row.stock[s] || ""}
                              onChange={(e) =>
                                handleBangleStockChange(
                                  row.id,
                                  s,
                                  e.target.value
                                )
                              }
                              className="border border-gray-300 p-1 w-16"
                            />
                          ))}
                        </td>
                        <td className="border border-gray-300 p-2 align-middle">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={async (e) => {
                              const files = Array.from(e.target.files);
                              if (!files.length) return;
                              const urls = await Promise.all(files.map(f => compressAndUpload(f)));
                              setBanglesColorTable((prev) =>
                                prev.map((r) =>
                                  r.id === row.id ? { ...r, images: [...(r.images || []), ...urls] } : r
                                )
                              );
                            }}
                          />
                          <div className="flex flex-wrap gap-2 mt-2">
                            {row.images && row.images.map((img, idx) => (
                              <div key={idx} className="relative group">
                                <img
                                  src={img}
                                  alt="bangle"
                                  className="w-16 h-16 object-cover rounded"
                                />
                                <button
                                  type="button"
                                  onClick={() => setBanglesColorTable((prev) =>
                                    prev.map((r) =>
                                      r.id === row.id ? { ...r, images: r.images.filter((_, i) => i !== idx) } : r
                                    )
                                  )}
                                  className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer"
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            ))}
                          </div>
                        </td>
                        
                        <td className="border text-center border-gray-300 p-2 align-middle">
                          <button
                            type="button"
                            onClick={() =>
                              setBanglesColorTable((prev) =>
                                prev.filter((r) => r.id !== row.id)
                              )
                            }
                            className="px-2 py-2 cursor-pointer text-center bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            <FaTrash/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
    <div className="md:hidden flex flex-col gap-2">
                {banglesColorTable.map((row) => (
                  <div
                    key={row.id}
                    className="border rounded p-2 shadow flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Color</span>
                      <input
                        type="color"
                        value={row.color || "#ffffff"}
                        onChange={(e) =>
                          setBanglesColorTable((prev) =>
                            prev.map((r) =>
                              r.id === row.id
                                ? { ...r, color: e.target.value }
                                : r
                            )
                          )
                        }
                        className="w-16 h-8 border rounded"
                      />
                    </div>

                    <div>
                      <span className="font-semibold">Product Name:</span>
                      <input
                        type="text"
                        value={row.productName || ""}
                        onChange={(e) =>
                          setBanglesColorTable((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, productName: e.target.value } : r
                            )
                          )
                        }
                        className="w-full border rounded px-2 py-1 mt-1"
                      />
                    </div>

                    <div>
                      <span className="font-semibold">Sizes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {bangleSizes.map((s) => (
                          <label key={s} className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={row.size.includes(String(s))}
                              onChange={() => handleBangleSizeChange(row.id, s)}
                            />{" "}
                            {s}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold">Stock:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {row.size.map((s) => (
                          <input
                            key={s}
                            type="number"
                            placeholder={`${s} stock`}
                            value={row.stock[s] || ""}
                            onChange={(e) =>
                              handleBangleStockChange(row.id, s, e.target.value)
                            }
                            className="border p-1 w-16"
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold">Image:</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={async (e) => {
                          const files = Array.from(e.target.files);
                          if (!files.length) return;
                          const urls = await Promise.all(files.map(f => compressAndUpload(f)));
                          setBanglesColorTable((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, images: [...(r.images || []), ...urls] } : r
                            )
                          );
                        }}
                        className="mt-1"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {row.images && row.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={img}
                              alt="bangle"
                              className="w-24 h-24 object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => setBanglesColorTable((prev) =>
                                prev.map((r) =>
                                  r.id === row.id ? { ...r, images: r.images.filter((_, i) => i !== idx) } : r
                                )
                              )}
                              className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer text-xl"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setBanglesColorTable((prev) =>
                          prev.filter((r) => r.id !== row.id)
                        )
                      }
                      className="px-3 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all mt-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end md:hidden">
                <button
                  type="button"
                  onClick={handleAddBangleRow}
                  className="px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-xl hover:bg-primary hover:text-white transition-all cursor-pointer"
                >
                  + Add New Color
                </button>
              </div>
            </div>
            )}

            {/* Multi Color */}
            {banglesCountType === "MultiColor" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Upload Images
                  </label>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRefs.Bangles}
                    onChange={(e) => handleFiles(e, "Bangles")}
                    className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all cursor-pointer"
                  />
                  <div className="flex gap-3 flex-wrap mt-4">
                    {banglesMultiImages.map((img, idx) => (
                      <div key={idx} className="relative group rounded-md overflow-hidden shadow-sm border border-gray-100">
                        <img
                          src={img}
                          alt="bangle"
                          className="w-24 h-24 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx, "Bangles")}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xl cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Total Stock
                  </label>
                  <input
                    type="number"
                    value={banglesStock}
                    onChange={(e) => setBanglesStock(Number(e.target.value))}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SAREES */}
      {productType === "Sarees" && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50/80 border-b border-gray-100 px-6 sm:px-8 py-4">
            <h2 className="text-base font-bold text-gray-800">3. Saree Specifics</h2>
          </div>
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Fabric Type</label>
              <input
                type="text"
                value={sareeFabricType}
                onChange={(e) => setSareeFabricType(e.target.value)}
                placeholder="e.g. Silk, Cotton"
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Blouse Available</label>
              <select
                value={sareeBlouseAvailable}
                onChange={(e) => setSareeBlouseAvailable(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all cursor-pointer"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Upload Images</label>
              <input
                type="file"
                multiple
                ref={fileInputRefs.Sarees}
                onChange={(e) => handleFiles(e, "Sarees")}
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all cursor-pointer"
              />
              <div className="flex gap-3 flex-wrap mt-4">
                {sareeImages.map((img, idx) => (
                  <div key={idx} className="relative group rounded-md overflow-hidden shadow-sm border border-gray-100">
                    <img src={img} alt="saree" className="w-24 h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx, "Sarees")}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xl cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Total Stock</label>
              <input
                type="number"
                value={sareeStock}
                onChange={(e) => setSareeStock(Number(e.target.value))}
                placeholder="0"
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* JEWELS */}
      {productType === "Jewels" && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50/80 border-b border-gray-100 px-6 sm:px-8 py-4">
            <h2 className="text-base font-bold text-gray-800">3. Jewelry Specifics</h2>
          </div>
          <div className="p-6 sm:p-8 space-y-6">
            
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3 flex items-center justify-between">
                <span>Items Included</span>
                <button
                  type="button"
                  onClick={() => setJewelListItems((prev) => [...prev, ""])}
                  className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all cursor-pointer"
                >
                  + Add Item
                </button>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {jewelListItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) =>
                        setJewelListItems((prev) =>
                          prev.map((v, i) => (i === idx ? e.target.value : v))
                        )
                      }
                      placeholder={`Item ${idx + 1} (e.g. Necklace)`}
                      className="flex-1 border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                    />
                    {jewelListItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setJewelListItems(prev => prev.filter((_, i) => i !== idx))}
                        className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all cursor-pointer shrink-0"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Upload Images</label>
                <input
                  type="file"
                  multiple
                  ref={fileInputRefs.Jewels}
                  onChange={(e) => handleFiles(e, "Jewels")}
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all cursor-pointer"
                />
                <div className="flex gap-3 flex-wrap mt-4">
                  {jewelImages.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden shadow-sm border border-gray-100">
                      <img src={img} alt="jewel" className="w-24 h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx, "Jewels")}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xl cursor-pointer"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Total Stock</label>
                <input
                  type="number"
                  value={jewelStock}
                  onChange={(e) => setJewelStock(Number(e.target.value))}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Section */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4">
        <button
          onClick={() => navigate("/superadmin/allproducts")}
          className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full sm:w-auto px-10 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save Product"}
        </button>
      </div>
      
      </div>
    </div>
  );
}