import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import toast from "react-hot-toast";

const Profile = () => {
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

  // ✅ Fetch user data from Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const profileRef = doc(db, "users", user.uid);
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        const data = snap.data();
        setForm({
          fullName: data.username || user.displayName || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
        });
      } else {
        setForm({
          fullName: user.displayName || "",
          email: user.email || "",
          phone: "",
        });
      }
    };
    fetchProfile();
  }, []);

  // Handle input changes
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ✅ Save updated profile info
  const handleSaveProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          username: form.fullName,
          email: form.email,
          phone: form.phone,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error updating profile.");
    }
  };

  // Handle password input changes
  const handlePasswordChange = (e) =>
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  // ✅ Update password logic
  const handlePasswordUpdate = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    const user = auth.currentUser;

    if (!user) return toast.error("No user logged in!");
    if (!currentPassword || !newPassword || !confirmPassword)
      return toast.error("Please fill all password fields!");
    if (newPassword !== confirmPassword)
      return toast.error("New passwords do not match!");
    if (newPassword.length < 6)
      return toast.error("Password must be at least 6 characters!");

    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password updated successfully!");
    } catch (error) {
      console.error(error);
      if (error.code === "auth/wrong-password") {
        toast.error("Current password is incorrect!");
      } else {
        toast.error("Failed to update password. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-200 mt-10 space-y-10">
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
