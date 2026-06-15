// // PrivateRoute.jsx
// import React, { useContext } from "react";
// import { AuthContext } from "./AuthContext";

// const PrivateRoute = ({ children, allowedRoles = [] }) => {
//   const { user, loading, setLoginOpen } = useContext(AuthContext);

//   if (loading) return <div>Loading...</div>;

//   // Not logged in → open login popup
//   if (!user) {
//     setLoginOpen(true);
//     return null; // nothing rendered until user logs in
//   }

//   // Role check
//   if (allowedRoles.length && !allowedRoles.includes(user.role)) {
//     return <div>You are not authorized to view this page</div>;
//   }

//   return children;
// };

// export default PrivateRoute;


// import React from "react";
// import { Navigate, useLocation } from "react-router-dom";

// // Props: user (from localStorage, state, or props), allowedRoles
// const PrivateRoute = ({ children, user, allowedRoles = [] }) => {
//   const location = useLocation();

//   if (!user) {
//     // Not logged in → redirect to /login
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   if (allowedRoles.length && !allowedRoles.includes(user.role)) {
//     return (
//       <div className="p-6 text-center text-red-600">
//         You are not authorized to view this page
//       </div>
//     );
//   }

//   return children;
// };

// export default PrivateRoute;


import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUser(userSnap.data());
        } else {
          setUser({ username: currentUser.displayName || "User", role: "user" });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-6 text-center text-red-600">
        You are not authorized to view this page
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
