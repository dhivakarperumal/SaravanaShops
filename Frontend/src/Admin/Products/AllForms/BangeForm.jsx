import React, { useState, useRef, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

export default function BanglesForm({ productId, initialData, onSubmit }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    category: "",
    subcategory: "",
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

  // 🔹 Prefill data when editing
  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
        category: initialData.category || "",
        subcategory: initialData.subcategory || "",
      }));

      if (initialData.colors) setColorTable(initialData.colors);
      if (initialData.images)
        setMultiImages(initialData.images.map((url) => ({ dataUrl: url })));
    }
  }, [initialData]);

  // 🔹 Fetch categories & subcategories
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

  const handleCategoryChange = (e) => {
    const selectedCat = e.target.value;
    setForm((prev) => ({ ...prev, category: selectedCat, subcategory: "" }));
    const catObj = categories.find((c) => c.cname === selectedCat);
    setSubcategories(catObj ? catObj.subcategories : []);
  };

  // 🔹 Utility: calculate selling price
  const calcSellingPrice = (mrp, offer) => {
    const m = parseFloat(mrp);
    const o = parseFloat(offer);
    if (isNaN(m) || isNaN(o)) return "";
    return (m - (m * o) / 100).toFixed(2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "mrp" || name === "offer") {
        updated.sellingprice = calcSellingPrice(
          name === "mrp" ? value : prev.mrp,
          name === "offer" ? value : prev.offer
        );
      }
      return updated;
    });
  };

  const handleCountChange = (e) => {
    setForm((prev) => ({ ...prev, count: e.target.value, stock: "" }));
    setSingleColors([]);
    setColorTable([]);
    setMultiImages([]);
  };

  // 🔹 Color selections
  const colorOptions = [
    "White", "Black", "Red", "Blue", "Green", "Yellow", "Orange", "Purple",
    "Pink", "Gray", "Brown", "Navy Blue", "Maroon", "Olive", "Teal",
    "Sky Blue", "Beige", "Cream", "Gold", "Silver",
  ];

  const colorMap = {
    White: "#FFFFFF", Black: "#000000", Red: "#E11D48", Blue: "#2563EB",
    Green: "#16A34A", Yellow: "#F59E0B", Orange: "#FB923C", Purple: "#7C3AED",
    Pink: "#EC4899", Gray: "#6B7280", Brown: "#8B5E3C", "Navy Blue": "#1E3A8A",
    Maroon: "#6B021F", Olive: "#6B8E23", Teal: "#0D9488", "Sky Blue": "#60A5FA",
    Beige: "#F5F5DC", Cream: "#FFFDD0", Gold: "#D4AF37", Silver: "#C0C0C0",
  };

  const handleSingleColorSelect = (color) => {
    setSingleColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
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
    setColorTable((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const newSizes = r.size.includes(size)
          ? r.size.filter((s) => s !== size)
          : [...r.size, size];
        const newStock = { ...r.stock };
        if (r.size.includes(size)) delete newStock[size];
        else newStock[size] = "";
        return { ...r, size: newSizes, stock: newStock };
      })
    );
  };

  const handleRowStockChange = (rowId, size, value) => {
    setColorTable((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, stock: { ...r.stock, [size]: value } } : r
      )
    );
  };

  // 🔹 Image compression
  const compressAndPreview = async (file) => {
    try {
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
      const compressed = await imageCompression(file, options);
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ file: compressed, dataUrl: reader.result });
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
      });
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const handleMultiImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (multiImages.length + files.length > 5) {
      alert(`Max 5 images allowed. You already have ${multiImages.length}.`);
      return;
    }
    const processed = [];
    for (let file of files) {
      const result = await compressAndPreview(file);
      if (result) processed.push(result);
    }
    setMultiImages((prev) => [...prev, ...processed]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRowImageChange = async (rowId, file) => {
    const result = await compressAndPreview(file);
    if (!result) return;
    setColorTable((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, image: result } : r))
    );
  };

  const removeMultiImage = (idx) =>
    setMultiImages((prev) => prev.filter((_, i) => i !== idx));

  // 🔹 Validation
  const validate = () => {
    const errs = [];
    if (!form.name.trim()) errs.push("Name is required.");
    if (!form.category) errs.push("Category is required.");
    if (!form.subcategory) errs.push("Subcategory is required.");
    if (!form.mrp || isNaN(Number(form.mrp))) errs.push("Valid MRP is required.");
    if (form.offer === "" || isNaN(Number(form.offer))) errs.push("Valid Offer % required.");
    if (!form.sellingprice) errs.push("Selling price missing.");
    if (!form.description.trim()) errs.push("Description required.");
    if (!form.notes.trim()) errs.push("Notes required.");

    if (form.count === "MultiColor") {
      if (multiImages.length < 3) errs.push("Upload at least 3 images.");
      if (!form.stock || isNaN(Number(form.stock))) errs.push("Valid stock required.");
    } else {
      if (colorTable.length === 0) errs.push("Add at least one color row.");
      colorTable.forEach((r) => {
        if (r.size.length === 0) errs.push(`Select size(s) for ${r.color}.`);
        if (!r.image) errs.push(`Upload image for ${r.color}.`);
        Object.entries(r.stock).forEach(([s, val]) => {
          if (!val || isNaN(Number(val)))
            errs.push(`Enter valid stock for ${r.color} size ${s}.`);
        });
      });
    }

    if (errs.length) {
      alert(errs.join("\n"));
      return false;
    }
    return true;
  };

  // 🔹 Final submit handler (calls parent onSubmit)
  const handleProductSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      ...form,
      productId,
      mrp: Number(form.mrp),
      offer: Number(form.offer),
      sellingprice: Number(form.sellingprice),
    };

    if (form.count === "MultiColor") {
      data.images = multiImages.map((img) => img.dataUrl);
      data.stock = Number(form.stock);
    } else {
      data.colors = colorTable.map((r) => ({
        color: r.color,
        size: r.size,
        stock: r.stock,
        image: r.image?.dataUrl || "",
      }));
    }

    onSubmit(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">
        {initialData ? "Edit Bangles Product" : "Add Bangles Product"}
      </h2>

      <form onSubmit={handleProductSubmit} className="space-y-4">
        {/* Basic Fields */}
        <div className="grid grid-cols-2 gap-4">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Product Name"
            className="p-2 border rounded"
          />
          <select
            value={form.category}
            onChange={handleCategoryChange}
            className="p-2 border rounded"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.cname}>
                {cat.cname}
              </option>
            ))}
          </select>
          <select
            name="subcategory"
            value={form.subcategory}
            onChange={handleChange}
            className="p-2 border rounded"
          >
            <option value="">Select Subcategory</option>
            {subcategories.map((sub, idx) => (
              <option key={idx} value={sub}>
                {sub}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="mrp"
            value={form.mrp}
            onChange={handleChange}
            placeholder="MRP"
            className="p-2 border rounded"
          />
          <input
            type="number"
            name="offer"
            value={form.offer}
            onChange={handleChange}
            placeholder="Offer %"
            className="p-2 border rounded"
          />
          <input
            name="sellingprice"
            value={form.sellingprice}
            readOnly
            placeholder="Selling Price"
            className="p-2 border rounded bg-gray-100"
          />
          <input
            name="rating"
            value={form.rating}
            onChange={handleChange}
            placeholder="Rating"
            className="p-2 border rounded"
          />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="p-2 border rounded col-span-2"
          />
          <input
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Notes"
            className="p-2 border rounded col-span-2"
          />
        </div>

        {/* Count Type */}
        <div>
          <label>Count Type: </label>
          <select
            value={form.count}
            onChange={handleCountChange}
            className="p-2 border rounded ml-2"
          >
            <option>SingleColor</option>
            <option>MultiColor</option>
          </select>
        </div>

        {/* MultiColor Section */}
        {form.count === "MultiColor" && (
          <div>
            <label>Upload Images (3–5): </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleMultiImages}
              ref={fileInputRef}
            />
            <div className="grid grid-cols-3 gap-3 mt-2">
              {multiImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative border rounded overflow-hidden"
                >
                  <img
                    src={img.dataUrl}
                    alt=""
                    className="object-cover w-full h-32"
                  />
                  <button
                    type="button"
                    onClick={() => removeMultiImage(idx)}
                    className="absolute top-1 right-1 bg-white bg-opacity-70 p-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <input
              type="number"
              placeholder="Stock"
              value={form.stock}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, stock: e.target.value }))
              }
              className="p-2 border rounded mt-2"
            />
          </div>
        )}

        {/* SingleColor Section */}
        {form.count === "SingleColor" && (
          <div>
            <label>Select Colors:</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleSingleColorSelect(c)}
                  style={{ backgroundColor: colorMap[c] }}
                  className={`w-8 h-8 rounded-full border ${
                    singleColors.includes(c) ? "ring-2 ring-offset-2" : ""
                  }`}
                  title={c}
                />
              ))}
            </div>
            {singleColors.length > 0 && (
              <button
                type="button"
                onClick={addColorTableRows}
                className="mt-3 px-3 py-1 bg-green-600 text-white rounded"
              >
                Add Selected Colors
              </button>
            )}

            {colorTable.length > 0 && (
              <table className="w-full border mt-3 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-1">Color</th>
                    <th className="border p-1">Size</th>
                    <th className="border p-1">Stock</th>
                    <th className="border p-1">Image</th>
                  </tr>
                </thead>
                <tbody>
                  {colorTable.map((row) => (
                    <tr key={row.id}>
                      <td className="border p-1 text-center">{row.color}</td>
                      <td className="border p-1 text-center">
                        {[2.4, 2.6, 2.8].map((sz) => (
                          <label key={sz} className="mr-2">
                            <input
                              type="checkbox"
                              checked={row.size.includes(sz)}
                              onChange={() => handleRowSizeChange(row.id, sz)}
                            />{" "}
                            {sz}
                          </label>
                        ))}
                      </td>
                      <td className="border p-1 text-center">
                        {row.size.map((sz) => (
                          <input
                            key={sz}
                            type="number"
                            placeholder={`Stock ${sz}`}
                            value={row.stock[sz] || ""}
                            onChange={(e) =>
                              handleRowStockChange(
                                row.id,
                                sz,
                                e.target.value
                              )
                            }
                            className="w-16 p-1 border rounded mr-1"
                          />
                        ))}
                      </td>
                      <td className="border p-1 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleRowImageChange(row.id, e.target.files[0])
                          }
                        />
                        {row.image && (
                          <img
                            src={row.image.dataUrl}
                            alt=""
                            className="w-16 h-16 mt-1 mx-auto object-cover"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded mt-4"
        >
          {initialData ? "Update Product" : "Save Product"}
        </button>
      </form>
    </div>
  );
}
