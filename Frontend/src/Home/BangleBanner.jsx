import React from "react";
import { IoArrowForward } from "react-icons/io5";
import { Link } from "react-router-dom";
import PageContainer from "../Components/PageContainer";

const BangleBanner = () => {
  const categories = [
    { name: " Baby shower Combo 1", image: "/Image/Bangles2.png" },
    { name: " Baby shower Combo 2", image: "/Image/Bangles7.png" },

    { name: " Baby shower Combo 3", image: "/Image/Bangles10.png" },
    { name: " Baby shower Combo 4", image: "/Image/Bangles8.jpeg" },
  ];

  return (
    <PageContainer className="py-4 md:py-10">
      <div className="flex flex-col md:flex-row w-full gap-6">
        {/* Left Section - Offer Banner */}
        <div className="relative md:w-1/2 w-full flex justify-center items-center">
          <img
            src="/Image/Bangles9.png"
            alt="Jewellery Offer"
            className="rounded-xl shadow-lg w-full  h-[300px] md:h-[510px]  object-cover"
          />

          {/* Overlay Content */}
          <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col justify-center items-center text-center px-4 sm:px-6">
            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-semibold mb-3 tracking-wide">
              Baby shower Combo
            </h2>

            {/* <span className="font-bold text-xl sm:text-2xl text-red-600 rounded-2xl bg-white px-3 py-1 mb-3">
            50% OFF
          </span> */}

            <Link to="/allproducts" className="text-white font-semibold px-6 py-2 rounded-full text-sm sm:text-base transition-all duration-300 underline decoration-white decoration-2 underline-offset-2 flex items-center gap-2 cursor-pointer">
              Shop Now <IoArrowForward className="mt-0.5" />
            </Link>
          </div>
        </div>

        {/* Right Section - 4 Image Grid */}
        <div className="md:w-1/2 w-full grid grid-cols-2 gap-4">
          {categories.map((item, index) => (
            <Link
              to="/allproducts"
              key={index}
              className="relative rounded-xl overflow-hidden group shadow-md cursor-pointer"
            >

              <img
                src={item.image}
                alt={item.name}
                className="w-full h-[180px] sm:h-[250px]   object-cover group-hover:scale-105 transition-transform duration-500"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent group-hover:from-black/70 transition-all duration-500"></div>
              <h3 className="absolute bottom-3 w-full text-center  left-1/2 transform -translate-x-1/2 text-white text-sm md:text-lg font-semibold tracking-wide">
                {item.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default BangleBanner;