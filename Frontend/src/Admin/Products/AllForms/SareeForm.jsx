import React, { useState, useEffect, useRef } from "react";
import imageCompression from "browser-image-compression";
import { db } from "../../../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function SareeForm({ productId, initialData, onSubmit }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    subcategory: "",
    mrp: "",
    offer: "",
    sellingprice: "",
    rating: "",
    description: "",
    color: "",
    stock: "",
    notes: "",
    fabricType: "",
    blouseAvailable: "No",
  });

  const [images, setImages] = useState([]);

  // Prefill form if editing
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setForm({
        ...form,
        ...initialData,
        subcategory: initialData.subcategory || "",
      });
      setImages(
        (initialData.images || []).map((url) => ({ dataUrl: url }))
      );
    }
  }, [initialData]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, "categories"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCategories(data);
    };
    fetchCategories();
  }, []);

  // Colors
  const colors = [
    "White", "Black", "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "Gray",
    "Brown", "Navy Blue", "Maroon", "Olive", "Teal", "Sky Blue", "Beige", "Cream", "Gold", "Silver"
  ];
  const colorMap = {
    White: "#FFFFFF", Black: "#000000", Red: "#E11D48", Blue: "#2563EB",
    Green: "#16A34A", Yellow: "#F59E0B", Orange: "#FB923C", Purple: "#7C3AED",
    Pink: "#EC4899", Gray: "#6B7280", Brown: "#8B5E3C", "Navy Blue": "#1E3A8A",
    Maroon: "#6B021F", Olive: "#6B8E23", Teal: "#0D9488", "Sky Blue": "#60A5FA",
    Beige: "#F5F5DC", Cream: "#FFFDD0", Gold: "#D4AF37", Silver: "#C0C0C0",
  };

  const handleCategoryChange = (e) => {
    const selected = e.target.value;
    setForm((prev) => ({ ...prev, category: selected, subcategory: "" }));
    const cat = categories.find((c) => c.cname === selected || c.name === selected);
    setSubcategories(cat?.subcategories || []);
  };

  const calcSellingPrice = (mrp, offer) => {
    const m = parseFloat(mrp);
    const o = parseFloat(offer);
    if (isNaN(m) || isNaN(o)) return "";
    return (m - (m * o) / 100).toFixed(2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "mrp" || name === "offer") {
        next.sellingprice = calcSellingPrice(
          name === "mrp" ? value : prev.mrp,
          name === "offer" ? value : prev.offer
        );
      }
      return next;
    });
  };

  const handleColorSelect = (color) => setForm((prev) => ({ ...prev, color }));

  const compressAndPreview = async (file) => {
    try {
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
      const compressed = await imageCompression(file, options);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ dataUrl: reader.result });
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
      });
    } catch (err) {
      console.error("Compression error:", err);
      return null;
    }
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      setErrors([`Max 5 images allowed. You already have ${images.length}.`]);
      return;
    }
    const processed = [];
    for (const f of files) {
      const p = await compressAndPreview(f);
      if (p) processed.push(p);
    }
    setImages((prev) => [...prev, ...processed]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImageAt = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const validate = () => {
    const errs = [];
    if (!form.name.trim()) errs.push("Product name required.");
    if (!form.category) errs.push("Category required.");
    if (!form.subcategory) errs.push("Subcategory required.");
    if (!form.mrp) errs.push("Enter valid MRP.");
    if ((images || []).length < 3) errs.push("Upload at least 3 images.");
    if (!form.color) errs.push("Select a color.");
    if (!form.fabricType.trim()) errs.push("Fabric type required.");
    setErrors(errs);
    return errs.length === 0;
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const data = {
      ...form,
      mrp: Number(form.mrp),
      offer: Number(form.offer),
      sellingprice: Number(form.sellingprice),
      stock: Number(form.stock || 0),
      fabricdetails: [form.fabricType, form.blouseAvailable],
      images: (images || []).map((img) => img.dataUrl),
    };

    if (onSubmit) onSubmit(data);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-3">
        {initialData ? "Edit Saree Product" : "Add Saree Product"} — ID: {productId || "Auto"}
      </h2>

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <ul className="list-disc pl-5 text-red-700 text-sm">
            {errors.map((er, i) => <li key={i}>{er}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={handleProductSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Product Name" className="p-2 border rounded" />
          <select name="category" value={form.category} onChange={handleCategoryChange} className="p-2 border rounded">
            <option value="">Select Category</option>
            {(categories || []).map((cat) => (
              <option key={cat.id} value={cat.cname || cat.name}>{cat.cname || cat.name}</option>
            ))}
          </select>

          <select name="subcategory" value={form.subcategory} onChange={handleChange} className="p-2 border rounded col-span-2">
            <option value="">Select Subcategory</option>
            {(subcategories || []).map((sub, i) => <option key={i} value={sub}>{sub}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-3">
          <input name="mrp" type="number" value={form.mrp} onChange={handleChange} placeholder="MRP" className="p-2 border rounded" />
          <input name="offer" type="number" value={form.offer} onChange={handleChange} placeholder="Offer %" className="p-2 border rounded" />
          <input name="sellingprice" value={form.sellingprice} readOnly placeholder="Selling Price" className="p-2 border rounded bg-gray-50" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-3">
          <input name="rating" value={form.rating} onChange={handleChange} placeholder="Rating" className="p-2 border rounded" />
          <input name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="Stock" className="p-2 border rounded" />
        </div>

        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows={3} className="w-full p-2 border rounded mt-3" />

        <div className="mt-3">
          <label className="block mb-1">Choose Color</label>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleColorSelect(c)}
                style={{ backgroundColor: colorMap[c] }}
                className={`w-8 h-8 rounded-full border ${form.color === c ? "ring-2 ring-offset-2" : ""}`}
                title={c}
              />
            ))}
          </div>
          {form.color && <p className="text-sm mt-1 text-gray-700">Selected: <b>{form.color}</b></p>}
        </div>

        <div className="mt-3">
          <label className="block mb-1">Upload Images (min 3, max 5)</label>
          <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFiles} className="border p-2 rounded w-full" />
          <div className="grid grid-cols-3 gap-3 mt-3">
            {(images || []).map((img, i) => (
              <div key={i} className="relative border rounded overflow-hidden">
                <img src={img.dataUrl} alt="" className="object-cover w-full h-32" />
                <button type="button" onClick={() => removeImageAt(i)} className="absolute top-1 right-1 bg-white bg-opacity-75 p-1 rounded">✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-3">
          <input name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" className="p-2 border rounded" />
          <div className="flex gap-2 items-center">
            <input name="fabricType" value={form.fabricType} onChange={handleChange} placeholder="Fabric Type" className="p-2 border rounded flex-1" />
            <select name="blouseAvailable" value={form.blouseAvailable} onChange={handleChange} className="p-2 border rounded">
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            {loading ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
