

import { useState, useEffect } from "react";
import { FaEnvelope, FaFacebook, FaPhoneAlt } from "react-icons/fa";
import { FaSquareInstagram } from "react-icons/fa6";
import { RiWhatsappFill } from "react-icons/ri";

const Header = () => {
  const offers = [
    "Get 20% off on all Bangles!",
    "New Jewellery Collection Just Arrived!",
    "Exclusive Deals on Traditional Wear!",
  ];

  const [currentOffer, setCurrentOffer] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(false); 
      setTimeout(() => {
        setCurrentOffer((prev) => (prev + 1) % offers.length);
        setAnimate(true); 
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-primary text-white text-sm py-2">
      <div className="max-w-8xl mx-auto flex justify-evenly items-center px-4 sm:px-6 lg:px-20">
        {/* Left: Phone Numbers */}
        <div className="hidden md:flex space-x-3 items-center">
          <div className="flex text-base items-center space-x-2 hover:text-white transition cursor-pointer">
            <FaPhoneAlt className="text-white" />
            <span className="font-medium text-white">+91 6379208198</span>
          </div>
        </div>

        {/* Center: Only this part re-renders */}
        <div className="flex-1 text-base text-center overflow-hidden">
          <p
            key={currentOffer} // isolate rerender to this node
            className={`font-medium transition-transform duration-300 ease-in-out transform inline-block ${
              animate ? "scale-110 opacity-100" : "scale-90 opacity-0"
            }`}
          >
            {offers[currentOffer]}
          </p>
        </div>

        {/* Right: Icons (will no longer lag or reset) */}
        <div className="hidden md:flex space-x-4 items-center">
          <a
            href="mailto:srisaravanashoppings@gmail.com"
            className="text-white hover:scale-110 transition-scale duration-400 cursor-pointer"
          >
            <FaEnvelope size={19} />
          </a>
          <a
             href="https://www.instagram.com/sri_saravana_shoppings?igsh=Y3gxeG81cW5vdW96"
            target="_blank"
            rel="noreferrer"
            className="text-white hover:scale-110 transition-scale duration-400 "
          >
            <FaSquareInstagram size={20} />
          </a>
          <a
            href="https://wa.me/6379208198"
            target="_blank"
            rel="noreferrer"
            className="text-white hover:scale-110 transition-scale duration-400 "
          >
            <RiWhatsappFill size={22} />
          </a>
          <a
             href="https://www.facebook.com/profile.php?id=100069154203002"
            target="_blank"
            rel="noreferrer"
            className="text-white hover:scale-110 transition-scale duration-400 "
          >
            <FaFacebook size={19} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Header;