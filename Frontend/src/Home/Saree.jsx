import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import ProductCard from "../Products/ProductCard";
import ProductModal from "../Products/ProductModal";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

const Saree = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    const fetchSarees = async () => {
      try {
        const q = query(
          collection(db, "products"),
          where("category", "==", "Saree")
        );
        const querySnapshot = await getDocs(q);

        // Convert to array with JS Dates
        let sareeProducts = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : new Date(0),
          };
        });

        // Sort by createdAt descending (latest first)
        sareeProducts.sort((a, b) => b.createdAt - a.createdAt);

        // Limit to 8
        sareeProducts = sareeProducts.slice(0, 8);

        setProducts(sareeProducts);
      } catch (error) {
        console.error("Error fetching saree products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSarees();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading Saree products...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        No Saree products found.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h2 className="relative text-2xl font-bold mb-6 text-left inline-block">
        Our Sarees
        <span className="absolute left-0 -bottom-2 w-20 h-1 bg-gradient-to-r from-primary to-pink-400 rounded-full"></span>
      </h2>

      <Swiper
        modules={[Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        loop={true}
        speed={1000}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        breakpoints={{
          640: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
        }}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <div
              className="flex justify-center mb-10"
              onMouseEnter={() => swiperRef.current?.autoplay?.stop()}
              onMouseLeave={() => swiperRef.current?.autoplay?.start()}
            >
              <ProductCard
                product={product}
                onOpenModal={() => setSelectedProduct(product)}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default Saree;
