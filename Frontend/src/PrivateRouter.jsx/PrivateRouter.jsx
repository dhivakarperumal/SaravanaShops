import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, setLoginOpen } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    // If not logged in, redirect to home and open login modal
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-6 text-center text-red-600 font-bold mt-10">
        You are not authorized to view this page
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
