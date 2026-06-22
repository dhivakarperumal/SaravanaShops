import React, { useState, useContext } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FaTimes, FaEye, FaEyeSlash, FaWhatsapp, FaEnvelope } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useGoogleLogin } from "@react-oauth/google";
import api from "../api";
import { toast } from "react-hot-toast";
import { AuthContext } from "../PrivateRouter.jsx/AuthContext";

const Login = ({ onClose, onOpenRegister }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Always read login() from context — works whether rendered as page or modal
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // New states for WhatsApp login
  const [loginMethod, setLoginMethod] = useState("email"); // "email" or "whatsapp"
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);

  // Where to go after a successful login
  const redirectTo = location.state?.from?.pathname || "/";

  // ── Close handler ─────────────────────────────────────────────────────────
  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
    } else {
      navigate("/");
    }
  };

  // ── Email / password login ────────────────────────────────────────────────
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
        // Use context login() — sets user in context AND localStorage
        login(response.data.user, response.data.token);
        toast.success(`Welcome back, ${response.data.user.username}!`);
        handleClose();
        navigate(redirectTo, { replace: true });
      }
    } catch (error) {
      console.error("Login Error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ── WhatsApp Login ────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/send-whatsapp-otp", { phone: phone.trim() });
      toast.success("OTP sent to your WhatsApp!");
      setShowOtpInput(true);
    } catch (error) {
      console.error("Send OTP Error:", error);
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast.error("Please enter the OTP");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/auth/verify-whatsapp-otp", {
        phone: phone.trim(),
        otp: otp.trim(),
      });
      if (response.data.token) {
        login(response.data.user, response.data.token);
        toast.success(`Welcome back, ${response.data.user.username}!`);
        handleClose();
        navigate(redirectTo, { replace: true });
      }
    } catch (error) {
      console.error("Verify OTP Error:", error);
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Google login ──────────────────────────────────────────────────────────
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const res = await api.post("/auth/google", {
          access_token: tokenResponse.access_token,
        });

        if (res.data.token) {
          login(res.data.user, res.data.token);
          toast.success(`Welcome back, ${res.data.user.username}!`);
          handleClose();
          navigate(redirectTo, { replace: true });
        }
      } catch (error) {
        console.error("Google Login Error:", error);
        const errorMessage =
          error.response?.data?.message || "Google login failed";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google Login Failed:", error);
      toast.error("Google Login Failed");
    },
  });

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white w-[450px] max-w-[90vw] p-8 rounded-2xl shadow-xl relative flex flex-col items-center"
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

        {/* Login Method Toggle */}
        <div className="flex w-full mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            className={`flex-1 py-2 rounded-md font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
              loginMethod === "email" ? "bg-white shadow text-purple-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => { setLoginMethod("email"); setShowOtpInput(false); }}
          >
            <FaEnvelope /> Email
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-md font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
              loginMethod === "whatsapp" ? "bg-[#25D366] text-white shadow" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setLoginMethod("whatsapp")}
          >
            <FaWhatsapp size={16} /> WhatsApp
          </button>
        </div>

        {/* Email Login Form */}
        {loginMethod === "email" && (
          <form className="w-full flex flex-col gap-4" onSubmit={handleLogin}>
            <div className="flex flex-col gap-1 w-full">
              <label className="text-sm font-semibold text-gray-700" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1 w-full">
              <label className="text-sm font-semibold text-gray-700" htmlFor="password">
                Password
              </label>
              <div className="relative w-full">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {/* WhatsApp Login Form */}
        {loginMethod === "whatsapp" && (
          <div className="w-full flex flex-col gap-4">
            {!showOtpInput ? (
              <>
                <div className="flex flex-col gap-1 w-full">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="phone">
                    WhatsApp Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="Enter WhatsApp number (e.g., 9876543210)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    className="w-full border-b-2 border-green-200 focus:border-[#25D366] shadow-sm p-2 outline-none rounded-sm disabled:opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full bg-[#25D366] hover:bg-green-600 text-white py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-70"
                >
                  {loading ? "Sending OTP..." : "Send OTP to WhatsApp"}
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1 w-full">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="otp">
                    Enter OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    disabled={loading}
                    className="w-full border-b-2 border-green-200 focus:border-[#25D366] shadow-sm p-2 text-center tracking-[0.5em] font-bold outline-none rounded-sm disabled:opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="w-full bg-[#25D366] hover:bg-green-600 text-white py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-70"
                >
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowOtpInput(false); setOtp(""); }}
                  className="text-sm text-gray-500 hover:text-gray-700 mt-2"
                >
                  Change phone number
                </button>
              </>
            )}
          </div>
        )}

        <div className="flex items-center w-full my-4">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-2 text-gray-500 text-sm">OR</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <button
          type="button"
          onClick={() => handleGoogleLogin()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-70"
        >
          <FcGoogle size={20} />
          Continue with Google
        </button>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{" "}
          {typeof onOpenRegister === "function" ? (
            <button
              type="button"
              onClick={() => {
                handleClose();
                setTimeout(() => onOpenRegister(), 300);
              }}
              className="text-purple-600 font-semibold cursor-pointer hover:underline bg-none border-none p-0"
            >
              Sign up
            </button>
          ) : (
            <Link
              to="/register"
              className="text-purple-600 font-semibold hover:underline"
            >
              Sign up
            </Link>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;
