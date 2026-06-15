import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../api";
import { toast } from "react-hot-toast";

const Login = ({ onClose, setUser }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Close modal safely
  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    } else {
      navigate("/");
    }
  };

  // Email/password login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        if (typeof setUser === 'function') {
          setUser(response.data.user);
        }
        toast.success(`Welcome back, ${response.data.user.username}!`);
        handleClose();
        navigate("/");
      }
    } catch (error) {
      console.error("Login Error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Login failed";
      toast.error(errorMessage);
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
            disabled={loading}
            className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm disabled:opacity-50"
          />

          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2 text-gray-500 cursor-pointer hover:text-gray-700 bg-none border-none p-0"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => {
              if (typeof onClose === 'function') {
                onClose();
              }
              navigate("/register");
            }}
            className="text-purple-600 font-semibold cursor-pointer hover:underline bg-none border-none p-0"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
