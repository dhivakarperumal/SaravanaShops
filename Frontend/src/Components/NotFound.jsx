import React from "react";
import { Link } from "react-router-dom";
import { FaGem } from "react-icons/fa";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 px-6">
      <FaGem className="text-6xl text-primary mb-6 animate-bounce " />
      <h1 className="text-6xl font-extrabold mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-center">
        Oops! Page Not Found
      </h2>
      <Link
        to="/"
        className="bg-primary text-white px-6 py-3 rounded-full shadow-lg hover:bg-primary-dark transition-colors duration-300"
      >
        Go to Home
      </Link>
    </div>
  );
};

export default NotFound;