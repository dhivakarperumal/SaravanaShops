import React, { useState, useEffect } from "react";

import toast from "react-hot-toast";
import { FaEdit, FaTrash, FaSearch, FaFilter, FaThLarge, FaList, FaPlus } from 'react-icons/fa';
import api from "../api";

export default function RazorpayKeyForm() {
  const [name, setName] = useState("");
  const [key, setKeyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table");

  const closeModal = () => {
    setIsModalOpen(false);
    setName("");
    setKeyId("");
    setEditingId(null);
  };



  // Fetch existing keys
  const fetchKeys = async () => {
    try {
      const response = await api.get('/razorpay');
      setKeys(response.data);
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
        await api.put(`/razorpay/${editingId}`, { name, key });
        toast.success("Key updated successfully!");
      } else {
        await api.post('/razorpay', { name, key });
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
      await api.delete(`/razorpay/${id}`);
      toast.success("Key deleted successfully!");
      fetchKeys();
    } catch (error) {
      console.error(error);
      toast.error("Error deleting key");
    }
  };

  const filteredKeys = keys.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.key_id || item.key).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto mt-10 p-1 relative">
      

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

      {/* Toolbar Section */}
      <div className="flex flex-col md:flex-row items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all text-sm"
            />
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap hidden sm:block">
            {filteredKeys.length} keys
          </span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Filters Button */}
          <button className="hidden sm:flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 bg-white hover:bg-gray-50 transition-colors text-sm font-medium">
            <FaFilter className="text-gray-700" /> Filters
          </button>
          
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#F8F9FA] p-1 rounded-xl border border-gray-200">
            <button 
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${viewMode === 'card' ? 'bg-white shadow-sm text-[#9B66FF]' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid View"
            >
              <FaThLarge size={16} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${viewMode === 'table' ? 'bg-white shadow-sm text-gray-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="List View"
            >
              <FaList size={16} />
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#B484FF] to-[#9966FF] text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm font-medium shadow-sm cursor-pointer"
          >
            <FaPlus /> Add Key
          </button>
        </div>
      </div>

      {/* Content Section */}

  {filteredKeys.length === 0 ? (
    <p className="text-gray-500 text-center border border-dashed border-gray-300 rounded-lg py-10">
      No keys found.
    </p>
  ) : (
    <>
      {/* Table View */}
      {viewMode === 'table' && (
      <div className="overflow-x-auto max-h-[500px] rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gradient-to-r from-primary to-secondary text-white">
            <tr>
              <th className="px-4 py-3 font-semibold w-16 text-center">S.No</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Key ID</th>
              <th className="px-4 py-3 text-center font-semibold w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredKeys.map((item, index) => (
              <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                <td className="px-4 py-3 text-gray-500 font-medium text-center">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{item.key_id || item.key}</td>
                <td className="px-4 py-3 text-center space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 cursor-pointer bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    title="Edit"
                  >
                    <FaEdit/>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 cursor-pointer bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    title="Delete"
                  >
                    <FaTrash/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[500px] overflow-y-auto p-2">
        {filteredKeys.map((item, index) => (
          <div
            key={item.id}
            className="group relative bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
          >
            {/* Top color strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#9B66FF] to-[#8C52FF]"></div>
            
            <div className="p-5 flex flex-col flex-grow gap-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col pr-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Key Name</span> 
                  <span className="font-semibold text-gray-800 text-lg truncate" title={item.name}>{item.name}</span>
                </div>
                <div className="bg-purple-50 text-purple-600 font-bold text-xs px-2.5 py-1 rounded-md shrink-0">
                  #{index + 1}
                </div>
              </div>
              
              <div className="flex flex-col bg-[#F8F9FA] p-3 rounded-xl border border-gray-100 mt-auto">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Key ID</span> 
                <span className="font-mono text-sm text-gray-700 break-all">{item.key_id || item.key}</span>
              </div>
            </div>

            {/* Action buttons at the bottom */}
            <div className="flex mt-auto border-t border-gray-100 bg-gray-50/30">
              <button
                onClick={() => handleEdit(item)}
                className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex justify-center items-center gap-2 border-r border-gray-100 cursor-pointer"
              >
                <FaEdit size={14} /> Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors flex justify-center items-center gap-2 cursor-pointer"
              >
                <FaTrash size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </>
  )}

    </div>
  );
}
