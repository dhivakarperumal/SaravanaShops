


import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import AOS from "aos";
import "aos/dist/aos.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaStar } from "react-icons/fa";
import saree from "/Image/Saree5.png";
import Jewellery from "/Image/Jewellery2.png";
import Bangle from "/Image/Bangles1.png";
import Button from "../Components/Button";
import { Link } from "react-router-dom";
import PageContainer from "../Components/PageContainer";

function Hero() {
  const slides = [
    {
      image: Bangle,
      title: "Stunning Bangle Collection",
      description:
        "Vibrant bangles to complete your ethnic look with style and elegance.",
      rating: 4.7,
    },

    {
      image: Jewellery,
      title: "Exquisite Jewellery",
      description:
        "Handcrafted jewellery pieces that add sparkle to your style.",
      rating: 4.9,
    },
    {
      image: saree,
      title: "Elegant Sarees Collection",
      description:
        "Discover our premium saree collection, perfect for every occasion.",
      rating: 4.8,
    }

  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    AOS.init({ duration: 2000, once: true });
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [currentSlide]);

  const settings = {
    infinite: true,
    speed: 1500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    fade: true,
    arrows: false,
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
  };

  return (
    <div className="bg-primary/10">
      <PageContainer className="h-auto md:h-[80vh] flex flex-col md:flex-row items-center py-10 overflow-hidden">
        {/* ---------------- Left Side - Text ---------------- */}
        <div className="order-2 md:order-1 w-full md:w-1/2 flex flex-col justify-center text-center md:text-left mb-6 md:mb-0">
          <h1
            key={currentSlide}
            data-aos="fade-left"
            data-aos-delay="200"
            className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-800"
          >
            {slides[currentSlide].title}
          </h1>

          <p
            key={currentSlide + "_desc"}
            data-aos="fade-right"
            data-aos-delay="500"
            className="text-md sm:text-md md:text-xl mb-3 text-gray-600 px-2 sm:px-6 md:px-0"
          >
            {slides[currentSlide].description}
          </p>

          {/* ⭐ Rating Section */}
          <div
            key={currentSlide + "_rating"}
            data-aos="fade-left"
            data-aos-delay="600"
            className="flex justify-center md:justify-start items-center mb-5"
          >
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={`text-yellow-400 text-lg sm:text-xl mr-1 ${i < Math.floor(slides[currentSlide].rating)
                    ? "opacity-100"
                    : "opacity-40"
                  }`}
              />
            ))}
            <span className="ml-2 text-gray-700 text-sm sm:text-base font-medium">
              {slides[currentSlide].rating.toFixed(1)}
            </span>
          </div>



          <Link to="/allproducts" data-aos="fade-right" data-aos-delay="600" className="mt-3">
            <Button key={currentSlide + "_btn"} label="Shop Now" />
          </Link>
        </div>

        {/* ---------------- Right Side - Image Slider ---------------- */}
        <div className="w-full md:w-[60%] flex justify-center items-center order-1 md:order-2">
          <Slider {...settings} className="w-full">
            {slides.map((slide, index) => (
              <div key={index} className="flex justify-center">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full max-w-[500px] sm:max-w-[500px] md:max-w-none h-[350px] md:h-[450px] object-contain"
                />
              </div>
            ))}
          </Slider>
        </div>
      </PageContainer>
    </div>
  );
}

export default Hero;