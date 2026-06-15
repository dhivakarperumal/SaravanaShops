import React, { useState, useRef, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function BanglesForm() {

  const [categories, setCategories] = useState([]);
const [subcategories, setSubcategories] = useState([]);

useEffect(() => {
  const fetchCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, "categories"));
      const categoryData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(categoryData);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  fetchCategories();
}, []);


const handleCategoryChange = (e) => {
  const selectedCat = e.target.value;
  setForm(prev => ({ ...prev, category: selectedCat, subcategory: "" }));
  const catObj = categories.find(c => c.cname === selectedCat);
  setSubcategories(catObj ? catObj.subcategories : []);
};

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
    name: "",
    mrp: "",
    offer: "",
    sellingprice: "",
    rating: "",
    description: "",
    notes: "",
    count: "SingleColor",
    stock: "",
  });

  const [singleColors, setSingleColors] = useState([]);
  const [colorTable, setColorTable] = useState([]);
  const [multiImages, setMultiImages] = useState([]);
  const fileInputRef = useRef(null);

  const calcSellingPrice = (mrp, offer) => {
    const m = parseFloat(mrp);
    const o = parseFloat(offer);
    if (isNaN(m) || isNaN(o)) return "";
    const sp = m - (m * o) / 100;
    return Number.isInteger(sp) ? String(sp) : sp.toFixed(2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "mrp" || name === "offer") {
        next.sellingprice = calcSellingPrice(name === "mrp" ? value : prev.mrp, name === "offer" ? value : prev.offer);
      }
      return next;
    });
  };

  const handleCountChange = (e) => {
    setForm((prev) => ({ ...prev, count: e.target.value, stock: '' }));
    setSingleColors([]);
    setColorTable([]);
    setMultiImages([]);
  };

  const handleSingleColorSelect = (color) => {
    setSingleColors((prev) => {
      if (prev.includes(color)) return prev.filter((c) => c !== color);
      return [...prev, color];
    });
  };

  const addColorTableRows = () => {
    const rows = singleColors.map((color, idx) => ({
      id: idx + 1,
      color,
      size: [],
      stock: {},
      image: null,
    }));
    setColorTable(rows);
  };

  const handleRowSizeChange = (rowId, size) => {
    setColorTable((prev) => prev.map((r) => {
      if (r.id === rowId) {
        let newSizes = r.size.includes(size) ? r.size.filter(s => s !== size) : [...r.size, size];
        let newStock = { ...r.stock };
        if (!r.size.includes(size)) newStock[size] = '';
        else delete newStock[size];
        return { ...r, size: newSizes, stock: newStock };
      }
      return r;
    }));
  };

  const handleRowStockChange = (rowId, size, value) => {
    setColorTable(prev => prev.map(r => r.id === rowId ? { ...r, stock: { ...r.stock, [size]: value } } : r));
  };

  const compressAndPreview = async (file) => {
    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressed = await imageCompression(file, options);
      const dataUrl = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = (err) => rej(err);
        reader.readAsDataURL(compressed);
      });
      return { file: compressed, dataUrl };
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleMultiImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (multiImages.length + files.length > 5) {
      alert(`Maximum 5 images allowed. You already have ${multiImages.length}.`);
      return;
    }
    const processed = [];
    for (let f of files) {
      const p = await compressAndPreview(f);
      if (p) processed.push(p);
    }
    setMultiImages(prev => [...prev, ...processed]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRowImageChange = async (rowId, file) => {
    const p = await compressAndPreview(file);
    if (!p) return;
    setColorTable(prev => prev.map(r => r.id === rowId ? { ...r, image: p } : r));
  };

  const removeMultiImage = (index) => setMultiImages(prev => prev.filter((_, i) => i !== index));

  const validate = () => {
    const errs = [];
    if (!form.name.trim()) errs.push("Name is required.");
    if (!form.mrp || isNaN(Number(form.mrp))) errs.push("Valid MRP is required.");
    if (form.offer === "" || isNaN(Number(form.offer))) errs.push("Valid Offer % is required.");
    if (!form.sellingprice) errs.push("Selling price could not be calculated.");
    if (!form.description.trim()) errs.push("Description required.");
    if (!form.notes.trim()) errs.push("Notes required.");

    if (form.count === "MultiColor") {
      if (multiImages.length < 3) errs.push("Please upload at least 3 images for MultiColor.");
      if (!form.stock || isNaN(Number(form.stock))) errs.push("Valid stock is required for MultiColor.");
    } else {
      if (colorTable.length === 0) errs.push("Please select colors and add to table for SingleColor.");
      colorTable.forEach(row => {
        if (row.size.length === 0) errs.push(`Select at least one size for color ${row.color}`);
        if (!row.image) errs.push(`Upload image for color ${row.color}`);
        Object.entries(row.stock).forEach(([s, val]) => {
          if (!val || isNaN(Number(val))) errs.push(`Enter valid stock for size ${s} of color ${row.color}`);
        });
      });
    }

    if (errs.length > 0) alert(errs.join('\n'));
    return errs.length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    let output = {
      name: form.name,
      mrp: Number(form.mrp),
      offer: Number(form.offer),
      sellingprice: Number(form.sellingprice),
      rating: form.rating,
      description: form.description,
      notes: form.notes,
      count: form.count,
    };

    if (form.count === "MultiColor") {
      output.image = multiImages.map(it => it.dataUrl);
      output.stock = Number(form.stock);
    } else {
      output.colors = colorTable.map(r => ({ color: r.color, size: r.size, stock: r.stock, image: r.image.dataUrl }));
    }

    console.log("Bangles JSON:", output);
    alert("Form submitted successfully. Check console for output JSON.");
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">BanglesForm — Add / Edit Bangles</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="p-2 border rounded" />
          <select name="category" value={form.category} onChange={handleCategoryChange} className="p-2 border rounded">
  <option value="">Select Category</option>
  {categories.map((cat, idx) => <option key={idx} value={cat.cname}>{cat.cname}</option>)}
</select>

<select name="subcategory" value={form.subcategory} onChange={handleChange} className="p-2 border rounded">
  <option value="">Select Subcategory</option>
  {subcategories.map((sub, idx) => <option key={idx} value={sub}>{sub}</option>)}
</select>

          <input name="mrp" type="number" value={form.mrp} onChange={handleChange} placeholder="MRP" className="p-2 border rounded" />
          <input name="offer" type="number" value={form.offer} onChange={handleChange} placeholder="Offer %" className="p-2 border rounded" />
          <input name="sellingprice" value={form.sellingprice} readOnly placeholder="Selling Price" className="p-2 border rounded bg-gray-50" />
          <input name="rating" value={form.rating} onChange={handleChange} placeholder="Rating" className="p-2 border rounded" />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="p-2 border rounded" />
          <input name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" className="p-2 border rounded" />
        </div>

        <div>
          <label>Count Type:</label>
          <select value={form.count} onChange={handleCountChange} className="p-2 border rounded ml-2">
            <option>SingleColor</option>
            <option>MultiColor</option>
          </select>
        </div>

        {/* {form.count === "MultiColor" && (
          <div>
            <label>Upload Images (3-5):</label>
            <input type="file" accept="image/*" multiple onChange={handleMultiImages} ref={fileInputRef} />
            <div className="mt-3 grid grid-cols-3 gap-3">
              {multiImages.map((it, idx) => (
                <div key={idx} className="relative border rounded overflow-hidden">
                  <img src={it.dataUrl} alt={`preview-${idx}`} className="object-cover w-full h-32" />
                  <button type="button" onClick={() => removeMultiImage(idx)} className="absolute top-1 right-1 bg-white bg-opacity-75 p-1 rounded">✕</button>
                </div>
              ))}
            </div>
            <input type="number" placeholder="Stock" value={form.stock} onChange={handleChange} className="p-2 border rounded w-32 mt-2" />
          </div>
        )} */}

{form.count === "MultiColor" && (
  <div>
    <label>Upload Images (3-5):</label>
    <input type="file" accept="image/*" multiple onChange={handleMultiImages} ref={fileInputRef} />
    <div className="mt-3 grid grid-cols-3 gap-3">
      {multiImages.map((it, idx) => (
        <div key={idx} className="relative border rounded overflow-hidden">
          <img src={it.dataUrl} alt={`preview-${idx}`} className="object-cover w-full h-32" />
          <button
            type="button"
            onClick={() => removeMultiImage(idx)}
            className="absolute top-1 right-1 bg-white bg-opacity-75 p-1 rounded"
          >✕</button>
        </div>
      ))}
    </div>
    <input
      type="number"
      placeholder="Stock"
      value={form.stock}
      onChange={(e) => setForm(prev => ({ ...prev, stock: e.target.value }))}
      className="p-2 border rounded w-32 mt-2"
    />
  </div>
)}

        {form.count === "SingleColor" && (
          <div>
            <label>Select Colors (multi-select):</label>
            <div className="flex flex-wrap gap-3 mt-2">
              {initialColors.map(c => (
                <button
                  type="button"
                  key={c}
                  style={{ backgroundColor: colorMap[c] }}
                  className={`w-10 h-10 rounded-full border-2 ${singleColors.includes(c) ? 'ring-2 ring-offset-1' : ''}`}
                  onClick={() => handleSingleColorSelect(c)}
                  title={c}
                ></button>
              ))}
            </div>
            {singleColors.length > 0 && (
              <div className="mt-2">
                <button type="button" onClick={addColorTableRows} className="px-3 py-1 bg-green-500 text-white rounded">Add to Table</button>
              </div>
            )}

            {colorTable.length > 0 && (
              <table className="mt-3 w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border p-1">ID</th>
                    <th className="border p-1">Color</th>
                    <th className="border p-1">Size</th>
                    <th className="border p-1">Stock</th>
                    <th className="border p-1">Image</th>
                  </tr>
                </thead>
                <tbody>
                  {colorTable.map(row => (
                    <tr key={row.id}>
                      <td className="border p-1 text-center">{row.id}</td>
                      <td className="border p-1 text-center">{row.color}</td>
                      <td className="border p-1 text-center">
                        {[2.4, 2.6, 2.8].map(sz => (
                          <label key={sz} className="mr-2">
                            <input type="checkbox" checked={row.size.includes(sz)} onChange={() => handleRowSizeChange(row.id, sz)} /> {sz}
                          </label>
                        ))}
                      </td>
                      <td className="border p-1 text-center">
                        {row.size.map(sz => (
                          <input key={sz} type="number" placeholder={`Stock ${sz}`} value={row.stock[sz] || ''} onChange={e => handleRowStockChange(row.id, sz, e.target.value)} className="w-16 p-1 border rounded mr-1 mb-1" />
                        ))}
                      </td>
                      <td className="border p-1 text-center">
                        <input type="file" accept="image/*" onChange={e => handleRowImageChange(row.id, e.target.files[0])} />
                        {row.image && <img src={row.image.dataUrl} alt={`color-${row.color}`} className="w-16 h-16 mt-1 object-cover mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded mt-4">Save</button>
      </form>
    </div>
  );
}