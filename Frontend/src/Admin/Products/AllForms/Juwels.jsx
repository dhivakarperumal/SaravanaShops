import React, { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

const Juwels = ({ productId, initialData, onSubmit }) => {
  const [product, setProduct] = useState({
    name: "",
    category: "",
    subcategory: [],
    mrp: "",
    offer: "",
    sellingprice: "",
    rating: "",
    description: "",
    images: [],
    list_of_items: [""],
    notes: "",
    stock: "",
  });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // Prefill for editing
  useEffect(() => {
    if (initialData) {
      setProduct({
        ...initialData,
        subcategory: initialData.subcategory || [],
        images: initialData.images
          ? initialData.images.map((url) => ({ dataUrl: url }))
          : [],
      });

      if (initialData.category) {
        handleCategoryChange({ target: { value: initialData.category } });
      }
    }
  }, [initialData]);

  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "categories"));
        const cats = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCategories(cats);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Handle category change
  const handleCategoryChange = (e) => {
    const selected = e.target.value;
    setProduct((prev) => ({
      ...prev,
      category: selected,
      subcategory: [],
    }));

    const found = categories.find(
      (cat) => cat.cname === selected || cat.name === selected
    );
    setSubcategories(found?.subcategories || []);
  };

  // Generic input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  // Selling price calculation
  useEffect(() => {
    const mrp = parseFloat(product.mrp);
    const offer = parseFloat(product.offer);
    if (!isNaN(mrp) && !isNaN(offer)) {
      const selling = (mrp - (mrp * offer) / 100).toFixed(2);
      setProduct((prev) => ({ ...prev, sellingprice: selling }));
    }
  }, [product.mrp, product.offer]);

  // Image upload & compression
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    const processed = [];

    for (let file of files) {
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
      const compressed = await imageCompression(file, options);

      const reader = new FileReader();
      reader.onload = () => {
        processed.push({ dataUrl: reader.result });
        if (processed.length === files.length) {
          setProduct((prev) => ({
            ...prev,
            images: [...prev.images, ...processed],
          }));
        }
      };
      reader.readAsDataURL(compressed);
    }
  };

  // List of items handlers
  const handleItemChange = (index, value) => {
    const updated = [...(product.list_of_items || [])];
    updated[index] = value;
    setProduct((prev) => ({ ...prev, list_of_items: updated }));
  };

  const addItemField = () =>
    setProduct((prev) => ({
      ...prev,
      list_of_items: [...(prev.list_of_items || []), ""],
    }));

  const removeItemField = (index) => {
    setProduct((prev) => ({
      ...prev,
      list_of_items: (prev.list_of_items || []).filter((_, i) => i !== index),
    }));
  };

  // Validation
  const validate = () => {
    const errors = [];
    if (!product.name.trim()) errors.push("Product name is required.");
    if (!product.category) errors.push("Select a category.");
    if (!product.mrp) errors.push("Enter MRP.");
    if (!product.description.trim()) errors.push("Enter description.");
    if ((product.images || []).length < 1) errors.push("Upload at least one image.");
    if (errors.length) alert(errors.join("\n"));
    return errors.length === 0;
  };

  
const handleProductSubmit = (e) => {
  e.preventDefault();

  if (!validate()) return;

  // Ensure arrays exist before using .map or other array methods
  const images = Array.isArray(product.images)
    ? product.images.map((img) => img.dataUrl || img)
    : [];

  const finalData = {
    ...product,
    productId,
    images,
    mrp: Number(product.mrp) || 0,
    offer: Number(product.offer) || 0,
    sellingprice: Number(product.sellingprice) || 0,
    stock: Number(product.stock) || 0,
    // Ensure subcategory is always an array
    subcategory: Array.isArray(product.subcategory) ? product.subcategory : [],
  };

  // Optional: ensure onSubmit exists
  if (typeof onSubmit === "function") {
    onSubmit(finalData);
  } else {
    console.warn("onSubmit is not defined");
  }
};


  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">
        {initialData ? "Edit Jewellery Product" : "Add Jewellery Product"}
      </h2>

      <form onSubmit={handleProductSubmit} className="space-y-4">
        {/* Name */}
        <input
          type="text"
          name="name"
          value={product.name}
          onChange={handleChange}
          placeholder="Product Name"
          className="w-full border p-2 rounded"
        />

        {/* Category */}
        <select
          name="category"
          value={product.category || ""}
          onChange={handleCategoryChange}
          className="w-full border p-2 rounded"
        >
          <option value="">Select Category</option>
          {(categories || []).map((cat) => (
            <option key={cat.id} value={cat.cname || cat.name}>
              {cat.cname || cat.name}
            </option>
          ))}
        </select>

        {/* Subcategories */}
        {(subcategories || []).length > 0 && (
          <div>
            <label className="font-semibold">Select Subcategories:</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {(subcategories || []).map((sub, i) => (
                <label
                  key={i}
                  className="flex items-center gap-2 border p-2 rounded"
                >
                  <input
                    type="checkbox"
                    value={sub}
                    checked={(product.subcategory || []).includes(sub)}
                    onChange={(e) => {
                      let updated = [...(product.subcategory || [])];
                      if (e.target.checked) updated.push(sub);
                      else updated = updated.filter((s) => s !== sub);
                      setProduct((prev) => ({ ...prev, subcategory: updated }));
                    }}
                  />
                  {sub}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* MRP, Offer, Selling Price */}
        <div className="grid grid-cols-3 gap-3">
          <input
            type="number"
            name="mrp"
            value={product.mrp}
            onChange={handleChange}
            placeholder="MRP"
            className="border p-2 rounded"
          />
          <input
            type="number"
            name="offer"
            value={product.offer}
            onChange={handleChange}
            placeholder="Offer %"
            className="border p-2 rounded"
          />
          <input
            type="number"
            name="sellingprice"
            value={product.sellingprice}
            readOnly
            placeholder="Selling Price"
            className="border p-2 rounded bg-gray-100"
          />
        </div>

        {/* Rating */}
        <input
          type="number"
          step="0.1"
          name="rating"
          value={product.rating}
          onChange={handleChange}
          placeholder="Rating (e.g. 4.5)"
          className="w-full border p-2 rounded"
        />

        {/* Description */}
        <textarea
          name="description"
          value={product.description}
          onChange={handleChange}
          placeholder="Product Description"
          className="w-full border p-2 rounded"
        />

        {/* Image Upload */}
        <div>
          <label>Upload Images (Max 5)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border p-2 rounded"
          />
          <div className="flex gap-2 flex-wrap mt-2">
            {(product.images || []).map((img, i) => (
              <img
                key={i}
                src={img.dataUrl || img}
                alt="preview"
                className="w-20 h-20 object-cover rounded"
              />
            ))}
          </div>
        </div>

        {/* List of Items */}
        <div>
          <label className="font-semibold">List of Items</label>
          {(product.list_of_items || []).map((item, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                className="flex-1 border p-2 rounded"
              />
              <button
                type="button"
                onClick={() => removeItemField(index)}
                className="bg-red-500 text-white px-3 rounded"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addItemField}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Add Item
          </button>
        </div>

        {/* Notes and Stock */}
        <textarea
          name="notes"
          value={product.notes}
          onChange={handleChange}
          placeholder="Notes"
          className="w-full border p-2 rounded"
        />
        <input
          type="number"
          name="stock"
          value={product.stock}
          onChange={handleChange}
          placeholder="Stock Quantity"
          className="w-full border p-2 rounded"
        />

        {/* Submit */}
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {initialData ? "Update Product" : "Save Product"}
        </button>
      </form>
    </div>
  );
};

export default Juwels;
