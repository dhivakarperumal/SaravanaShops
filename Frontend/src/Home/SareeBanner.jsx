import React from "react";

export default function SareeBanner() {
  return (
    <section
      className="relative w-full h-[300px] md:h-[350px] flex items-center justify-center  text-white overflow-hidden  shadow-2xl"
      style={{ backgroundImage: "url('/Image/SareeBanner.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Decorative overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00000030] to-[#00000080]" />

      

      {/* Text Content */}
      <div className="relative z-10 text-center px-6 md:px-12">
        <h3 className="text-3xl text-gray-200 font-semibold">Saree</h3>
        <h1 className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff9900] via-[#ff5e00] to-[#ff2e63] mb-3">
          Sale
        </h1>
        <p className="text-xl md:text-2xl font-semibold text-gray-100">
          UPTO <span className="text-amber-400">80% OFF</span>
        </p>
      </div>
    </section>
  );
}