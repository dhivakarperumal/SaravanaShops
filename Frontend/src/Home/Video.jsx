import React, { useEffect, useState } from "react";
import api from "../api/";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

// Import Swiper styles
import "swiper/css";

const Video = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await api.get("/videos");

        setVideos(response.data || []);
      } catch (error) {
        console.error("Error fetching videos:", error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-6xl px-6 mx-auto py-6 text-center text-gray-500">
        Loading videos...
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="w-full max-w-6xl px-6 mx-auto py-6 text-center text-gray-500">
        No videos available.
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl px-6 mx-auto py-10">
      <h2 className="relative text-2xl font-bold mb-8 text-left inline-block">
        Our Collection
        <span className="absolute left-0 -bottom-2 w-20 h-1 bg-gradient-to-r from-primary to-pink-400 rounded-full"></span>
      </h2>

      <Swiper
        modules={[Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        loop={true}
        autoplay={{
          delay: 7000,
          disableOnInteraction: false,
        }}
        breakpoints={{
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 4 },
        }}
        className="pb-10"
      >
        {videos.map((video) => (
          <SwiperSlide key={video.id}>
            <div className="rounded-xl overflow-hidden shadow-lg bg-gray-100">
              <video
                className="w-full h-[400px] object-cover"
                src={video.url}
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Video;