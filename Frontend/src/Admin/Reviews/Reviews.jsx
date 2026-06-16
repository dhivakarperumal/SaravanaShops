import React, { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import { TiTickOutline, TiTick } from "react-icons/ti";
import { HiPencil, HiTrash } from "react-icons/hi";
import toast from "react-hot-toast";
import api from "../../api";

const AddReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [checkedIds, setCheckedIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

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

  useEffect(() => {
    fetchReviews();
  }, []);

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
        <div className="flex justify-end flex-wrap items-center mb-6">

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 border rounded-lg text-sm cursor-pointer bg-primary text-white font-bold"
          >
            Add Review
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((item) => (
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl p-6 space-y-6">
              <h2 className="text-2xl font-bold text-gray-800  pb-2">
                {editMode ? "Edit Review" : "Add New Clothing Review"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Inputs */}
                <InputField label="Product Name" value={newReview.title} onChange={(e) => setNewReview({ ...newReview, title: e.target.value })} />
                <InputField label="Category" value={newReview.category} onChange={(e) => setNewReview({ ...newReview, category: e.target.value })} />
                <InputField label="Reviewer Name" value={newReview.user} onChange={(e) => setNewReview({ ...newReview, user: e.target.value })} />
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
