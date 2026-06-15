import React, { useState,useEffect,useRef } from "react";
import imageCompression from "browser-image-compression";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore"; 

export default function SareeForm() {
 const [categories, setCategories] = useState([]); 
const [subcategories, setSubcategories] = useState([]); 
useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "categories"));
        const categoryData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(categoryData);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const initialColors = [
    "White","Black","Red","Blue","Green","Yellow","Orange","Purple","Pink","Gray","Brown","Navy Blue","Maroon","Olive","Teal","Sky Blue","Beige","Cream","Gold","Silver"
  ];

  const colorMap = {
    "White": "#FFFFFF",
    "Black": "#000000",
    "Red": "#E11D48",
    "Blue": "#2563EB",
    "Green": "#16A34A",
    "Yellow": "#F59E0B",
    "Orange": "#FB923C",
    "Purple": "#7C3AED",
    "Pink": "#EC4899",
    "Gray": "#6B7280",
    "Brown": "#8B5E3C",
    "Navy Blue": "#1E3A8A",
    "Maroon": "#6B021F",
    "Olive": "#6B8E23",
    "Teal": "#0D9488",
    "Sky Blue": "#60A5FA",
    "Beige": "#F5F5DC",
    "Cream": "#FFFDD0",
    "Gold": "#D4AF37",
    "Silver": "#C0C0C0",
  };

  const [form, setForm] = useState({
    id: "",
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

  const [images, setImages] = useState([]); // {file, dataUrl}
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  // Utility: calculate selling price
  const calcSellingPrice = (mrp, offer) => {
    const m = parseFloat(mrp);
    const o = parseFloat(offer);
    if (isNaN(m) || isNaN(o)) return "";
    const sp = m - (m * o) / 100;
    // round to 2 decimals or integer if whole
    return Number.isInteger(sp) ? String(sp) : sp.toFixed(2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // auto update sellingprice when mrp or offer change
      if (name === "mrp" || name === "offer") {
        next.sellingprice = calcSellingPrice(
          name === "mrp" ? value : prev.mrp,
          name === "offer" ? value : prev.offer
        );
      }
      return next;
    });
  };

  const handleColorSelect = (colorName) => {
    setForm((prev) => ({ ...prev, color: colorName }));
  };

  // Image compression + preview
  const compressAndPreview = async (file) => {
    try {
      const options = {
        maxSizeMB: 1, // try to keep images under ~1MB
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      const compressed = await imageCompression(file, options);

      // convert to data URL for preview
      const dataUrl = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = (err) => rej(err);
        reader.readAsDataURL(compressed);
      });

      return { file: compressed, dataUrl };
    } catch (err) {
      console.error("Compression error:", err);
      return null;
    }
  };

  const handleFiles = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    // existing images + new must not exceed 5
    if (images.length + selected.length > 5) {
      setErrors([`You can upload a maximum of 5 images. You already have ${images.length}.`]);
      return;
    }

    setErrors([]);
    const processed = [];
    for (let f of selected) {
      const p = await compressAndPreview(f);
      if (p) processed.push(p);
    }

    setImages((prev) => [...prev, ...processed]);

    // reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImageAt = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = [];
    if (!form.id.trim()) errs.push("ID is required.");
    if (!form.name.trim()) errs.push("Name is required.");
    if (!form.category.trim()) errs.push("Category is required.");
    if (!form.subcategory.trim()) errs.push("Subcategory is required.");
    if (!form.mrp || isNaN(Number(form.mrp))) errs.push("Valid MRP is required.");
    if (form.offer === "" || isNaN(Number(form.offer))) errs.push("Valid Offer % is required.");
    if (!form.sellingprice) errs.push("Selling price could not be calculated.");
    if (!form.color) errs.push("Please choose one color.");
    if (!form.stock || isNaN(Number(form.stock))) errs.push("Valid stock number is required.");
    if (images.length < 3) errs.push("Please upload at least 3 images.");
    if (images.length > 5) errs.push("You can upload a maximum of 5 images.");
    if (!form.fabricType.trim()) errs.push("Fabric type is required.");

    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const output = {
      id: form.id,
      name: form.name,
      category: form.category,
      subcategory: form.subcategory,
      mrp: Number(form.mrp),
      offer: Number(form.offer),
      sellingprice: Number(form.sellingprice),
      rating: form.rating,
      description: form.description,
      color: form.color,
      stock: Number(form.stock),
      image: images.map((it) => it.dataUrl), // for now we include dataUrls; replace with uploaded URLs when integrating storage
      notes: form.notes,
      fabricdetails: [form.fabricType, form.blouseAvailable],
    };

    // For now: log to console. Integrate with your backend (Firestore/Storage) as needed.
    console.log("Saree JSON:", output);
    alert("Form valid — JSON logged to console. Replace console.log with your upload logic.");
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">SareeForm — Add / Edit Saree</h2>

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <ul className="text-sm text-red-700 list-disc pl-5">
            {errors.map((er, i) => (
              <li key={i}>{er}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input name="id" value={form.id} onChange={handleChange} placeholder="ID" className="p-2 border rounded" />
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="p-2 border rounded" />
          {/* <input name="category" value={form.category} onChange={handleChange} placeholder="Category" className="p-2 border rounded" />
          <input name="subcategory" value={form.subcategory} onChange={handleChange} placeholder="Subcategory" className="p-2 border rounded" /> */}
            {/* Category Dropdown */}
<select
  name="category"
  value={form.category}
  onChange={(e) => {
    const selectedCat = e.target.value;
    setForm(prev => ({ ...prev, category: selectedCat, subcategory: "" }));
    
    // Find subcategories for this category
    const catObj = categories.find(c => c.cname === selectedCat);
    setSubcategories(catObj ? catObj.subcategories : []);
  }}
  className="p-2 border rounded"
>
  <option value="">Select Category</option>
  {categories.map((cat, idx) => (
    <option key={idx} value={cat.cname}>{cat.cname}</option>
  ))}
</select>

{/* Subcategory Dropdown */}
<select
  name="subcategory"
  value={form.subcategory}
  onChange={(e) => setForm(prev => ({ ...prev, subcategory: e.target.value }))}
  className="p-2 border rounded"
>
  <option value="">Select Subcategory</option>
  {subcategories.map((sub, idx) => (
    <option key={idx} value={sub}>{sub}</option>
  ))}
</select>

        
        </div>

        <div className="grid grid-cols-3 gap-4">
          <input name="mrp" value={form.mrp} onChange={handleChange} placeholder="MRP" type="number" className="p-2 border rounded" />
          <input name="offer" value={form.offer} onChange={handleChange} placeholder="Offer %" type="number" className="p-2 border rounded" />
          <input name="sellingprice" value={form.sellingprice} readOnly placeholder="Selling Price" className="p-2 border rounded bg-gray-50" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input name="rating" value={form.rating} onChange={handleChange} placeholder="Rating" className="p-2 border rounded" />
          <input name="stock" value={form.stock} onChange={handleChange} placeholder="Stock" type="number" className="p-2 border rounded" />
        </div>

        <div>
          <label className="block mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block mb-2">Choose Color (one)</label>
          <div className="flex flex-wrap gap-3">
            {initialColors.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => handleColorSelect(c)}
                title={c}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center focus:outline-none ${form.color === c ? 'ring-2 ring-offset-1' : ''}`}
                style={{ backgroundColor: colorMap[c] || '#eee' }}
              >
                {form.color === c && (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          {form.color && <div className="mt-2 text-sm">Selected: <strong>{form.color}</strong></div>}
        </div>

        <div>
          <label className="block mb-1">Images (min 3, max 5)</label>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFiles} />
          <div className="mt-3 grid grid-cols-3 gap-3">
            {images.map((it, idx) => (
              <div key={idx} className="relative border rounded overflow-hidden">
                <img src={it.dataUrl} alt={`preview-${idx}`} className="object-cover w-full h-32" />
                <button type="button" onClick={() => removeImageAt(idx)} className="absolute top-1 right-1 bg-white bg-opacity-75 p-1 rounded">✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" className="p-2 border rounded" />

          <div className="flex gap-2 items-center">
            <input name="fabricType" value={form.fabricType} onChange={handleChange} placeholder="Fabric Type" className="p-2 border rounded flex-1" />
            <select name="blouseAvailable" value={form.blouseAvailable} onChange={handleChange} className="p-2 border rounded">
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
          <button type="button" onClick={() => { setForm({ id:'',name:'',category:'',subcategory:'',mrp:'',offer:'',sellingprice:'',rating:'',description:'',color:'',stock:'',notes:'',fabricType:'',blouseAvailable:'No' }); setImages([]); setErrors([]); }} className="px-4 py-2 border rounded">Reset</button>
        </div>
      </form>

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Note:</strong> This component compresses images locally using <code>browser-image-compression</code> and generates preview data URLs. Replace the console.log in <code>handleSubmit</code> with your upload logic (Firebase Storage + Firestore or any backend) when integrating.</p>
      </div>
    </div>
  );
}
