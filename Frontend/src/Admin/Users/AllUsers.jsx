import React, { useState, useEffect } from "react";
import { FaEye, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";
import {
  collection,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { db } from "../../firebase";
import {
  MdOutlineArrowBackIosNew,
  MdOutlineArrowForwardIos,
} from "react-icons/md";
import { AnimatePresence } from "framer-motion";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [dateFilter, setDateFilter] = useState("All");

const [isEdit, setIsEdit] = useState(false);


  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    phone: "",
    role: "user",
    password: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 🔹 Realtime Users
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(fetchedUsers);
    });
    return () => unsubscribe();
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
                  await deleteDoc(doc(db, "users", id));
                  toast.success("User deleted successfully!", {
                    duration: 2000,
                  });
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
              className="bg-gray-300  cursor-pointer px-3 py-1 rounded"
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
    const userRef = doc(db, "users", updatedUser.id);
    await updateDoc(userRef, { role: updatedUser.role });
    toast.success("User role updated!");
    setSelectedUser(null);
    setIsEdit(false);
  } catch (err) {
    console.error("Update error:", err);
    toast.error("Failed to update role");
  }
};

  const handleAddUser = async () => {
    const { username, email, phone, role } = newUser;

    if (!username || !email || !phone || role === "select") {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const auth = getAuth();

      // 🔹 Save current admin credentials
      const currentUser = auth.currentUser;
      const adminEmail = currentUser.email;

      // 🔹 Generate password
      const firstFour = username.slice(0, 4);
      const lastFour = phone.slice(-4);
      const autoPassword = `${firstFour}${lastFour}`;

      // 🔹 Create user in Firebase Auth
      // const userCredential = await createUserWithEmailAndPassword(
      //   auth,
      //   email,
      //   autoPassword
      // );
      const { uid } = userCredential.user;

      // 🔹 Save user in Firestore using UID as doc ID
      await setDoc(doc(db, "users", uid), {
        uid,
        username,
        email,
        phone,
        role,
        password: autoPassword,
        createdAt: serverTimestamp(),
      });

      // 🔹 Re-login admin to stay logged in
      await signInWithEmailAndPassword(auth, adminEmail, "ADMIN_PASSWORD"); // replace with real admin password

      toast.success(`User created successfully! Password: ${autoPassword}`);
      setShowAddModal(false);
      setNewUser({
        username: "",
        email: "",
        phone: "",
        role: "user",
      });
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // 🔹 Search
  const filteredUsers = users
    .filter(
      (user) =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((user) => {
      if (dateFilter === "All") return true;
      const createdAt = user.createdAt?.toDate
        ? user.createdAt.toDate()
        : new Date(user.createdAt);
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

  // Place this inside AllUsers component, above the return statement
const EditForm = ({ user, onClose, onSave }) => {
  const [editedUser, setEditedUser] = useState({ ...user });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedUser);
    onClose(); // close modal after saving
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
    <div className="p-6 bg-white min-h-screen">
      {/* Search + Add */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name, email or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/4 border border-gray-300 rounded-lg px-4 py-2"
        />
        {/* <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center cursor-pointer gap-2 bg-primary text-white rounded-lg font-bold px-6 py-2"
        >
          <FaPlus /> Add New User
        </button> */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border p-2 rounded cursor-pointer"
        >
          <option value="All">All</option>
          <option value="Today">Today</option>
          <option value="This Week">This Week</option>
          <option value="This Month">This Month</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="mt-6 hidden md:block overflow-x-auto shadow rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-primary text-white">
            <tr>
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Created At</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user, ind) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4">
                    {(currentPage - 1) * pageSize + ind + 1}
                  </td>
                  <td className="py-3 px-4">{user.username}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.phone}</td>
                  <td className="py-3 px-4 capitalize">{user.role}</td>
                  <td className="py-3 px-4">
                    {user.createdAt?.toDate().toLocaleDateString() || "N/A"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(user)}
                        className="text-gray-600 cursor-pointer border p-2 rounded-full"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEditChange(user)}
                        className="text-gray-600 cursor-pointer border p-2 rounded-full"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-gray-600 cursor-pointer border p-2 rounded-full"
                      >
                        <FaTrash />
                      </button>
                    </div>
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

      {/* 📱 Mobile View — Cards */}
<div className="mt-6 space-y-4 md:hidden">
  {paginatedUsers.length > 0 ? (
    paginatedUsers.map((user, ind) => (
      <div
        key={user.id}
        className="shadow-lg rounded-lg p-4 bg-white flex flex-col gap-2"
      >
        <div className="flex justify-between">
          <span className="font-bold text-primary">
            #{(currentPage - 1) * pageSize + ind + 1}
          </span>
          <span className="capitalize bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
            {user.role}
          </span>
        </div>

        <div>
          <p className="font-semibold text-lg">{user.username}</p>
          <p className="text-gray-600 text-sm">{user.email}</p>
          <p className="text-gray-600 text-sm">{user.phone}</p>
          <p className="text-gray-500 text-xs">
            {user.createdAt?.toDate().toLocaleDateString() || "N/A"}
          </p>
        </div>

        <div className="flex gap-3 mt-2">
          <button
            onClick={() => handleView(user)}
            className="flex-1 flex justify-center items-center gap-1 border text-gray-700 border-gray-700 rounded py-2 text-sm"
          >
            <FaEye /> View
          </button>
          <button
            onClick={() => handleEditChange(user)}
            className="flex-1 flex justify-center items-center gap-1 text-gray-700 border-gray-700 border rounded py-2 text-sm"
          >
            <FaEdit /> Edit
          </button>
          <button
            onClick={() => handleDelete(user.id)}
            className="flex-1 flex justify-center items-center gap-1 text-gray-700 border border-gray-700 rounded py-2 text-sm"
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>
    ))
  ) : (
    <p className="text-center text-gray-500 py-4">No users found</p>
  )}
</div>

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

              <input
                type="text"
                disabled
                value={`${newUser.username.slice(0, 4)}${newUser.phone.slice(
                  -4
                )}`}
                className="w-full border border-gray-300 px-3 py-2 rounded bg-gray-100"
              />
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
            <p>
              <strong>Username:</strong> {selectedUser.username}
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
          </div>
        </div>
      )}

      <AnimatePresence>
  {selectedUser && isEdit && (
    <div
      className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="bg-white p-6 rounded-lg w-full max-w-md"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
      >
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
