import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import toast from "react-hot-toast";
import { FaEdit, FaTrash } from 'react-icons/fa';

export default function RazorpayKeyForm() {
  const [name, setName] = useState("");
  const [key, setKeyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Fetch existing keys
  const fetchKeys = async () => {
    const querySnapshot = await getDocs(collection(db, "razorpayKeys"));
    const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setKeys(data);
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  // Add or update key
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !key) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        await updateDoc(doc(db, "razorpayKeys", editingId), {
          name,
          key,
          updatedAt: serverTimestamp(),
        });
        toast.success("Key updated successfully!");
      } else {
        const docRef = await addDoc(collection(db, "razorpayKeys"), {
          name,
          key,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "razorpayKeys", docRef.id), { docId: docRef.id });
        toast.success("Key added successfully!");
      }

      setName("");
      setKeyId("");
      setEditingId(null);
      fetchKeys();
    } catch (error) {
      console.error(error);
      toast.error("Error saving key");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (keyData) => {
    setName(keyData.name);
    setKeyId(keyData.key);
    setEditingId(keyData.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this key?")) return;
    try {
      await deleteDoc(doc(db, "razorpayKeys", id));
      toast.success("Key deleted successfully!");
      fetchKeys();
    } catch (error) {
      console.error(error);
      toast.error("Error deleting key");
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white shadow rounded-lg">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Form */}
        <div className="lg:w-1/2">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Edit Razorpay Key" : "Add Razorpay Key"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold">Key Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Enter key name"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Razorpay Key ID</label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKeyId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Enter Key ID"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded text-white cursor-pointer ${
                loading ? "bg-gray-400" : "bg-primary hover:bg-primary/90"
              }`}
            >
              {loading ? "Saving..." : editingId ? "Update Key" : "Save Key"}
            </button>
          </form>
        </div>

        {/* Right: Table */}
        {/* <div className="lg:w-1/2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Saved Razorpay Keys</h3>
            <span className="text-sm text-gray-500">
              Total: {keys.length}
            </span>
          </div>

          {keys.length === 0 ? (
            <p className="text-gray-500 text-center border border-dashed border-gray-300 rounded-lg py-10">
              No keys found.
            </p>
          ) : (
            <div className="overflow-x-auto max-h-[400px] border rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-primary text-white sticky top-0">
                  <tr>
                    <th className="px-3 py-4 text-left">Name</th>
                    <th className="px-3 py-4 text-left">Key ID</th>
                    <th className="px-3 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="px-3 py-4">{item.name}</td>
                      <td className="px-3 py-4">{item.key}</td>
                      <td className="px-3 py-4 text-center space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div> */}
        <div className="lg:w-1/2">
  <div className="flex justify-between items-center mb-3">
    <h3 className="text-lg font-semibold">Saved Razorpay Keys</h3>
    <span className="text-sm text-gray-500">Total: {keys.length}</span>
  </div>

  {keys.length === 0 ? (
    <p className="text-gray-500 text-center border border-dashed border-gray-300 rounded-lg py-10">
      No keys found.
    </p>
  ) : (
    <>
      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto max-h-[400px]  rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-primary text-white sticky top-0">
            <tr>
              <th className="px-3 py-4 text-left">Name</th>
              <th className="px-3 py-4 text-left">Key ID</th>
              <th className="px-3 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((item) => (
              <tr key={item.id} className="border border-gray-200 hover:bg-gray-50 transition">
                <td className="px-3 py-4">{item.name}</td>
                <td className="px-3 py-4">{item.key}</td>
                <td className="px-3 py-4 text-center space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="px-2 py-2 cursor-pointer bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <FaEdit/>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-2 cursor-pointer py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <FaTrash/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden flex flex-col gap-4 max-h-[400px] overflow-y-auto">
        {keys.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg shadow p-4 flex flex-col gap-2 bg-white"
          >
            <div>
              <span className="font-semibold">Name:</span> {item.name}
            </div>
            <div>
              <span className="font-semibold">Key ID:</span> {item.key}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleEdit(item)}
                className="flex-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="flex-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )}
</div>

      </div>
    </div>
  );
}
