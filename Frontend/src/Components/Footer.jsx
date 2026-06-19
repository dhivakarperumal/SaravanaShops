import React from "react";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";
import { MdOutlineArrowForwardIos } from "react-icons/md";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaYoutube } from "react-icons/fa";
import PageContainer from "../Components/PageContainer";

const Footer = () => {
  const services = [
    { id: 1, title: "Web Development" },
    { id: 2, title: "Mobile App Design" },
    { id: 3, title: "Digital Marketing" },
    { id: 4, title: "Graphic Design" },
    { id: 5, title: "UI/UX Strategy" },
    { id: 6, title: "E-commerce Solutions" },
  ];

  return (
    <footer className="bg-gray-50">
      <PageContainer className="py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">

          <div className="flex flex-col items-start">
            {/* Logo */}
            <img src="/Image/logo.png" alt="Srisaravana Shopping" className="w-15 mb-3" />

            {/* About Text */}
            <p className="text-justify text-gray-700 mb-4">
              Sri Saravana Shoppings is your one-stop destination for premium ethnic fashion and timeless elegance.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-4 mt-2">
              <a
                href="https://www.facebook.com/profile.php?id=100069154203002"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-white p-2 rounded-full hover:bg-primary/80 transition"
                aria-label="Facebook"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://www.instagram.com/sri_saravana_shoppings?igsh=Y3gxeG81cW5vdW96"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-white p-2 rounded-full hover:bg-primary/80 transition"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="https://wa.me/6379208198"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-white p-2 rounded-full hover:bg-primary/80 transition"
                aria-label="WhatsApp"
              >
                <FaWhatsapp />
              </a>
              <a
                href="https://youtube.com/@sri_saravana_shoppings?si=EVmiPyMuaKl6GS6G"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-white p-2 rounded-full hover:bg-primary/80 transition"
                aria-label="YouTube"
              >
                <FaYoutube />
              </a>
            </div>
          </div>
          <div className="flex flex-col items-  ml-0 md:ml-5">

            <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
              <h2 className="text-lg font-bold mb-5 text-gray-900">Contact Us</h2>
              <p className="flex items-start gap-2">
                <FaMapMarkerAlt className="text-primary mt-1 shrink-0" />
                <span>78/3, chetty Street Tirupattur Near AVS Mahal and Jain Temple </span>
              </p>
              <p className="flex  items-center gap-2">
                <FaPhoneAlt className="text-primary shrink-0" />
                <span>6379208198</span>
                <span>,</span>
                <span>7010575375</span>
              </p>
              <p className="flex items-center gap-2">
                <FaEnvelope className="text-primary shrink-0" />
                <span>srisaravanashoppings@gmail.com </span>
              </p>
            </div>
          </div>

          <div className=" ml-0 md:ml-15">
            <h2 className="text-lg font-bold mb-5 text-gray-900">Quick Links</h2>
            <ul className="space-y-3 text-gray-700 text-sm">
              {[
                { name: "Home", path: "/" },
                { name: "About Us", path: "/about" },
                { name: "Shopping", path: "/allproducts" },
                { name: "Category", path: "/category" },
                { name: "Terms & Conditions", path: "/termsandconditions" },
                { name: "Privacy Policy", path: "/privacypolicy" },
                { name: "Contact Us", path: "/contact" },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link to={link.path} className="flex items-center gap-2 hover:text-primary transition-colors">
                    <MdOutlineArrowForwardIos className="text-primary text-xs" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className=" text-left md:text-center ">
            <h2 className="text-lg font-bold mb-3 text-gray-900">Our Location</h2>

            {/* Embedded Newsletter Form */}
            <div className="w-full max-w-md mx-auto">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7790.74506298768!2d78.569137!3d12.491449000000001!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bac558a4a8bbf27%3A0x6a4d2eae8fe0e4d4!2sSri%20Saravana%20Shoppings!5e0!3m2!1sen!2sin!4v1760509526404!5m2!1sen!2sin"

                title="Newsletter Subscription"
                className="w-full "

                allowFullScreen
              ></iframe>
            </div>
          </div>

        </div>
      </PageContainer>

        <footer className="text-gray flex items-center justify-center  text-sm py-4 bg-primary/5 shadow mt-10">
          <PageContainer className="text-center">
            <div>
              © {new Date().getFullYear()} <strong>Sri Saravana Shoppings </strong>
              . All rights reserved. | Built by{" "}
              <a
                href="https://qtechx.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary font-medium"
              >
                Q-Techx Solutions
              </a>
            </div>


          </PageContainer>
        </footer>
    </footer>
  );
};

export default Footer;