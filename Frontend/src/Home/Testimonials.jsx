import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import api from "../api";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await api.get("/reviews");

        const data = res.data.filter(
          (item) => Number(item.tick) === 1 || item.tick === true
        );

        setTestimonials(data);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // Helper function to render rating stars
  const renderStars = (rating = 5) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    return (
      <>
        {Array(fullStars)
          .fill()
          .map((_, i) => (
            <FaStar key={`full-${i}`} className="text-primary text-lg" />
          ))}
        {hasHalf && <FaStarHalfAlt className="text-primary text-lg" />}
        {Array(emptyStars)
          .fill()
          .map((_, i) => (
            <FaRegStar key={`empty-${i}`} className="text-primary text-lg" />
          ))}
      </>
    );
  };

  return (
    <div className="bg-gray-50 max-w-6xl px-6 mx-auto py-3">
      <h2 className="relative text-2xl font-bold mb-6 text-left inline-block">
        Customer Feedback
        <span className="absolute left-0 -bottom-2 w-20 h-1 bg-gradient-to-r from-primary to-secondary rounded-full"></span>
      </h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading testimonials...</p>
      ) : testimonials.length === 0 ? (
        <p className="text-center text-gray-500">No testimonials available.</p>
      ) : (
        <div className="relative">
          <Swiper
            modules={[Autoplay]}
            spaceBetween={30}
            slidesPerView={3}
            loop={true}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            breakpoints={{
              320: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {testimonials.map((t, i) => (
              <SwiperSlide key={i}>
                <div className="bg-white mb-20 shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-lg p-8 text-center mx-auto flex flex-col justify-between h-[240px] max-w-sm">
                  <div>
                    <div className="flex justify-center gap-1 mb-3">
                      {renderStars(t.rating)}
                    </div>
                    <p className="text-gray-700 mb-6 leading-relaxed line-clamp-6">
                      {t.desc}
                    </p>
                  </div>

                  <div className="flex flex-col items-center mt-auto">
                    {/* <img
                      src={t.image}
                      alt={t.user}
                      className="w-16 h-16 rounded-full mb-2 object-cover"
                    /> */}
                    <h3 className="font-semibold text-gray-900">{t.user}</h3>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
}