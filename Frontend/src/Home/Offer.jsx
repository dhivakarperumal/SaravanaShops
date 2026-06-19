import React, { useEffect, useState, useRef } from "react";
import api from "../api";
import ProductCard from "../Products/ProductCard";
import ProductModal from "../Products/ProductModal";
import PageContainer from "../Components/PageContainer";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

const Offer = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    const fetchOfferProducts = async () => {
      try {
        setLoading(true);

        const res = await api.get("/products");

        if (res.data.success) {
          const offerProducts = res.data.data
            .map((item) => {
              const mrp = Number(item.mrp || item.originalprice || 0);
              const sellingprice = Number(
                item.sellingprice || item.price || 0
              );

              const offerPercentage =
                mrp > sellingprice && mrp > 0
                  ? Math.round(((mrp - sellingprice) / mrp) * 100)
                  : 0;

              return {
                ...item,
                id: item.id,
                mrp,
                sellingprice,
                offerPercentage,
                offerBadge: offerPercentage > 0,
              };
            })
            .filter((p) => p.offerBadge)
            .sort((a, b) => b.offerPercentage - a.offerPercentage)
            .slice(0, 12);

          setProducts(offerProducts);
        }
      } catch (error) {
        console.error("Error fetching offer products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading Offer products...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        No Offer products found.
      </div>
    );
  }

  return (
    <PageContainer className="py-10">
      <h2 className="relative text-2xl font-bold mb-6 text-left inline-block">
        Offers & Deals
        <span className="absolute left-0 -bottom-2 w-20 h-1 bg-gradient-to-r from-primary to-pink-400 rounded-full"></span>
      </h2>

      <Swiper
        modules={[Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        speed={1000}
        loop={true}
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
    </PageContainer>
  );
};

export default Offer;
