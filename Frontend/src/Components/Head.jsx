import React from "react";

const Head = ({ subtitle, title, bgImage = "/Image/Head.jpg" }) => {
  return (
    <section
      className="relative h-[23vh] md:h-[42vh] w-full bg-cover bg-bottom flex items-start md:items-end justify-center md:justify-end overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-primary/20"></div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-12 text-left">
        <h1 className="text-2xl lg:text-4xl font-bold text-white drop-shadow-lg line-clamp-1">
          {title}
        </h1>
        <p className="mt-2 text-base lg:text-lg flex  items-center text-gray-200 drop-shadow-md">
          {subtitle}
        </p>
      </div>
    </section>
  );
};

export default Head;