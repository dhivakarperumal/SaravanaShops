import React, { useEffect, useState } from "react";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaFilter,
  FaThLarge,
  FaList,
  FaPlus,
} from "react-icons/fa";
import {
  MdOutlineArrowBackIosNew,
  MdOutlineArrowForwardIos,
} from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";
import api from "../../api";

const NewUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 🔽 Fetch users from API
  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");

      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const startOfTomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );

      const usersList = response.data.filter((user) => {
        const createdAt = new Date(user.created_at || user.createdAt);
        if (isNaN(createdAt.getTime())) return false;
        return createdAt >= startOfToday && createdAt < startOfTomorrow;
      });

      setUsers(usersList);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const lowerSearch = searchQuery.toLowerCase();

  const filteredUsers = users
    .filter((user) => {
      const name = (user.username || user.name || "").toLowerCase();
      const email = user.email?.toLowerCase() || "";
      const phone = user.phone?.toString() || "";

      return (
        name.includes(lowerSearch) ||
        email.includes(lowerSearch) ||
        phone.includes(lowerSearch)
      );
    })
    .sort((a, b) =>
      sortAsc
        ? (a.username || a.name || "").toLowerCase().localeCompare((b.username || b.name || "").toLowerCase())
        : (b.username || b.name || "").toLowerCase().localeCompare((a.username || a.name || "").toLowerCase())
    );

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setIsEdit(false);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsEdit(true);
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      const userId = updatedUser.user_id || updatedUser.id;
      await api.put(`/users/${userId}`, updatedUser);
      fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.put(`/users/${id}`, { role: newRole });
      fetchUsers();
    } catch (err) {
      console.error("Role update error:", err);
    }
  };

  return (
    <div className="p-8">
      {/* Toolbar Section */}
      <div className="flex flex-col md:flex-row items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all text-sm"
            />
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap hidden sm:block">
            {filteredUsers.length} users
          </span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Sort Button */}
          <button
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 bg-white hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
            onClick={() => setSortAsc(!sortAsc)}
          >
            {sortAsc ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
            {sortAsc ? "A-Z" : "Z-A"}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#F8F9FA] p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                viewMode === "card"
                  ? "bg-white shadow-sm text-[#9B66FF]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title="Grid View"
            >
              <FaThLarge size={16} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                viewMode === "table"
                  ? "bg-white shadow-sm text-gray-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title="List View"
            >
              <FaList size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gradient-to-r from-primary to-secondary text-white">
              <tr>
                <th className="py-3 px-4 font-semibold w-16 text-center">S.No</th>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user, ind) => (
                  <tr
                    key={user.user_id || user.id}
                    className="hover:bg-purple-50/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-500 font-medium text-center">
                      {(currentPage - 1) * pageSize + ind + 1}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">{user.username}</td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4 text-gray-600">{user.phone}</td>
                    <td className="py-3 px-4 capitalize">{user.role}</td>
                    <td className="py-3 px-4 text-center space-x-2">
                      <button
                        onClick={() => handleView(user)}
                        className="p-2 cursor-pointer bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="View"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEditClick(user)}
                        className="p-2 cursor-pointer bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(user.user_id || user.id)}
                        className="p-2 cursor-pointer bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-3 px-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedUsers.length > 0 ? (
            paginatedUsers.map((user, ind) => (
              <div
                key={user.user_id || user.id}
                className="group relative bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Top color strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#9B66FF] to-[#8C52FF]"></div>

                <div className="p-5 flex flex-col flex-grow gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col pr-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Username
                      </span>
                      <span className="font-semibold text-gray-800 text-lg truncate">
                        {user.username}
                      </span>
                    </div>
                    <div className="bg-purple-50 text-purple-600 font-bold text-xs px-2.5 py-1 rounded-md shrink-0">
                      #{(currentPage - 1) * pageSize + ind + 1}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium text-gray-500">Email:</span> {user.email}</p>
                    <p><span className="font-medium text-gray-500">Phone:</span> {user.phone}</p>
                    <p><span className="font-medium text-gray-500">Role:</span> <span className="capitalize">{user.role}</span></p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex mt-auto border-t border-gray-100 bg-gray-50/30">
                  <button
                    onClick={() => handleView(user)}
                    className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex justify-center items-center gap-2 border-r border-gray-100 cursor-pointer"
                  >
                    <FaEye size={14} /> View
                  </button>
                  <button
                    onClick={() => handleEditClick(user)}
                    className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors flex justify-center items-center gap-2 border-r border-gray-100 cursor-pointer"
                  >
                    <FaEdit size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.user_id || user.id)}
                    className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors flex justify-center items-center gap-2 cursor-pointer"
                  >
                    <FaTrash size={14} /> Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4 col-span-full">
              No users found
            </p>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center disabled:opacity-50 cursor-pointer"
          >
            <MdOutlineArrowBackIosNew />
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              className={`w-8 h-8 flex items-center justify-center border border-primary text-primary rounded-full cursor-pointer transition-all ${
                currentPage === i + 1
                  ? "bg-primary text-white"
                  : "hover:bg-primary hover:text-white"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center disabled:opacity-50 cursor-pointer"
          >
            <MdOutlineArrowForwardIos />
          </button>
        </div>
      )}

      {/* Popup Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            className="fixed inset-0 bg-black/80 bg-opacity-40 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg w-full max-w-md"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
            >
              <h2 className="text-lg font-bold mb-4">
                {isEdit ? "Edit User" : "User Details"}
              </h2>
              {isEdit ? (
                <EditForm
                  user={selectedUser}
                  onClose={() => setSelectedUser(null)}
                  onSave={handleUpdateUser}
                />
              ) : (
                <>
                  <p><strong>Name:</strong> {selectedUser.username}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Phone:</strong> {selectedUser.phone}</p>
                  <p><strong>Role:</strong> {selectedUser.role}</p>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="mt-4 bg-blue-600 cursor-pointer text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Close
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ✅ EditForm with <select> for Role
const EditForm = ({ user, onClose, onSave }) => {
  const [editedUser, setEditedUser] = useState({ ...user });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedUser);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          type="text"
          name="name"
          value={editedUser.username}
          onChange={handleChange}
          disabled
          className="w-full pl-10 cursor-not-allowed bg-gray-200 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          name="email"
          value={editedUser.email}
          onChange={handleChange}
          disabled
          className="w-full border px-3 cursor-not-allowed bg-gray-200 py-2 rounded focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Phone</label>
        <input
          type="text"
          name="phone"
          value={editedUser.phone}
          onChange={handleChange}
          disabled
          className="w-full cursor-not-allowed bg-gray-200 border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Role</label>
        <select
          name="role"
          value={editedUser.role}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-blue-500"
        >
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 cursor-pointer bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 cursor-pointer bg-primary text-white rounded hover:bg-blue-900"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default NewUsers;
