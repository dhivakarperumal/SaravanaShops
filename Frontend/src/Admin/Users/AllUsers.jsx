import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash, FaEdit, FaTrash, FaPlus, FaSearch, FaFilter, FaThLarge, FaList } from "react-icons/fa";
import { toast } from "react-hot-toast";
import {
  MdOutlineArrowBackIosNew,
  MdOutlineArrowForwardIos,
} from "react-icons/md";
import { AnimatePresence } from "framer-motion";
import api from "../../api";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [dateFilter, setDateFilter] = useState("All");
  const [isEdit, setIsEdit] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    phone: "",
    role: "user",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 🔹 Fetch Users from API
  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔹 Delete User
  const handleDelete = async (id) => {
    toast(
      (t) => (
        <div className="flex flex-col">
          <span>Are you sure you want to delete this user?</span>
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={async () => {
                try {
                  await api.delete(`/users/${id}`);
                  toast.success("User deleted successfully!", {
                    duration: 2000,
                  });
                  fetchUsers();
                } catch (error) {
                  console.error("Error deleting user:", error);
                  toast.error("Failed to delete user.");
                }
                toast.dismiss(t.id);
              }}
              className="bg-red-500 cursor-pointer text-white px-3 py-1 rounded"
            >
              Yes
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-300 cursor-pointer px-3 py-1 rounded"
            >
              No
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
    setSelectedUser(null);
  };

  // 🔹 View & Edit
  const handleView = (user) => {
    setSelectedUser(user);
    setModalType("view");
  };

  const handleEditChange = (user) => {
    setSelectedUser(user);
    setIsEdit(true);
  };

  const handleModalClose = () => {
    setSelectedUser(null);
    setModalType("");
    setShowAddModal(false);
    setIsEdit(false);
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      const userId = updatedUser.user_id || updatedUser.id;
      await api.put(`/users/${userId}`, updatedUser);
      toast.success("User updated!");
      fetchUsers();
      setSelectedUser(null);
      setIsEdit(false);
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update user");
    }
  };

  const handleAddUser = async () => {
    const { username, email, phone, role, password } = newUser;

    if (!username || !email || !phone || role === "select" || !password) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await api.post('/auth/register', {
        username,
        email,
        phone,
        password,
        confirmPassword: password,
        role
      });

      toast.success("User created successfully!");
      setShowAddModal(false);
      setNewUser({
        username: "",
        email: "",
        phone: "",
        role: "user",
        password: "",
      });
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // 🔹 Search & Filter
  const filteredUsers = users
    .filter(
      (user) =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id?.toLowerCase?.().includes(searchTerm.toLowerCase())
    )
    .filter((user) => {
      if (dateFilter === "All") return true;
      const createdAt = new Date(user.created_at || user.createdAt);
      if (isNaN(createdAt.getTime())) return true;

      const now = new Date();
      if (dateFilter === "Today")
        return createdAt.toDateString() === now.toDateString();
      if (dateFilter === "This Week") {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return createdAt >= start && createdAt <= end;
      }
      if (dateFilter === "This Month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return createdAt >= start && createdAt <= end;
      }
      return true;
    });

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // EditForm component
  const EditForm = ({ user, onClose, onSave }) => {
    const [editedUser, setEditedUser] = useState({ ...user });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setEditedUser((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(editedUser);
      onClose();
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Username</label>
          <input
            type="text"
            name="username"
            value={editedUser.username}
            disabled
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={editedUser.email}
            disabled
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Phone</label>
          <input
            type="text"
            name="phone"
            value={editedUser.phone}
            disabled
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Role</label>
          <select
            name="role"
            value={editedUser.role}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded cursor-pointer bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded cursor-pointer bg-primary text-white hover:bg-primary/80"
          >
            Save
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="p-8  min-h-screen">
      {/* Toolbar Section */}
      <div className="flex flex-col md:flex-row items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all text-sm"
            />
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap hidden sm:block">
            {filteredUsers.length} users
          </span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Filters Button */}
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 bg-white hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <option value="All">All Time</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>

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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#B484FF] to-[#9966FF] text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm font-medium shadow-sm cursor-pointer"
          >
            <FaPlus /> Add User
          </button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="mt-6 overflow-x-auto shadow rounded-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gradient-to-r from-primary to-secondary text-white">
              <tr>
                <th className="py-3 px-4 font-semibold w-16 text-center">S.No</th>
                <th className="py-3 px-4 font-semibold">Username</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Created At</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user, ind) => (
                  <tr key={user.user_id || user.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-4 text-gray-500 font-medium text-center">
                      {(currentPage - 1) * pageSize + ind + 1}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">{user.username}</td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4 text-gray-600">{user.phone}</td>
                    <td className="py-3 px-4 capitalize">{user.role}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(user.created_at || user.createdAt).toLocaleDateString() || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-center space-x-2">
                      <button onClick={() => handleView(user)} className="p-2 cursor-pointer bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="View"><FaEye /></button>
                      <button onClick={() => handleEditChange(user)} className="p-2 cursor-pointer bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors" title="Edit"><FaEdit /></button>
                      <button onClick={() => handleDelete(user.user_id || user.id)} className="p-2 cursor-pointer bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Delete"><FaTrash /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Username</span>
                      <span className="font-semibold text-gray-800 text-lg truncate">{user.username}</span>
                    </div>
                    <div className="bg-purple-50 text-purple-600 font-bold text-xs px-2.5 py-1 rounded-md shrink-0">
                      S No{(currentPage - 1) * pageSize + ind + 1}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium text-gray-500">Email:</span> {user.email}</p>
                    <p><span className="font-medium text-gray-500">Phone:</span> {user.phone}</p>
                    <p><span className="font-medium text-gray-500">Role:</span> <span className="capitalize">{user.role}</span></p>
                    <p><span className="font-medium text-gray-500">Created:</span> {new Date(user.created_at || user.createdAt).toLocaleDateString() || "N/A"}</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex mt-auto border-t border-gray-100 bg-gray-50/30">
                  <button onClick={() => handleView(user)} className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex justify-center items-center gap-2 border-r border-gray-100 cursor-pointer">
                    <FaEye size={14} /> View
                  </button>
                  <button onClick={() => handleEditChange(user)} className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors flex justify-center items-center gap-2 border-r border-gray-100 cursor-pointer">
                    <FaEdit size={14} /> Edit
                  </button>
                  <button onClick={() => handleDelete(user.user_id || user.id)} className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors flex justify-center items-center gap-2 cursor-pointer">
                    <FaTrash size={14} /> Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4 col-span-full">No users found</p>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-lg relative">
            <button
              onClick={handleModalClose}
              className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-xl font-bold"
            >
              ×
            </button>

            <h3 className="text-xl font-semibold mb-4">Add New User</h3>
            <div className="space-y-3">
              <input
                type="text"
                name="username"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
                placeholder="Username"
                className="w-full border border-gray-300 px-3 py-2 rounded"
              />
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                placeholder="Email"
                className="w-full border border-gray-300 px-3 py-2 rounded"
              />
              <input
                type="text"
                name="phone"
                value={newUser.phone}
                onChange={(e) =>
                  setNewUser({ ...newUser, phone: e.target.value })
                }
                placeholder="Phone"
                className="w-full border border-gray-300 px-3 py-2 rounded"
              />
              <select
                name="role"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
                className="w-full border border-gray-300 px-3 py-2 rounded"
              >
                <option value="select">Select</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder="Password"
                  className="w-full border border-gray-300 px-3 py-2 rounded"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
              <button
                onClick={handleAddUser}
                className="w-full bg-primary cursor-pointer text-white py-2 rounded hover:bg-secondary mt-2"
              >
                Save User
              </button>
            </div>
          </div>
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

      {/* View User Modal */}
      {modalType === "view" && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-lg relative">
            <button
              onClick={handleModalClose}
              className="absolute top-2 right-3 cursor-pointer text-gray-500 hover:text-red-500 text-xl font-bold"
            >
              ×
            </button>
            <h3 className="text-xl font-semibold mb-4">View User</h3>
            <p><strong>Username:</strong> {selectedUser.username}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Phone:</strong> {selectedUser.phone}</p>
            <p><strong>Role:</strong> {selectedUser.role}</p>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      <AnimatePresence>
        {selectedUser && isEdit && (
          <div
            className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
          >
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Edit User Role</h3>
              <EditForm
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
                onSave={handleUpdateUser}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AllUsers;
