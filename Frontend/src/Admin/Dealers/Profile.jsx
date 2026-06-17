import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../PrivateRouter.jsx/AuthContext";
import api from "../../api";
import toast from "react-hot-toast";

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // ✅ Fetch user data from MySQL via API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        const data = res.data.user;
        setForm({
          fullName: data.username || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        // Fallback to context user data
        if (user) {
          setForm({
            fullName: user.username || "",
            email: user.email || "",
            phone: user.phone || "",
          });
        }
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // Handle input changes
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ✅ Save updated profile info via MySQL API
  const handleSaveProfile = async () => {
    try {
      await api.put("/users/profile", {
        username: form.fullName,
        phone: form.phone,
      });

      // Update AuthContext so the header reflects the new name
      if (user) {
        const updatedUser = { ...user, username: form.fullName, phone: form.phone };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(err.response?.data?.message || "Error updating profile.");
    }
  };

  // Handle password input changes
  const handlePasswordChange = (e) =>
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  // ✅ Update password via MySQL API
  const handlePasswordUpdate = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword)
      return toast.error("Please fill all password fields!");
    if (newPassword !== confirmPassword)
      return toast.error("New passwords do not match!");
    if (newPassword.length < 6)
      return toast.error("Password must be at least 6 characters!");

    setLoading(true);

    try {
      await api.put("/users/change-password", {
        currentPassword,
        newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password updated successfully!");
    } catch (error) {
      console.error("Password update error:", error);
      const msg = error.response?.data?.message || "Failed to update password. Try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-200 mt-10 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-200 mt-10 space-y-10">
      {/* ================= PERSONAL DETAILS ================= */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-primary">
          Personal Details
        </h2>

        {/* ✅ Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-600 font-medium mb-2">
              Full Name
            </label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-2">
              Email
            </label>
            <input
              name="email"
              value={form.email}
              disabled
              className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-100 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-2">
              Phone Number
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-2">
              Last Updated
            </label>
            <input
              value={new Date().toLocaleDateString()}
              disabled
              className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-100 text-gray-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSaveProfile}
            className="bg-primary text-white font-medium px-6 py-3 rounded-lg hover:bg-primary/90 transition-all shadow cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* ================= PASSWORD UPDATE ================= */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-primary">
          Change Password
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-600 font-medium mb-2">
              Current Password
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Current Password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-2">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              placeholder="New Password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Confirm New Password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handlePasswordUpdate}
            
            className={`${
              loading
                ? "bg-gray-400  "
                : "bg-primary hover:bg-primary/90 cursor-pointer"
            } text-white font-medium px-6 py-3 rounded-lg transition-all shadow`}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
