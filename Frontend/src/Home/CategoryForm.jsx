import React, { useState, useEffect } from "react";
// import { db } from "../firebase";
// import {
//   collection,
//   addDoc,
//   getDocs,
//   doc,
//   deleteDoc,
//   updateDoc,
// } from "firebase/firestore";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import { FaEdit, FaTrash } from "react-icons/fa";

const Category = () => {
  const [category, setCategory] = useState({
    catId: "",
    cname: "",
    cdescription: "",
    cimgs: [],
    subcategories: [],
  });

  const [subcatInput, setSubcatInput] = useState("");
  const [editId, setEditId] = useState(null);
  const [previewImgs, setPreviewImgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("add");

  const generateCategoryId = async () => {
    // const snapshot = await getDocs(collection(db, "categories"));
    // const count = snapshot.size + 1;
    // return `CAT${String(count).padStart(3, "0")}`;
    return `CAT001`;
  };

  const fetchCategories = async () => {
    // try {
    //   const snapshot = await getDocs(collection(db, "categories"));
    //   const catList = snapshot.docs.map((doc) => ({
    //     id: doc.id,
    //     ...doc.data(),
    //   }));
    //   setCategories(catList);
    // } catch (err) {
    //   console.error("Error fetching categories:", err);
    // }
  };

  useEffect(() => {
    const init = async () => {
      const id = await generateCategoryId();
      setCategory((prev) => ({ ...prev, catId: id }));
      await fetchCategories();
    };
    init();
  }, []);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    try {
      const compressedFiles = await Promise.all(
        files.map((file) =>
          imageCompression(file, {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          })
        )
      );

      const base64Images = await Promise.all(
        compressedFiles.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      setCategory((prev) => ({
        ...prev,
        cimgs: base64Images,
      }));
      setPreviewImgs(base64Images);
      toast.success("Images uploaded & compressed!");
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to compress or upload images.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCategory((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { catId, cname, cdescription, cimgs, subcategories } = category;

    if (!cname || !cdescription || cimgs.length === 0) {
      toast.error("Please fill all required fields and upload images.");
      return;
    }

    const payload = {
      ...category,
      createdAt: new Date().toISOString(),
    };

    setLoading(true);
    try {
      if (editId) {
        // await updateDoc(doc(db, "categories", editId), payload);
        toast.success("Category updated!");
        setEditId(null);
      } else {
        // await addDoc(collection(db, "categories"), payload);
        toast.success("Category added!");
      }

      const newId = await generateCategoryId();
      setCategory({
        catId: newId,
        cname: "",
        cdescription: "",
        cimgs: [],
        subcategories: [],
      });
      setSubcatInput("");
      setPreviewImgs([]);
      document.getElementById("cimgs").value = "";
      await fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save category.");
    }
    setLoading(false);
  };

  const handleEdit = (cat) => {
    setCategory({
      catId: cat.catId,
      cname: cat.cname,
      cdescription: cat.cdescription,
      cimgs: cat.cimgs,
      subcategories: cat.subcategories || [],
    });
    setSubcatInput((cat.subcategories || []).join(", "));
    setPreviewImgs(cat.cimgs || []);
    setEditId(cat.id);
    setActiveTab("add");
    toast("Editing category...");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    try {
      // await deleteDoc(doc(db, "categories", id));
      toast.success("Category deleted.");
      await fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete category.");
    }
  };

  const handleAddSubcategory = () => {
    const trimmed = subcatInput.trim();
    if (trimmed && !category.subcategories.includes(trimmed)) {
      setCategory((prev) => ({
        ...prev,
        subcategories: [...prev.subcategories, trimmed],
      }));
      setSubcatInput("");
    }
  };

  const handleRemoveSubcategory = (sub) => {
    setCategory((prev) => ({
      ...prev,
      subcategories: prev.subcategories.filter((s) => s !== sub),
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen">
      <div className="flex justify-between items-start sm:items-center mb-6 gap-4 flex-col sm:flex-row">
        <div>
          {/* <h2 className="text-3xl font-bold text-blue-900 mb-1">
            {editId ? "Edit Category" : "Add New Category"}
          </h2> */}
          {/* <p className="text-gray-500">Fill in the details below.</p> */}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setActiveTab("add");
              setEditId(null);
              setCategory({
                catId: "",
                cname: "",
                cdescription: "",
                cimgs: [],
                subcategories: [],
              });
              setSubcatInput("");
              setPreviewImgs([]);
            }}
            className={`px-4 py-2 cursor-pointer rounded-full font-medium text-sm ${
              activeTab === "add"
                ? "bg-blue-900 text-white"
                : "bg-gray-100 text-blue-900 hover:bg-gray-200"
            }`}
          >
            Add Category
          </button>
          <button
            onClick={() => setActiveTab("show")}
            className={`px-4 py-2 cursor-pointer rounded-full font-medium text-sm ${
              activeTab === "show"
                ? "bg-blue-900 text-white"
                : "bg-gray-100 text-blue-900 hover:bg-gray-200"
            }`}
          >
            Show Categories
          </button>
        </div>
      </div>

      {activeTab === "add" && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Category ID (Read Only) */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Category ID
            </label>
            <input
              readOnly
              value={category.catId}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-100 text-gray-700 focus:outline-none cursor-not-allowed"
            />
          </div>

          {/* Category Name */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cname"
              value={category.cname}
              onChange={handleChange}
              required
              placeholder="Enter category name"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="cdescription"
              value={category.cdescription}
              onChange={handleChange}
              required
              placeholder="Write a short description..."
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              rows={3}
            />
          </div>

          {/* Subcategories */}
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Subcategories
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={subcatInput}
                onChange={(e) => setSubcatInput(e.target.value)}
                placeholder="e.g. Regular Fit, Oversize, Kids"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              <button
                type="button"
                onClick={handleAddSubcategory}
                className="bg-blue-900 cursor-pointer text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-800 transition-all duration-200"
              >
                Add
              </button>
            </div>

            {/* Show Added Subcategories */}
            {category.subcategories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {category.subcategories.map((sub, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {sub}
                    <button
                      type="button"
                      onClick={() => handleRemoveSubcategory(sub)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Upload Images <span className="text-red-500">*</span>
            </label>
            <input
              id="cimgs"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              required={!editId}
              className="block w-full text-sm text-gray-700 border border-gray-300 rounded-xl cursor-pointer focus:outline-none file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800 transition-all duration-200"
            />
            {previewImgs.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previewImgs.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`preview-${index}`}
                    className="h-32 w-full object-cover rounded-xl border border-gray-200 shadow-sm hover:scale-105 transition-transform duration-300"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 text-right mt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-900 cursor-pointer text-white px-8 py-2.5 rounded-xl font-semibold shadow hover:bg-blue-800 hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? editId
                  ? "Updating..."
                  : "Adding..."
                : editId
                ? "Update Category"
                : "Add Category"}
            </button>
          </div>
        </form>
      )}

      {activeTab === "show" && (
        <div className="mt-6">
          <h3 className="text-2xl font-semibold mb-4 text-gray-800">
            {/* Existing Categories */}
          </h3>
          <div className="hidden md:block overflow-x-auto w-full shadow rounded-lg">
            <table className="min-w-[800px] w-full text-sm text-left">
              <thead className="bg-blue-900 text-white font-bold">
                <tr>
                  <th className="px-4 py-4">Cat ID</th>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Subcategories</th>
                  <th className="px-4 py-4">Images</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <tr
                      key={cat.id}
                      className="border border-gray-300 hover:bg-gray-50"
                    >
                      <td className="px-4 py-2">{cat.catId}</td>
                      <td className="px-4 py-2">{cat.cname}</td>
                      <td className="px-4 py-2">
                        {(cat.subcategories || []).join(", ")}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2 flex-wrap">
                          {(cat.cimgs || []).map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              className="h-12 w-12 p-1 object-cover rounded border border-primary"
                              alt={`cat-${i}`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex justify-center gap-3 text-gray-600 text-[8px]">
                          <FaEdit
                            onClick={() => handleEdit(cat)}
                            className="hover:text-green-600 cursor-pointer border-2 border-primary h-8 w-8 rounded-full flex items-center justify-center p-1"
                          />
                          <FaTrash
                            onClick={() => handleDelete(cat.id)}
                            className="hover:text-red-600 cursor-pointer border-2 border-primary h-8 w-8 rounded-full flex items-center justify-center p-1"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-500">
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white p-4 rounded-lg shadow border"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">ID: {cat.catId}</p>
                    <h4 className="text-lg font-semibold text-blue-900">
                      {cat.cname}
                    </h4>
                    {cat.subcategories?.length > 0 && (
                      <p className="text-sm mt-1 text-gray-600">
                        Subcategories: {cat.subcategories.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <FaEdit
                      onClick={() => handleEdit(cat)}
                      className="hover:text-green-600 cursor-pointer border-2 border-gray-300 h-7 w-7 rounded-lg flex items-center justify-center p-1"
                    />
                    <FaTrash
                      onClick={() => handleDelete(cat.id)}
                      className="hover:text-red-600 cursor-pointer border-2 border-gray-300 h-7 w-7 rounded-lg flex items-center justify-center p-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {(cat.cimgs || []).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      className="h-24 w-full object-cover rounded border"
                      alt={`cat-mobile-${i}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Category;
