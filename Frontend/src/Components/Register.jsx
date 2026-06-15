import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import api from "../api";
import { toast } from "react-hot-toast";

const Register = ({ onClose, setUser }) => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { username, email, phone, password, confirmPassword } = formData;

      // Validation
      if (!username || username.trim() === "") {
        toast.error("Please enter your full name");
        setLoading(false);
        return;
      }

      if (!email || email.trim() === "") {
        toast.error("Please enter your email address");
        setLoading(false);
        return;
      }

      if (!phone || phone.trim() === "") {
        toast.error("Please enter your mobile number");
        setLoading(false);
        return;
      }

      if (!password || password.trim() === "") {
        toast.error("Please enter a password");
        setLoading(false);
        return;
      }

      if (!confirmPassword || confirmPassword.trim() === "") {
        toast.error("Please confirm your password");
        setLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        toast.error("Please enter a valid email address");
        setLoading(false);
        return;
      }

      // Password validation
      if (password !== confirmPassword) {
        toast.error("Passwords do not match!");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        toast.error("Password must be at least 6 characters long");
        setLoading(false);
        return;
      }

      // API call to register
      const response = await api.post("/auth/register", {
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
      });

      // Store token and user data
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        if (typeof setUser === 'function') {
          setUser(response.data.user);
        }
        toast.success("Registration successful!");
        if (typeof onClose === 'function') {
          onClose();
        }
        navigate("/");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Registration failed";
      toast.error(errorMessage);
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (onClose) onClose();
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

        <h2 className="text-2xl font-bold text-purple-600 mb-6">Register</h2>

        {/* Form */}
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Full Name"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
            className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm disabled:opacity-50"
          />
          <input
            type="email"
            name="email"
            placeholder="Email ID"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm disabled:opacity-50"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Mobile Number"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
            className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm disabled:opacity-50"
          />

          {/* Password */}
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
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

          {/* Confirm Password */}
          <div className="relative w-full">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-2 text-gray-500 cursor-pointer hover:text-gray-700 bg-none border-none p-0"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 cursor-pointer rounded-lg transition-colors disabled:opacity-70"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => {
              if (typeof onClose === 'function') {
                onClose();
              }
              navigate("/login");
            }}
            className="text-purple-600 font-semibold cursor-pointer hover:underline bg-none border-none p-0"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
