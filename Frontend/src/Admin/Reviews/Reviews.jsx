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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);


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

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;

      setIsMobile(mobile);

      if (mobile) {
        setViewMode("card");
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    <div className="min-h-screen px-3 py-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto p-0 sm:p-2">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6 bg-white rounded-2xl px-3 sm:px-4 py-3 shadow-sm border border-gray-100">

          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:max-w-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
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
            {displayedReviews.length} reviews
          </span>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto justify-between sm:justify-end">

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
            {!isMobile && (
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
            )}

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

        <div className="flex gap-5 relative">

          {/* FILTER SIDEBAR */}
          {showFilters && (
            <aside className="w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-5">

                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-gray-800">
                    Filters
                  </h3>

                  <button
                    onClick={clearFilters}
                    className="text-xs text-red-500 font-semibold hover:text-red-700"
                  >
                    Clear
                  </button>
                </div>

                {/* Category */}
                <div className="mb-5">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Category
                  </h4>

                  {["", ...categoryOptions].map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 py-1 cursor-pointer"
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
                        className="accent-primary"
                      />

                      <span className="text-sm text-gray-700">
                        {cat || "All"}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Product */}
                <div className="mb-5">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Product
                  </h4>

                  {["", ...productOptions].map((product) => (
                    <label
                      key={product}
                      className="flex items-center gap-2 py-1 cursor-pointer"
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
                        className="accent-primary"
                      />

                      <span className="text-sm text-gray-700">
                        {product || "All"}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Rating */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Minimum Rating
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {["", "3", "4", "5"].map((rating) => (
                      <button
                        key={rating}
                        onClick={() =>
                          setFilters({
                            ...filters,
                            rating,
                          })
                        }
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${filters.rating === rating
                          ? "bg-yellow-400 text-white border-yellow-400"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                      >
                        {rating ? `⭐ ${rating}+` : "Any"}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </aside>
          )}

          {/* CONTENT */}
          <div className="flex-1 min-w-0">

            {(isMobile || viewMode === "card") ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayedReviews.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="h-48 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            {item.user}
                          </span>

                          <h3 className="text-lg font-semibold text-gray-800 mt-1 line-clamp-1">
                            {item.title}
                          </h3>

                          <p className="text-sm text-gray-500">
                            {item.category}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
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

                        </div>
                      </div>

                      <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                        {item.desc}
                      </p>



                      {/* Actions */}
                      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleEdit(item)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                        >
                          <HiPencil className="text-lg" />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-red-500 hover:bg-red-50 cursor-pointer"
                        >
                          <HiTrash className="text-lg" />
                        </button>

                        <button
                          onClick={() => toggleTick(item)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer"
                        >
                          {item.tick ? (
                            <TiTick size={22} className="text-green-600" />
                          ) : !isMobile && (
                            <TiTickOutline size={22} className="text-red-500" />
                          )}
                        </button>
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
                        <th className="px-4 py-3 text-left">S.No.</th>
                        <th className="px-4 py-3 text-left">Image</th>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-left">User</th>
                        <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-left">Rating</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {displayedReviews.map((item, index) => (
                        <tr
                          key={item.id}
                          className=" hover:bg-gray-50"
                        >
                          <td className="justify-center px-4 py-3">
                            {index + 1}.
                          </td>
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

          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
            <div className="bg-white w-full max-w-lg sm:max-w-3xl rounded-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0">
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

              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
                        className="mt-3 w-24 h-20 sm:w-28 sm:h-24 object-cover rounded-lg shadow"
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
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0">
                <button
                  onClick={resetForm}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddReview}
                  className="w-full sm:w-auto px-6 py-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700"
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
