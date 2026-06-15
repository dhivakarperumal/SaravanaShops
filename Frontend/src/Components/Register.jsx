// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { FaGoogle, FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
// import { auth, db } from "../firebase";
// import {
//   createUserWithEmailAndPassword,
//   updateProfile,
//   GoogleAuthProvider,
//   fetchSignInMethodsForEmail,
// } from "firebase/auth";
// import { doc, setDoc } from "firebase/firestore";
// import { toast } from "react-hot-toast";

// const Register = ({ onClose, setUser }) => {
//   const navigate = useNavigate();

//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const [formData, setFormData] = useState({
//     username: "",
//     email: "",
//     phone: "",
//     password: "",
//     confirmPassword: "",
//   });
//   const [loading, setLoading] = useState(false);

//   // handle input change
//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   // handle register form submit
//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!formData) {
//       toast.error("Invalid form data");
//       return;
//     }

//     const { username, email, phone, password, confirmPassword } = formData;

//     // Check each field individually for better error messages
//     if (!username || typeof username !== 'string' || username.trim() === '') {
//       toast.error("Please enter your full name");
//       return;
//     }

//     if (!email || typeof email !== 'string' || email.trim() === '') {
//       toast.error("Please enter your email address");
//       return;
//     }

//     if (!phone || typeof phone !== 'string' || phone.trim() === '') {
//       toast.error("Please enter your mobile number");
//       return;
//     }

//     if (!password || typeof password !== 'string') {
//       toast.error("Please enter a password");
//       return;
//     }

//     if (!confirmPassword || typeof confirmPassword !== 'string') {
//       toast.error("Please confirm your password");
//       return;
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email.trim())) {
//       toast.error("Please enter a valid email address");
//       return;
//     }

//     if (password !== confirmPassword) {
//       toast.error("Passwords do not match!");
//       return;
//     }

//     const trimmedEmail = email.trim();
//     const trimmedUsername = username.trim();
//     const trimmedPhone = phone.trim();

//     if (!trimmedEmail || typeof trimmedEmail !== "string") {
//       toast.error("Invalid email address format");
//       return;
//     }

//     if (!trimmedUsername || typeof trimmedUsername !== "string") {
//       toast.error("Invalid name format");
//       return;
//     }

//     if (!trimmedPhone || typeof trimmedPhone !== "string") {
//       toast.error("Invalid phone number format");
//       return;
//     }

//     if (password.length < 6) {
//       toast.error("Password must be at least 6 characters long");
//       return;
//     }

//     setLoading(true);

//     try {
//       // 🔒 Check if email is already registered
//       let methods = [];
//       try {
//         methods = await fetchSignInMethodsForEmail(auth, trimmedEmail);
//       } catch (error) {
//         console.warn("fetchSignInMethodsForEmail failed:", error);
//         toast.error("Unable to validate email. Please try again later.");
//         setLoading(false);
//         return;
//       }

//       if (methods && methods.length > 0) {
//         toast.error("This email is already registered. Please log in.");
//         setLoading(false);
//         return;
//       }

//       // ✅ Create user in Firebase Auth
//       const userCredential = await createUserWithEmailAndPassword(
//         auth,
//         trimmedEmail,
//         password
//       );
//       const user = userCredential.user;

//       if (!user || !user.uid) {
//         throw new Error("Failed to create user account");
//       }

//       // ✅ Update Firebase display name
//       await updateProfile(user, { displayName: trimmedUsername });

//       // ✅ Save user details to Firestore
//       const newUser = {
//         uid: user.uid,
//         username: trimmedUsername,
//         email: trimmedEmail,
//         phone: trimmedPhone,
//         role: "user",
//         createdAt: new Date(),
//       };

//       try {
//         await setDoc(doc(db, "users", user.uid), newUser);
//       } catch (firestoreError) {
//         console.error("Firestore Error:", firestoreError);
//         // If Firestore save fails, we should delete the auth user to maintain consistency
//         try {
//           await user.delete();
//         } catch (deleteError) {
//           console.error("Error deleting auth user:", deleteError);
//         }
//         throw new Error("Failed to save user data");
//       }

//       // ✅ Update local state
//       if (setUser) setUser(newUser);

//       toast.success("Registration successful!");
//       navigate("/");

//     } catch (error) {
//       console.error("Registration Error:", error);
      
//       // Handle specific Firebase Auth errors
//       if (error.code === 'auth/email-already-in-use') {
//         toast.error("This email is already registered. Please try logging in instead.");
//       } else if (error.code === 'auth/invalid-email') {
//         toast.error("Invalid email format. Please check your email address.");
//       } else if (error.code === 'auth/operation-not-allowed') {
//         toast.error("Email/password registration is not enabled. Please try another method.");
//       } else if (error.code === 'auth/weak-password') {
//         toast.error("Password is too weak. Please choose a stronger password.");
//       } else {
//         // For other errors, show a generic message
//         toast.error(error.message || "Registration failed. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // handle modal close
//   const handleClose = () => {
//     if (onClose) onClose();
//     navigate("/");
//   };

//   return (
//     <div
//       className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
//       onClick={handleClose}
//     >
//       <div
//         className="bg-white w-96 p-6 rounded-2xl shadow-xl relative flex flex-col items-center"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Close Button */}
//         <button
//           onClick={handleClose}
//           className="absolute top-3 right-3 text-gray-500 hover:text-purple-600 cursor-pointer"
//         >
//           <FaTimes size={20} />
//         </button>

//         {/* Logo */}
//         <img src="/Image/logo.png" alt="Logo" className="w-20 mb-6" />

//         <h2 className="text-2xl font-bold text-purple-600 mb-6">Register</h2>

//         {/* Form */}
//         <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
//           <input
//             type="text"
//             name="username"
//             placeholder="Full Name"
//             value={formData.username}
//             onChange={handleChange}
//             className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm"
//           />
//           <input
//             type="email"
//             name="email"
//             placeholder="Email ID"
//             value={formData.email}
//             onChange={handleChange}
//             className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm"
//           />
//           <input
//             type="tel"
//             name="phone"
//             placeholder="Mobile Number"
//             value={formData.phone}
//             onChange={handleChange}
//             className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm"
//           />

//           {/* Password */}
//           <div className="relative w-full">
//             <input
//               type={showPassword ? "text" : "password"}
//               name="password"
//               placeholder="Password"
//               value={formData.password}
//               onChange={handleChange}
//               className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm"
//             />
//             <span
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-2 top-2 text-gray-500 cursor-pointer"
//             >
//               {showPassword ? <FaEyeSlash /> : <FaEye />}
//             </span>
//           </div>

//           {/* Confirm Password */}
//           <div className="relative w-full">
//             <input
//               type={showConfirmPassword ? "text" : "password"}
//               name="confirmPassword"
//               placeholder="Confirm Password"
//               value={formData.confirmPassword}
//               onChange={handleChange}
//               className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm"
//             />
//             <span
//               onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//               className="absolute right-2 top-2 text-gray-500 cursor-pointer"
//             >
//               {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
//             </span>
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 cursor-pointer rounded-lg transition-colors disabled:opacity-70"
//           >
//             {loading ? "Registering..." : "Register"}
//           </button>
//         </form>

//         {/* Login Link */}
//         <p className="text-center text-sm text-gray-600 mt-4">
//           Already have an account?{" "}
//           <span
//             onClick={() => navigate("/login")}
//             className="text-purple-600 font-semibold cursor-pointer hover:underline"
//           >
//             Sign In
//           </span>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Register;


import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaGoogle, FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

const Register = ({ onClose, setUser }) => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  // handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // handle register form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData) {
      toast.error("Invalid form data");
      return;
    }

    const { username, email, phone, password, confirmPassword } = formData;

    // Input validation
    if (!username?.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!email?.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    if (!phone?.trim()) {
      toast.error("Please enter your mobile number");
      return;
    }
    if (!password) {
      toast.error("Please enter a password");
      return;
    }
    if (!confirmPassword) {
      toast.error("Please confirm your password");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const trimmedPhone = phone.trim();

    setLoading(true);

    try {
      // 🔒 Check if email is already registered (either by email/password or Google)
      let methods = [];
      try {
        methods = await fetchSignInMethodsForEmail(auth, trimmedEmail);
      } catch (error) {
        console.warn("fetchSignInMethodsForEmail failed:", error);
        toast.error("Unable to validate email. Please try again later.");
        setLoading(false);
        return;
      }

      if (methods && methods.length > 0) {
        if (methods.includes("google.com")) {
          toast.error("Your mail id already registered with Google login.");
        } else {
          toast.error("Your mail id already registered.");
        }
        setLoading(false);
        return;
      }

      // ✅ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );
      const user = userCredential.user;

      if (!user || !user.uid) {
        throw new Error("Failed to create user account");
      }

      // ✅ Update Firebase display name
      await updateProfile(user, { displayName: trimmedUsername });

      // ✅ Save user details to Firestore
      const newUser = {
        uid: user.uid,
        username: trimmedUsername,
        email: trimmedEmail,
        phone: trimmedPhone,
        role: "user",
        createdAt: new Date(),
      };

      try {
        await setDoc(doc(db, "users", user.uid), newUser);
      } catch (firestoreError) {
        console.error("Firestore Error:", firestoreError);
        try {
          await user.delete();
        } catch (deleteError) {
          console.error("Error deleting auth user:", deleteError);
        }
        throw new Error("Failed to save user data");
      }

      if (setUser) setUser(newUser);

      toast.success("Registration successful!");
      navigate("/");
    } catch (error) {
      console.error("Registration Error:", error);

      if (error.code === "auth/email-already-in-use") {
        toast.error("Your mail id already registered.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Invalid email format. Please check your email address.");
      } else if (error.code === "auth/operation-not-allowed") {
        toast.error("Email/password registration is not enabled.");
      } else if (error.code === "auth/weak-password") {
        toast.error("Password is too weak. Please choose a stronger one.");
      } else {
        toast.error(error.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // handle modal close
  const handleClose = () => {
    if (onClose) onClose();
    navigate("/");
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
            className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm"
          />
          <input
            type="email"
            name="email"
            placeholder="Email ID"
            value={formData.email}
            onChange={handleChange}
            className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Mobile Number"
            value={formData.phone}
            onChange={handleChange}
            className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm"
          />

          {/* Password */}
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2 text-gray-500 cursor-pointer"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Confirm Password */}
          <div className="relative w-full">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full border-b-2 border-purple-200 focus:border-purple-400 shadow-sm p-2 outline-none rounded-sm"
            />
            <span
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              className="absolute right-2 top-2 text-gray-500 cursor-pointer"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
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
          <span
            onClick={() => navigate("/login")}
            className="text-purple-600 font-semibold cursor-pointer hover:underline"
          >
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;
