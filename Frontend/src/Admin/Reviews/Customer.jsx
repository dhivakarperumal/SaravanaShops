import React, { useEffect, useState } from "react";
import Slider from "react-slick";
// import { getDocs, collection } from "firebase/firestore";
// import { db } from "../../firebase";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaStar } from "react-icons/fa";

const CustomerReviews = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    // const fetchReviews = async () => {
    //   try {
    //     const snap = await getDocs(collection(db, "reviews"));
    //     const data = snap.docs.map((doc) => ({
    //       id: doc.id,
    //       ...doc.data(),
    //     }));
    //     setReviews(data);
    //   } catch (error) {
    //     console.error("Error fetching reviews:", error);
    //   }
    // };
    // fetchReviews();
  }, []);

  const settings = {
    dots: true,
    infinite: reviews.length > 3,
    speed: 500,
    slidesToShow: Math.min(reviews.length, 3),
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2500,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(reviews.length, 2),
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  if (reviews.length === 0) {
    return (
      <div className="py-8 flex justify-center">
        <p className="text-gray-500">No reviews available.</p>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Slider {...settings}>
          {reviews.map((review) => (
            <div key={review.id} className="px-2">
              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow hover:shadow-lg transition-all h-full flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Left Content */}
                <div className="flex-1">
                  <p className="text-orange-500 font-semibold text-lg mb-1">
                    {review.title || "Review"}
                  </p>
                  <p className="text-gray-700 text-sm mb-2">{review.desc}</p>
                  <div className="flex items-center gap-2 mb-1">
                    <FaStar className="text-yellow-500" />
                    <span className="text-yellow-500 font-medium">
                      {review.stars || review.rating || 0}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{review.name || "Anonymous"}</p>
                </div>

                {/* Right Content */}
                <div className="flex-shrink-0 flex items-center justify-center">
                  <div className="bg-gray-100 rounded-xl w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center overflow-hidden">
                    <img
                      src={review.image || "/placeholder.png"}
                      alt={review.name || "Customer"}
                      className="object-cover w-full h-full rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default CustomerReviews;
