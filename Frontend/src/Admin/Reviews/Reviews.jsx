import React, { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import { TiTickOutline, TiTick } from "react-icons/ti";
import { HiPencil, HiTrash } from "react-icons/hi";
import toast from "react-hot-toast";
import api from "../../api";
import { FaSearch, FaFilter, FaTh, FaList, FaPlus } from "react-icons/fa";

const AddReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [checkedIds, setCheckedIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("card");
  const [showFilters, setShowFilters] = useState(false);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [newReview, setNewReview] = useState({
    title: "",
    category: "",
    user: "",
    rating: 0,
    reviews: 0,
    rate: 0,
    desc: "",
    image: "",
    tick: false,
  });

  const [filters, setFilters] = useState({
    category: "",
    product: "",
    rating: "",
  });

  const categoryOptions = [
    ...new Set(reviews.map((r) => r.category))
  ].filter(Boolean);

  const productOptions = filters.category
    ? [
      ...new Set(
        reviews
          .filter((r) => r.category === filters.category)
          .map((r) => r.title)
      ),
    ]
    : [...new Set(reviews.map((r) => r.title))];

  const activeFilterCount = [
    filters.category,
    filters.product,
    filters.rating,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({
      category: "",
      product: "",
      rating: "",
    });
  };

  const displayedReviews = reviews.filter((item) => {
    const searchMatch =
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!searchMatch) return false;

    if (
      filters.category &&
      item.category !== filters.category
    )
      return false;

    if (
      filters.product &&
      item.title !== filters.product
    )
      return false;

    if (
      filters.rating &&
      Number(item.rating) < Number(filters.rating)
    )
      return false;

    return true;
  });

  useEffect(() => {
    fetchReviews();
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviews = async () => {
    const res = await api.get("/reviews");
    setReviews(res.data);
  };

  const resetForm = () => {
    setNewReview({
      title: "",
      category: "",
      user: "",
      rating: 0,
      reviews: 0,
      rate: 0,
      desc: "",
      image: "",
      tick: false,
    });
    setEditMode(false);
    setEditingId(null);
    setShowModal(false);
  };

  const handleAddReview = async () => {
    if (
      !newReview.title ||
      !newReview.user ||
      !newReview.category ||
      !newReview.rating
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      if (editMode) {
        await api.put(
          `/reviews/${editingId}`,
          newReview
        );

        toast.success("Review updated successfully");
      } else {
        await api.post(
          "/reviews",
          newReview
        );

        toast.success("Review added successfully");
      }

      fetchReviews();
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save review");
    }
  };

  const handleEdit = (review) => {
    setNewReview({
      ...review,
      rating: parseFloat(review.rating),
    });
    setEditMode(true);
    setEditingId(review.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this review?");
    if (!confirm) return;

    try {
      await api.delete(
        `/reviews/${id}`
      );
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setCheckedIds((prev) => prev.filter((cid) => cid !== id));
      toast.success("Review deleted.");
    } catch (err) {
      console.error("Error deleting review:", err);
      toast.error("Failed to delete review.");
    }
  };

  const toggleTick = async (review) => {
    const action = review.tick ? "disable" : "enable"; // determine action
    const confirmAction = window.confirm(`Are you sure you want to ${action} the tick?`);
    if (!confirmAction) return;
    const updatedTick = !review.tick;


    try {
      await api.patch(
        `/reviews/toggle/${review.id}`
      );
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? { ...r, tick: updatedTick } : r
        )
      );
    } catch (err) {
      console.error("Error updating tick:", err);
      toast.error("Failed to toggle tick.");
    }
  };

  return (
    <div className="min-h-screen py-10 md:p-6 lg:p-0">
      <div className="max-w-7xl mx-auto black p-5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6 bg-white rounded-2xl px-3 sm:px-4 py-3 shadow-sm border border-gray-100">

          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-0 max-w-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <FaSearch className="text-gray-400 text-sm flex-shrink-0" />

            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-sm text-gray-700 outline-none"
            />
          </div>

          {/* Count */}
          <span className="text-xs sm:text-sm text-gray-500 font-medium hidden sm:block">
            {reviews.length} reviews
          </span>

          <div className="flex items-center gap-2 ml-auto">

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${showFilters
                ? "bg-primary text-white border-primary"
                : "bg-gray-50 border-gray-200"
                }`}
            >
              <FaFilter />

              Filters

              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200">
              <button
                onClick={() => setViewMode("card")}
                className={`p-2 rounded-lg ${viewMode === "card"
                  ? "bg-white shadow text-primary"
                  : "text-gray-400"
                  }`}
              >
                <FaTh />
              </button>

              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg ${viewMode === "table"
                  ? "bg-white shadow text-primary"
                  : "text-gray-400"
                  }`}
              >
                <FaList />
              </button>
            </div>

            {/* Add Review */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md"
            >
              <FaPlus />
              Add Review
            </button>

          </div>
        </div>

        {showFilters && (
          <aside className="w-64">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

              <div className="flex justify-between mb-5">
                <h3 className="font-bold">Filters</h3>

                <button
                  onClick={clearFilters}
                  className="text-red-500 text-xs font-semibold"
                >
                  Clear
                </button>
              </div>

              {/* Category */}
              <div className="mb-5">
                <h4 className="font-semibold mb-2">
                  Category
                </h4>

                {categoryOptions.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2 py-1"
                  >
                    <input
                      type="radio"
                      checked={filters.category === cat}
                      onChange={() =>
                        setFilters({
                          ...filters,
                          category: cat,
                          product: "",
                        })
                      }
                    />
                    {cat}
                  </label>
                ))}
              </div>

              {/* Product */}
              <div className="mb-5">
                <h4 className="font-semibold mb-2">
                  Product
                </h4>

                {productOptions.map((product) => (
                  <label
                    key={product}
                    className="flex items-center gap-2 py-1"
                  >
                    <input
                      type="radio"
                      checked={filters.product === product}
                      onChange={() =>
                        setFilters({
                          ...filters,
                          product,
                        })
                      }
                    />
                    {product}
                  </label>
                ))}
              </div>

              {/* Rating */}
              <div>
                <h4 className="font-semibold mb-2">
                  Minimum Rating
                </h4>

                {["3", "4", "5"].map((rating) => (
                  <button
                    key={rating}
                    onClick={() =>
                      setFilters({
                        ...filters,
                        rating,
                      })
                    }
                    className="mr-2 mb-2 px-3 py-1 border rounded-lg"
                  >
                    ⭐ {rating}+
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedReviews.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row gap-4 shadow p-4 rounded-lg bg-white"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-24 h-24 object-cover rounded-md"
                />
                <div className="flex-1">
                  <div className="flex justify-between flex-wrap">
                    <div>
                      <span className="font-semibold">{item.user}</span>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500 text-sm">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={
                            i < Math.round(item.rating)
                              ? "text-yellow-500"
                              : "text-gray-300"
                          }
                        />
                      ))}
                      <span className="text-black ml-1">{item.rating}/5</span>

                    </div>
                  </div>
                  <p className="mt-2 text-gray-600 text-sm">{item.desc}</p>
                  <div className="flex justify-between text-sm mt-2">
                    <div className="text-gray-500">
                      <span className="font-medium">{item.reviews}</span> Reviews ·{" "}
                      <span>{item.rate}</span> Avg. Rating
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex items-center cursor-pointer gap-1 border-2 py-2 px-2 rounded-full border-gray text-gray text-xs font-semibold"
                      >
                        <HiPencil className="text-2xl" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex items-center cursor-pointer gap-1 border-2 py-2 px-2 rounded-full border-gray text-gray text-xs font-semibold"
                      >
                        <HiTrash className="text-2xl" />
                      </button>
                      <span
                        onClick={() => toggleTick(item)}
                        className="flex items-center cursor-pointer gap-1 border-2 py-2 px-2 rounded-full border-gray text-xs font-semibold"
                      >
                        {item.tick ? (
                          <TiTick size={25} className="text-green-600" />
                        ) : (
                          <TiTickOutline size={25} className="text-red-500" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-primary to-secondary text-white">
                    <th className="px-4 py-3 text-left">Image</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Rating</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedReviews.map((item) => (
                    <tr
                      key={item.id}
                      className=" hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        {item.title}
                      </td>

                      <td className="px-4 py-3">
                        {item.user}
                      </td>

                      <td className="px-4 py-3">
                        {item.category}
                      </td>

                      <td className="px-4 py-3">
                        ⭐ {item.rating}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center"
                          >
                            <HiPencil />
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"
                          >
                            <HiTrash />
                          </button>

                          <button
                            onClick={() => toggleTick(item)}
                            className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"
                          >
                            {item.tick ? (
                              <TiTick className="text-green-600" />
                            ) : (
                              <TiTickOutline className="text-red-500" />
                            )}
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editMode ? "Edit Review" : "Add New Review"}
                </h2>

                <button
                  onClick={resetForm}
                  className="w-9 h-9 flex items-center cursor-pointer justify-center rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-500 transition"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Inputs */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Category
                  </label>

                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setNewReview({
                        ...newReview,
                        category: e.target.value,
                        title: "",
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Category</option>

                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.cname}>
                        {cat.cname}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Product
                  </label>

                  <select
                    value={newReview.title}
                    onChange={(e) =>
                      setNewReview({
                        ...newReview,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Product</option>

                    {products
                      .filter((p) => p.category === selectedCategory)
                      .map((product) => (
                        <option key={product.id} value={product.name}>
                          {product.name}
                        </option>
                      ))}
                  </select>
                </div>

                <InputField placeholder="Enter Your Name" label="Reviewer Name" value={newReview.user} onChange={(e) => setNewReview({ ...newReview, user: e.target.value })} />
                <InputField label="Rating (1 to 5)" type="number" min="1" max="5" value={newReview.rating} onChange={(e) => setNewReview({ ...newReview, rating: e.target.value })} />

                {/* Image Upload */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">
                    Upload Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewReview({ ...newReview, image: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  {newReview.image && (
                    <img
                      src={newReview.image}
                      alt="Preview"
                      className="mt-3 w-25 h-20 object-cover rounded shadow"
                    />
                  )}
                </div>

                {/* Description */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">
                    Review Description
                  </label>
                  <textarea
                    rows="4"
                    value={newReview.desc}
                    onChange={(e) =>
                      setNewReview({ ...newReview, desc: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Write something about the clothing..."
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddReview}
                  className="px-6 py-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700"
                >
                  {editMode ? "Update Review" : "Add Review"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block font-semibold text-gray-700 mb-1">{label}</label>
    <input
      {...props}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
    />
  </div>
);

export default AddReviews;
