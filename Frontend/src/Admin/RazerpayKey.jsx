import React, { useState, useEffect } from "react";

import toast from "react-hot-toast";
import { FaEdit, FaTrash } from 'react-icons/fa';

export default function RazorpayKeyForm() {
  const [name, setName] = useState("");
  const [key, setKeyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
    setName("");
    setKeyId("");
    setEditingId(null);
  };

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch existing keys
  const fetchKeys = async () => {
    try {
      const response = await fetch(`${API_URL}/razorpay`);
      if (!response.ok) throw new Error('Failed to fetch keys');
      const data = await response.json();
      setKeys(data);
    } catch (error) {
      console.error(error);
      toast.error("Error fetching keys");
    }
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
        const response = await fetch(`${API_URL}/razorpay/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, key })
        });
        if (!response.ok) throw new Error('Failed to update key');
        toast.success("Key updated successfully!");
      } else {
        const response = await fetch(`${API_URL}/razorpay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, key })
        });
        if (!response.ok) throw new Error('Failed to add key');
        toast.success("Key added successfully!");
      }

      closeModal();
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
    setKeyId(keyData.key_id || keyData.key);
    setEditingId(keyData.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this key?")) return;
    try {
      const response = await fetch(`${API_URL}/razorpay/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete key');
      toast.success("Key deleted successfully!");
      fetchKeys();
    } catch (error) {
      console.error(error);
      toast.error("Error deleting key");
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white shadow rounded-lg relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">
          Saved Razorpay Keys
          <span className="text-sm text-gray-500 font-normal ml-2">Total: {keys.length}</span>
        </h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors cursor-pointer"
        >
          + Add New Key
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingId ? "Edit Razorpay Key" : "Add Razorpay Key"}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl font-bold cursor-pointer">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-1/2 py-2 rounded text-gray-700 border border-gray-300 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-1/2 py-2 rounded text-white cursor-pointer ${
                    loading ? "bg-gray-400" : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {loading ? "Saving..." : editingId ? "Update Key" : "Save Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table Section */}

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
                <td className="px-3 py-4">{item.key_id || item.key}</td>
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
              <span className="font-semibold">Key ID:</span> {item.key_id || item.key}
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
  );
}
