// ✅ src/Pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaGoogle, FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { toast } from "react-hot-toast";

const Login = ({ onClose, setUser }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Close modal safely
  const handleClose = () => {
    if (onClose) onClose();
    navigate("/");
  };

  // ✅ Email/password login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim()) return toast.error("Please enter your email address");
    if (!password) return toast.error("Please enter your password");

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        toast.success(`Welcome back, ${userData.username || "User"}!`);

        if (setUser) setUser(userData);
        navigate(userData.role === "admin" ? "/superadmin" : "/");
      } else {
        toast.error("No user data found in database.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      if (error.code === "auth/invalid-email") toast.error("Invalid email format");
      else if (error.code === "auth/user-not-found") toast.error("No user found");
      else if (error.code === "auth/wrong-password") toast.error("Incorrect password");
      else toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Google login with redirect fallback
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);

    try {
      // Try popup login first
      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupError) {
        if (
          popupError.code === "auth/popup-blocked" ||
          popupError.code === "auth/popup-closed-by-user"
        ) {
          // fallback to redirect if popup fails
          await signInWithRedirect(auth, provider);
          result = await getRedirectResult(auth);
        } else {
          throw popupError;
        }
      }

      if (!result || !result.user)
        throw new Error("Failed to get user information from Google");

      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      let userData;
      if (!userSnap.exists()) {
        userData = {
          uid: user.uid,
          username: user.displayName || "Google User",
          email: user.email || "",
          phone: user.phoneNumber || "",
          role: "user",
          createdAt: new Date(),
        };
        await setDoc(userRef, userData);
      } else {
        userData = userSnap.data();
      }

      if (setUser) setUser(userData);
      toast.success(`Welcome, ${user.displayName || "User"}!`);

      // Safe redirect after login
      navigate(userData.role === "admin" ? "/superadmin" : "/");
    } catch (error) {
      console.error("Google Login Error:", error);

      if (error.message?.includes("auth/unauthorized-domain")) {
        toast.error(
          "Domain not authorized. Please add your domain in Firebase Authentication settings."
        );
      } else if (error.code === "auth/cancelled-popup-request") {
        toast.error("Popup closed before login.");
      } else {
        toast.error(error.message || "Google login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Forgot password
  const handleForgotPassword = async () => {
    if (!email.trim()) return toast.error("Please enter your email to reset password");

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error) {
      console.error("Forgot Password Error:", error);
      if (error.code === "auth/invalid-email") toast.error("Invalid email format");
      else if (error.code === "auth/user-not-found")
        toast.error("No user found with this email");
      else toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white w-96 p-6 rounded-2xl shadow-xl relative flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-purple-600 cursor-pointer"
        >
          <FaTimes size={20} />
        </button>

        {/* Logo */}
        <img src="/Image/logo.png" alt="Logo" className="w-20 mb-6" />

        <h2 className="text-2xl font-bold text-purple-600 mb-6">Login</h2>

        {/* Login Form */}
        <form className="w-full flex flex-col gap-4" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm"
          />

          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2 text-gray-500 cursor-pointer"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <span
            onClick={handleForgotPassword}
            className="text-sm text-purple-600 cursor-pointer hover:underline self-end"
          >
            Forgot Password?
          </span>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-2 w-full my-3">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-gray-500 text-sm">OR</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mt-3 flex items-center justify-center gap-2 border cursor-pointer border-purple-600 text-purple-600 hover:bg-purple-50 py-2 rounded-lg transition-colors disabled:opacity-70"
        >
          <FaGoogle /> {loading ? "Please wait..." : "Login with Google"}
        </button>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-purple-600 font-semibold cursor-pointer hover:underline"
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
