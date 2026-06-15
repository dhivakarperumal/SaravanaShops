import React, { useEffect, useState } from "react";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaSortAlphaDown,
  FaSortAlphaUp,
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

const NewUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  // 🔽 Fetch users from Firestore
  const fetchUsers = async () => {
    try {
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

      const usersQuery = query(
        collection(db, "users"),
        where("createdAt", ">=", startOfToday),
        where("createdAt", "<", startOfTomorrow)
      );

      const snapshot = await getDocs(usersQuery);
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
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
      const name = user.name?.toLowerCase() || "";
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
        ? (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase())
        : (b.name || "").toLowerCase().localeCompare((a.name || "").toLowerCase())
    );

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteDoc(doc(db, "users", id));
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
      const userRef = doc(db, "users", updatedUser.id);
      await updateDoc(userRef, {
        name: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
      });
      fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, { role: newRole });
      fetchUsers();
    } catch (err) {
      console.error("Role update error:", err);
    }
  };

  return (
    <div className="p-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Search by name, email, or phone"
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500" />
        </div>
        <button
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600"
          onClick={() => setSortAsc(!sortAsc)}
        >
          {sortAsc ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
          {sortAsc ? "Sort A-Z" : "Sort Z-A"}
        </button>
      </div>

   <div className="mt-6">
  {/* Desktop Table */}
  <div className="hidden md:block bg-white shadow rounded-lg overflow-x-auto">
    <table className="min-w-full text-sm text-left">
      <thead className="bg-primary text-white">
        <tr>
          <th className="py-3 px-4">ID</th>
          <th className="py-3 px-4">Name</th>
          <th className="py-3 px-4">Email</th>
          <th className="py-3 px-4">Phone</th>
          <th className="py-3 px-4">Role</th>
      
          <th className="py-3 px-4 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user, ind) => (
            <tr key={user.id} className="hover:bg-gray-50 transition">
              <td className="py-3 px-4">{ind + 1}</td>
              <td className="py-3 px-4">{user.username}</td>
              <td className="py-3 px-4">{user.email}</td>
              <td className="py-3 px-4">{user.phone}</td>
              <td className="py-3 px-4">{user.role}</td>
              
              <td className="py-3 px-4 text-center">
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => handleView(user)}
                    className="text-gray-500 cursor-pointer border p-1 rounded-full hover:text-blue-800"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => handleEditClick(user)}
                    className="text-gray-500 border p-1 cursor-pointer rounded-full hover:text-yellow-800"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-gray-500 border p-1 cursor-pointer rounded-full hover:text-red-800"
                  >
                    <FaTrash />
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="py-3 px-4 text-center text-gray-500">
              No users found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Mobile Card View */}
  <div className="block md:hidden space-y-4">
    {filteredUsers.length > 0 ? (
      filteredUsers.map((user, ind) => (
        <div
          key={user.id}
          className="bg-white shadow-md rounded-lg p-4 border hover:shadow-lg transition"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800">{user.username}</h3>
            <span className="text-sm text-gray-500">#{ind + 1}</span>
          </div>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Email: </span>{user.email}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Phone: </span>{user.phone}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Role: </span>{user.role}
          </p>

         

          {/* Actions */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleView(user)}
              className="text-gray-600 cursor-pointer border p-3 rounded-full"
            >
              <FaEye />
            </button>
            <button
              onClick={() => handleEditClick(user)}
              className="text-gray-600 cursor-pointer border p-3 rounded-full"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDelete(user.id)}
              className="text-gray-600 cursor-pointer border p-3 rounded-full"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      ))
    ) : (
      <p className="text-center text-gray-500">No users found</p>
    )}
  </div>
</div>


     

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
                  <p>
                    <strong>Name:</strong> {selectedUser.username}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedUser.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedUser.phone}
                  </p>
                  <p>
                    <strong>Role:</strong> {selectedUser.role}
                  </p>
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
          className="w-full border px-3 cursor-not-allowed bg-gray-200  py-2 rounded focus:outline-none focus:ring focus:ring-blue-500"
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
          className="w-full cursor-not-allowed bg-gray-200  border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-blue-500"
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
