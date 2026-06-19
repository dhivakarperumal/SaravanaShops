import React, { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { IoIosArrowForward } from "react-icons/io";
import { Link } from "react-router-dom";
import { IoMdMail } from "react-icons/io";
import { MdLocationPin } from "react-icons/md";
import { LuPhoneCall } from "react-icons/lu";
import Head from "./Head";
import Button from "./Button";
import emailjs from "emailjs-com";
import PageContainer from "./PageContainer";

const Contact = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    product: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Please enter your name.";
    if (!formData.email.trim()) {
      newErrors.email = "Please enter your email.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Please enter your mobile number.";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit mobile number.";
    }
    if (!formData.product.trim()) newErrors.product = "Please enter a product.";
    if (!formData.message.trim()) newErrors.message = "Please enter a message.";
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSuccess(false);
      return;
    }

    // ✅ EmailJS integration
    emailjs
      .send(
        "service_34zh5xr", // 🔹 Replace with your EmailJS Service ID
        "template_uzymjjc", // 🔹 Replace with your Template ID
        formData,
        "n7WhNO4flv5T-P16y" // 🔹 Replace with your Public Key
      )
      .then(
        (response) => {
          console.log("Email sent successfully!", response.status, response.text);
          setSuccess(true);
          setFormData({
            name: "",
            email: "",
            phone: "",
            product: "",
            message: "",
          });
          setTimeout(() => setSuccess(false), 4000);
        },
        (error) => {
          console.error("Failed to send email:", error);
          alert("❌ Failed to send your message. Please try again later.");
        }
      );
  };

  return (
    <>
      <Head
        title="Contact Us"
        subtitle={
          <>
            <Link className="text-lg font-semibold text-white" to="/">
              Home
            </Link>
            <IoIosArrowForward className="text-lg font-bold text-white mx-1" />
            <Link className="text-lg font-semibold text-white" to="/contact">
              Contact Us
            </Link>
          </>
        }
      />

      <div className="w-full bg-gray-50">
        {/* Contact Info Section */}
        <PageContainer className="py-12 text-center">
          <h2 data-aos="flip-left" className="text-2xl md:text-4xl font-bold text-primary">
            Get in Touch With Us
          </h2>
          <p
            data-aos="flip-left"
            data-aos-delay="200"
            className="text-gray-500 mt-3 text-sm text-justify md:text-center md:text-base"
          >
            Have a question or need a custom quote? Our team is ready to help.
            Reach out now — we’ll respond within 24 hours with the answers and
            support you need.
          </p>

          <div
            data-aos="flip-right"
            data-aos-delay="100"
            className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 rounded-2xl border border-gray-200 bg-white p-6"
          >
            <div className="flex md:border-r border-gray-200 flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
              <IoMdMail size={40} className="text-primary" />
              <p className="text-gray-900 text-sm md:text-base break-words">
                srisaravanashoppings@gmail.com
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
              <MdLocationPin size={60} className="text-primary" />
              <p className="text-gray-800 text-sm md:text-base leading-relaxed">
                78/3, chetty Street Tirupattur Near AVS Mahal and Jain Temple ,
                <br />
                Pincode: 635601,
                <br />
                Tirupattur District, Tamil Nadu.
              </p>
            </div>

            <div className="flex md:border-l border-gray-200 flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
              <LuPhoneCall size={40} className="text-primary ml-2" />
              <p className="text-gray-800 text-sm md:text-base">
                7010575375, 9791316576
              </p>
            </div>
          </div>
        </PageContainer>

        {/* Form Section */}
        <PageContainer>
          <div
            data-aos="flip-right"
            data-aos-delay="200"
            className="bg-secondary/20 shadow-lg rounded-3xl p-4 sm:p-8 lg:p-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-center text-primary mb-6">
              Get In Touch
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {["name", "email", "phone", "product"].map((field, idx) => (
                <div key={idx}>
                  <input
                    type={field === "email" ? "email" : "text"}
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    placeholder={
                      field === "name"
                        ? "Your Name"
                        : field === "email"
                        ? "Your Email"
                        : field === "phone"
                        ? "Mobile Number"
                        : "Products"
                    }
                    className={`bg-white w-full px-4 py-3 rounded-lg border ${
                      errors[field] ? "border-red-500" : "border-gray-300"
                    } text-gray-900 focus:outline-none focus:border-primary`}
                  />
                  <div className="h-5">
                    <p
                      className={`text-red-500 text-sm transition-opacity duration-300 ${
                        errors[field] ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {errors[field] || "Placeholder"}
                    </p>
                  </div>
                </div>
              ))}

              <div className="md:col-span-2">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Your Message"
                  className={`bg-white w-full px-4 py-3 rounded-lg border ${
                    errors.message ? "border-red-500" : "border-gray-300"
                  } text-gray-900 focus:outline-none focus:border-primary`}
                ></textarea>
                <div className="h-5">
                  <p
                    className={`text-red-500 text-sm transition-opacity duration-300 ${
                      errors.message ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {errors.message || "Placeholder"}
                  </p>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-center mt-4 cursor-pointer">
                <Button label="Send Your Request" />
              </div>
            </form>

            {success && (
              <p className="text-green-600 text-center mt-4 font-semibold">
                ✅ Thank you! Your message has been sent successfully.
              </p>
            )}
          </div>
        </PageContainer>

        {/* Map */}
        <div data-aos="zoom-in-up" className="w-full h-[300px] md:h-[400px] lg:h-[500px]">
          <iframe
            title="Google Map"
            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7790.74506298768!2d78.569137!3d12.491449000000001!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bac558a4a8bbf27%3A0x6a4d2eae8fe0e4d4!2sSri%20Saravana%20Shoppings!5e0!3m2!1sen!2sin!4v1760509526404!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </>
  );
};

export default Contact;
