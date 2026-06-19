import React from "react";
import { FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";
import Button from "../Components/Button";
import PageContainer from "../Components/PageContainer";

const Wholesale = () => {
  return (
    <div className="bg-primary/10">
      <PageContainer className="h-auto min-h-[30vh] flex flex-col items-center justify-center py-10 text-center">
        {/* ---------------- Text Content ---------------- */}
        <div className="w-full max-w-3xl flex flex-col items-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 text-gray-800">
            For Wholesale and Other Countries Orders
          </h1>

          {/* <p className="text-sm sm:text-sm md:text-lg mb-6 text-gray-600 px-2 sm:px-6">
         Wholesale supply available for all designs, perfect for bulk buyers. Discover our elegant collection of sarees, bangles, and jewelry, crafted to add charm and style to every occasion. 
        </p> */}

          {/* Button */}
          <a
            href="https://wa.me/6379208198"
            target="_blank"
            rel="noreferrer"
            className="mt-5"
          >
            <Button label="Contact Us" />
          </a>
        </div>
      </PageContainer>
    </div>
  );
};

export default Wholesale;
