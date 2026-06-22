import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // Show a spinner while auth state is being restored from localStorage
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in → redirect to /login and remember where they came from
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-6 text-center text-red-600 font-bold mt-10">
        You are not authorized to view this page.
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
