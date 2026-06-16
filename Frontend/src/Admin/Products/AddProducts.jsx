import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import api from "../../api";
import toast from "react-hot-toast";
import { FaTrash } from "react-icons/fa";

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
  const [banglesColorTable, setBanglesColorTable] = useState([]);
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
      { id: prev.length + 1, color: "", size: [], stock: {}, image: null, productName: "" },
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
          image: color.image || null,
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
    <div className="p-6 bg-white shadow">
      <h1 className="text-2xl font-bold mb-4">
        {productId ? "Edit" : "Add"} Product
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Type */}
        <div className="mb-4">
          <label>Product Type:</label>
          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer"
          >
            <option value="Bangles">Bangles</option>
            <option value="Sarees">Sarees</option>
            <option value="Jewels">Jewels</option>
          </select>
        </div>

        {/* Category */}
        <div className="mb-4">
          <label>Category:</label>
          <select
            name="category"
            value={form.category}
            onChange={handleCategoryChange}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer"
          >
            <option value="">Select Category</option>
            {categories
              .filter(c => c.productType === productType || !c.productType) // Fallback for old unassigned categories if any
              .map((c) => (
                <option key={c.id} value={c.cname || c.name}>
                  {c.cname || c.name}
                </option>
              ))}
          </select>
        </div>

        {/* Subcategory */}
        <div className="mb-4">
          <label>Subcategory:</label>
          <select
            value={form.subcategory}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, subcategory: e.target.value }))
            }
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer"
          >
            <option value="">Select Subcategory</option>
            {filteredSubcategories.map((s, idx) => (
              <option key={idx} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Name, Description, Notes, Rating, Price fields */}
        <div className="mb-4">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer"
          />
        </div>

        <div className="mb-4">
          <label>Description:</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer"
          />
        </div>

        <div className="mb-4">
          <label>Notes:</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer"
          />
        </div>

        <div className="mb-4">
          <label>Rating:</label>
          <input
            type="number"
            name="rating"
            value={form.rating}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer"
          />
        </div>

        <div className="mb-4">
          <label>MRP:</label>
          <input
            type="number"
            name="mrp"
            value={form.mrp}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer"
          />
        </div>

        <div className="mb-4">
          <label>Offer (%):</label>
          <input
            type="number"
            name="offer"
            value={form.offer}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer"
          />
        </div>

        <div className="mb-4">
          <label>Selling Price:</label>
          <input
            type="number"
            value={form.sellingprice}
            onChange={handleSellingPriceChange}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer"
          />
        </div>
      </div>
      {/* BANGLES */}
      {productType === "Bangles" && (
        <div className="border border-gray-300 p-4 rounded mb-4">
          <label>Count Type:</label>
          <select
            value={banglesCountType}
            onChange={(e) => setBanglesCountType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer mb-2"
          >
            <option value="SingleColor">Single Color</option>
            <option value="MultiColor">Multi Color</option>
          </select>

          {/* Single Color Table */}
          {banglesCountType === "SingleColor" && (
            <div>
              <h2 className="font-semibold mb-2">Colors Table</h2>

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
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              const url = await compressAndUpload(file);
                              setBanglesColorTable((prev) =>
                                prev.map((r) =>
                                  r.id === row.id ? { ...r, image: url } : r
                                )
                              );
                            }}
                          />
                          {row.image && (
                            <img
                              src={row.image}
                              alt="bangle"
                              className="w-16 h-16 object-cover mt-1"
                            />
                          )}
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
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const url = await compressAndUpload(file);
                          setBanglesColorTable((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, image: url } : r
                            )
                          );
                        }}
                        className="mt-1"
                      />
                      {row.image && (
                        <img
                          src={row.image}
                          alt="bangle"
                          className="w-24 h-24 object-cover mt-1"
                        />
                      )}
                    </div>

                    

                    <button
                      type="button"
                      onClick={() =>
                        setBanglesColorTable((prev) =>
                          prev.filter((r) => r.id !== row.id)
                        )
                      }
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 mt-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>



              <button
                type="button"
                onClick={handleAddBangleRow}
                className="px-3 py-1 bg-primary text-white cursor-pointer rounded hover:bg-primary/80 mt-2"
              >
                Add Row
              </button>
            </div>
          )}

          {/* Multi Color */}
          {banglesCountType === "MultiColor" && (
            <div>
              <label>Upload Images:</label>
              <input
                type="file"
                multiple
                ref={fileInputRefs.Bangles}
                onChange={(e) => handleFiles(e, "Bangles")}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer mb-2"
              />
              <div className="flex gap-2 flex-wrap mb-2">
                {banglesMultiImages.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img}
                      alt="bangle"
                      className="w-24 h-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx, "Bangles")}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 text-center"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <label>Stock:</label>
              <input
                type="number"
                value={banglesStock}
                onChange={(e) => setBanglesStock(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer"
              />
            </div>
          )}
        </div>
      )}

      {/* SAREES */}
      {productType === "Sarees" && (
        <div className="border p-4 rounded mb-4">
          <label>Fabric Type:</label>
          <input
            type="text"
            value={sareeFabricType}
            onChange={(e) => setSareeFabricType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer mb-2"
          />
          <label>Blouse Available:</label>
          <select
            value={sareeBlouseAvailable}
            onChange={(e) => setSareeBlouseAvailable(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer mb-2"
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>

          <label>Images:</label>
          <input
            type="file"
            multiple
            ref={fileInputRefs.Sarees}
            onChange={(e) => handleFiles(e, "Sarees")}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer mb-2"
          />
          <div className="flex gap-2 flex-wrap mb-2">
            {sareeImages.map((img, idx) => (
              <div key={idx} className="relative">
                <img src={img} alt="saree" className="w-24 h-24 object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx, "Sarees")}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 text-center"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <label>Stock:</label>
          <input
            type="number"
            value={sareeStock}
            onChange={(e) => setSareeStock(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer"
          />
        </div>
      )}

      {/* JEWELS */}
      {productType === "Jewels" && (
        <div className="border p-4 rounded mb-4">
          <label>List Items:</label>
          {jewelListItems.map((item, idx) => (
            <input
              key={idx}
              type="text"
              value={item}
              onChange={(e) =>
                setJewelListItems((prev) =>
                  prev.map((v, i) => (i === idx ? e.target.value : v))
                )
              }
              className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer mb-2"
            />
          ))}
          <button
            type="button"
            onClick={() => setJewelListItems((prev) => [...prev, ""])}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 mb-2"
          >
            Add Item
          </button>

          <label>Images:</label>
          <input
            type="file"
            multiple
            ref={fileInputRefs.Jewels}
            onChange={(e) => handleFiles(e, "Jewels")}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer mb-2"
          />
          <div className="flex gap-2 flex-wrap mb-2">
            {jewelImages.map((img, idx) => (
              <div key={idx} className="relative">
                <img src={img} alt="jewel" className="w-24 h-24 object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx, "Jewels")}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 text-center"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <label>Stock:</label>
          <input
            type="number"
            value={jewelStock}
            onChange={(e) => setJewelStock(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer"
          />
        </div>
      )}

      <div className="flex items-center justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-primary cursor-pointer text-white rounded hover:bg-primary"
        >
          {loading ? "Saving..." : "Save Product"}
        </button>
      </div>
    </div>
  );
}
