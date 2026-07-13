import React from "react";
import Banner1 from "/public/Image/JewelleryBanner1.jpg";
import Banner3 from "/public/Image/JewelleryBanner3.jpg";
import Banner4 from "/public/Image/JewelleryBanner4.jpeg";
import { useNavigate } from "react-router-dom";
import PageContainer from "../Components/PageContainer";

const JewelleryBanner = () => {
  const navigate = useNavigate();
  return (
    <section className="relative mb-16 min-h-[30vh] md:min-h-[35vh] lg:min-h-[40vh] flex items-center">
      {/* Background Image Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${Banner4})`, opacity: 0.8 }}
      ></div>

      {/* Content */}
      <PageContainer className="relative py-10 text-center">
        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-serif font-semibold mb-2">
          Traditional Jewellery 
        </h1>

        <div className="flex justify-center items-center gap-2 bg-white/60 px-3 py-1.5 rounded-full text-gray-700 mx-auto w-fit mb-3 shadow-sm">
          <button onClick={() => navigate(`/allproducts`)} className="cursor-pointer"> 500+ new items </button>
        </div>

        {/* Images */}
        <div className="grid grid-cols-3 gap-4 lg:gap-10">
          <div className="rounded-2xl overflow-hidden shadow-md">
            <img
              src={Banner1}
              alt="Gold Pendant"
              className="w-full h-[110px] sm:h-[160px] md:h-[200px] lg:h-[220px] object-cover rounded-2xl bg-white p-2 sm:p-3"
            />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-md">
            <img
              src={Banner3}
              alt="Necklace"
              className="w-full h-[110px] sm:h-[160px] md:h-[200px] lg:h-[220px] object-cover rounded-2xl bg-white p-2 sm:p-3"
            />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-md">
            <img
              src={Banner4}
              alt="Necklace"
              className="w-full h-[110px] sm:h-[160px] md:h-[200px] lg:h-[220px] object-cover rounded-2xl bg-white p-2 sm:p-3"
            />
          </div>
        </div>
      </PageContainer>
    </section>
  );
};

export default JewelleryBanner;