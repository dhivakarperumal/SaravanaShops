import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { ShoppingBag, Gift, Star } from "lucide-react";
import { Link } from "react-router-dom";
import Head from "./Head";
import PageContainer from "./PageContainer";

export default function About() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <>
      <Head title={"About Us"} />

      {/* Page-wide gradient background */}
      <div className="bg-gradient-to-b from-pink-50 via-white to-purple-50">
        <PageContainer>
          <main className="py-12 space-y-20">
            {/* Hero Section */}
            <section className="grid gap-8 md:grid-cols-2 items-center">
              <div data-aos="fade-up">
                <h1 className="text-2xl sm:text-3xl md:text-4xl text-center md:text-left font-extrabold leading-tight">
                  Welcome to{" "}
                  <span className="text-primary">Sri Saravana Shoppings</span>
                </h1>

                <p className="mt-4 px-1 text-neutral-700 text-justify text-sm sm:text-base">
                  {/* Founded by <strong>TVR Saravanan</strong> in 2022, Sri
      Saravana Shoppings started as a small Instagram shop and
      quickly grew into a beloved local outlet. Our physical shop
      opened on <strong>6 September 2024</strong> and within a year
      we've welcomed thousands of happy customers. */}
                  Sri Saravana Shoppings was Founded by <strong>TVR Saravanan</strong> in 2022. Firstly, it was just a online platform in Instagram. After getting good support from our online customers,then we started our New Shop Outlet on <strong>6 September 2024</strong>. In Our physical outlet we reach 5000 plus customers within a single year.
                </p>

                <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                  <Link
                    to="/allproducts"
                    className="inline-flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2 sm:py-2.5 bg-primary text-white text-sm sm:text-base font-medium shadow hover:opacity-90 transition"
                  >
                    <ShoppingBag size={16} />
                    Shop Now
                  </Link>

                </div>
              </div>

              <div className="order-last" data-aos="zoom-in">
                <img
                  src="/Image/about_1.png"
                  alt="Sri Saravana Shoppings store front"
                  className="w-full h-full md:h-96 object-contain rounded-2xl shadow-md"
                />
              </div>
            </section>


            {/* Our Goal */}
            <section
              className="text-center bg-gradient-to-r from-purple-50 via-pink-50 to-white py-10 rounded-3xl shadow-sm"
              data-aos="fade-up"
            >
              <h2 className="text-2xl font-semibold mb-3 text-[#4B0082]">
                Our Goal
              </h2>
              <p className="text-lg max-w-3xl mx-auto text-neutral-700 italic">
                “Our goal is to Sell the Best and Premium Products to our Beloved customers with Reasonable Prices”
              </p>
            </section>

            {/* Stats Section */}
            <section
              className="grid -mt-12 gap-8 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-3 bg-gradient-to-br from-pink-50 via-white to-purple-50 p-5 md:p-8 rounded-3xl shadow-sm"
              data-aos="fade-up"
            >
              <StatCard
                icon={<ShoppingBag size={28} />}
                value="Shop"
                highlight="78/3, Chetty Street Tirupattur, 635601"
                gradient="from-purple-100 via-pink-100 to-white"
              />

              <StatCard
                icon={<Gift size={28} />}
                value="500+ Products"
                description="We have more varieties of Jewelleries, Bangles, Sarees Collections."
                gradient="from-pink-100 via-purple-100 to-white"
              />

              <StatCard
                icon={<Star size={28} />}
                value="6000+ Happy Customers"
                description="Within one year we reached more than 6000 customers all over the world."
                gradient="from-indigo-100 via-purple-100 to-white"
              />
            </section>

            {/* Middle Image - Full width */}
            {/* <div className="relative w-full -mx-4 md:-mx-0" data-aos="zoom-in">
            <img
              src="/Image/about.jpg"
              alt="About us visual"
              className="w-screen md:w-full h-56 sm:h-72 md:h-60 object-cover"
            />
          </div> */}

            {/* Collections Section */}
            <section id="collections" className="mt-16" data-aos="fade-up">
              <h2 className="text-2xl font-semibold text-center mb-8">
                Our Collections
              </h2>
              <p className="text-center max-w-2xl mx-auto text-neutral-700 mb-10">
                At Sri Saravana Shoppings, You’ll Find best collections with affordable price range. We safely pack your orders with love and care. You don’t worry about packing after ordering products with us.
              </p>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <CollectionCard
                  title="Most Unique Imitation Jewelry"
                  description="We have more varieties of Jewel collections like Bridal, Semi Bridal, Ad Stone, Combo Sets, Bangles, Earrings, Jada Set, Hip Belt, Choker, and Haram Collections."
                  imgSrc="/Image/about_jewellery.png"
                  btnText="Shop Jewels"
                />

                <CollectionCard
                  title="Glass Bangles Collections"
                  description="We have plenty of trending bangle collections like Raindrop, Leaf Cut, Heart, Waterdrop, Moon Crystal, Cube Cut, and Plain Bangles."
                  imgSrc="/Image/about_bangles.png"
                  btnText="Shop Bangles"
                />

                <CollectionCard
                  title="Saree Collections"
                  description="Our Saree Collections aren’t just pretty — they’re also price-worthy. We have Silk, Cotton, Designer, Work, Bridal, Daily Wear, and Office Wear Sarees."
                  imgSrc="/Image/About_sarees.png"
                  btnText="Shop Sarees"
                />

              </div>
            </section>
          </main>
        </PageContainer>
      </div>
    </>
  );
}

/* --- StatCard Component --- */
function StatCard({ icon, value, highlight, description, gradient }) {
  return (
    <div
      className={`relative rounded-2xl p-6 bg-gradient-to-br ${gradient} shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
    >
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-start text-left space-y-3">
        <div className="p-3 bg-white/70 rounded-full shadow-inner">{icon}</div>
        <h3 className="text-xl font-bold text-[#4B0082]">{value}</h3>

        {highlight && (
          <p className="text-sm text-[#5E2A84] font-medium leading-snug">
            {highlight}
          </p>
        )}

        {description && (
          <p className="text-sm text-[#5E2A84] leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
}

function CollectionCard({ title, description, imgSrc, btnText }) {
  return (
    <article
      className="overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-200 via-pink-100 to-white flex flex-col"
      data-aos="fade-up"
    >
      {/* Image */}
      <div className="relative w-full h-56 -mb-12 md:mb-0 ">
        <img src={imgSrc} alt={title} className="w-full h-null md:h-full  object-contain md:object-cover" />
      </div>

      {/* Text + Button */}
      <div className="p-6 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-[#4B0082]">{title}</h3>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#5E2A84]">
            {description}
          </p>
        </div>

        <Link
          to="/category"
          state={{
            selectedCategory: btnText.includes("Saree") ? "Saree" :
              btnText.includes("Bangle") ? "Bangle" :
                btnText.includes("Jewels") ? "Jewelset" : ""
          }}
          className="mt-4 inline-block bg-primary text-white text-sm sm:text-base px-4 sm:px-5 py-2 rounded-xl hover:opacity-90 transition w-fit"
        >
          {btnText}
        </Link>

      </div>
    </article>
  );
}
