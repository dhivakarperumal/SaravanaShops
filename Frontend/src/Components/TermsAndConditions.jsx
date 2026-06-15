import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Head from "./Head";
import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";

const TermsAndConditions = () => {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white text-gray-800">
      {/* Header Section */}
      <Head
        title="Terms and Conditions"
        subtitle={
          <>
            <Link className="text-lg font-semibold text-white" to="/">
              Home
            </Link>
            <IoIosArrowForward className="text-lg font-bold text-white mx-1" />
            <Link
              className="text-lg font-semibold text-white"
              to="/termsandconditions"
            >
              Terms And Conditions
            </Link>
          </>
        }
      />

      {/* Header Section */}
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-4">
        <h1
          data-aos="fade-up"
          className="text-3xl md:text-4xl font-bold text-primary mb-2 text-left"
        >
          Terms and Conditions
        </h1>
        <p
          data-aos="fade-up"
          data-aos-delay="100"
          className="text-sm md:text-base text-gray-600 text-left"
        >
          Last Updated: October 2025
        </p>
      </div>
      <hr className="border-t border-primary/20 mt-2" />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-10 leading-relaxed text-justify space-y-8">
        <section data-aos="fade-up">
          <p>
            Welcome to{" "}
            <span className="font-semibold">Sri Saravana Shoppings</span>. These
            Terms and Conditions govern your use of our website{" "}
            <a
              href="https://www.saravanashoppings.com"
              className="text-primary hover:underline font-medium" 
              target="_blank"
            >
              www.saravanashoppings.com
            </a>{" "}
            and your purchase of products from our online store. By accessing or
            using our Website, you agree to comply with these Terms. Please read
            them carefully before using our services.
          </p>
        </section>

        {/* Section Template */}
        <section data-aos="fade-up" data-aos-delay="100">
          <h2 className="text-xl font-semibold text-primary mb-2">
            1. General Information
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Sri Saravana Shoppings is an online boutique offering glass
              bangles, jewelry, and sarees.
            </li>
            <li>
              By using our Website, you confirm that you are at least 18 years
              old or have the consent of a parent or guardian to make a
              purchase.
            </li>
          </ul>
        </section>

        <section data-aos="fade-up" data-aos-delay="150">
          <h2 className="text-xl font-semibold text-primary mb-2">
            2. Product Information
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              We make every effort to display accurate descriptions, colors, and
              images of our products. However, colors may vary slightly due to
              lighting or screen differences.
            </li>
            <li>
              All products are handmade or carefully curated, and minor
              variations may occur.
            </li>
            <li>
              Prices and availability are subject to change without notice.
            </li>
          </ul>
        </section>

        <section data-aos="fade-up" data-aos-delay="200">
          <h2 className="text-xl font-semibold text-primary mb-2">
            3. Orders and Payments
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              All orders placed are subject to acceptance and availability.
            </li>
            <li>
              We reserve the right to cancel or refuse any order for any reason
              (including stock unavailability, incorrect pricing, or suspected
              fraud).
            </li>
            <li>
              Payments can be made via secure gateways such as Razorpay, UPI,
              Credit/Debit Cards, or Net Banking.
            </li>
            <li>You agree to provide accurate billing and shipping details.</li>
          </ul>
        </section>

        <section data-aos="fade-up" data-aos-delay="250">
          <h2 className="text-xl font-semibold text-primary mb-2">
            4. Shipping and Delivery
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Orders are processed within 2–5 business days.</li>
            <li>
              We are not responsible for courier delays or unforeseen
              circumstances (like weather or strikes).
            </li>
            <li>
              Shipping charges and delivery timelines are shown during checkout.
            </li>
            <li>
              All Orders will be delivered within 7 to 14 Business Days.
            </li>
          </ul>
        </section>

        <section data-aos="fade-up" data-aos-delay="300">
          <h2 className="text-xl font-semibold text-primary mb-2">
            5. Returns, Exchanges & Refunds
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Return and Exchange are Accepted only we sent Wrong Product unless no return.
            </li>
            <li>
              Notify us within 24 hours of delivery with photo proof and Opening Video.
            </li>
            <li>Items must be unused and in original packaging.</li>
            <li>
              Glass bangles and jewelry cannot be returned unless damaged on
              arrival.
            </li>
            <li>
              Refunds (if applicable) are processed within 7–10 business days to
              the original payment method.
            </li>
          
          </ul>
        </section>

        <section data-aos="fade-up" data-aos-delay="350">
          <h2 className="text-xl font-semibold text-primary mb-2">
            6. Cancellations
          </h2>
          <p>Once order is Placed, It can't be cancelled.</p>
        </section>

        <section data-aos="fade-up" data-aos-delay="400">
          <h2 className="text-xl font-semibold text-primary mb-2">
            7. Intellectual Property
          </h2>
          <p>
            All images, product descriptions, designs, and content are owned by
            Sri Saravana Shoppings. You may not copy, reproduce, or use any
            content without prior written consent.
          </p>
        </section>

        <section data-aos="fade-up" data-aos-delay="450">
          <h2 className="text-xl font-semibold text-primary mb-2">
            8. Privacy Policy
          </h2>
          <p>
            Your personal data (name, contact, address, payment details) is
            collected only for order processing and delivery. We do not sell or
            share customer data except with logistics and payment partners to
            complete your order.
          </p>
        </section>

        <section data-aos="fade-up" data-aos-delay="500">
          <h2 className="text-xl font-semibold text-primary mb-2">
            9. Limitation of Liability
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Sri Saravana Shoppings shall not be liable for any indirect,
              incidental, or consequential damages arising from product use or
              website access.
            </li>
            <li>
              All products must be used according to their intended purpose and
              care instructions.
            </li>
          </ul>
        </section>

        <section data-aos="fade-up" data-aos-delay="550">
          <h2 className="text-xl font-semibold text-primary mb-2">
            10. Governing Law
          </h2>
          <p>
            These Terms are governed by the laws of India. Any disputes will be
            handled under the jurisdiction of Tamil Nadu courts.
          </p>
        </section>
            <section data-aos="fade-up" data-aos-delay="550">
          <h2 className="text-xl font-semibold text-primary mb-2">
            11. Re-delivery Policy
          </h2>
          <p>
           So once we will verified the defective, damaged product than only we will Re-deliver Either Exchange or Replace products within 7-14 days
          </p>
        </section>

        {/* Contact Section */}
        <section data-aos="fade-up" data-aos-delay="600">
          <h2 className="text-xl font-semibold text-primary mb-3">
            Contact Us
          </h2>
          <p className="mb-4">
            If you have any questions or complaints, please reach out to us: Name - T V R CHOUKU MUNDY
          </p>

          {/* Contact Details with Icons */}
          <div className="space-y-4">
            <div className="flex items-center gap-3" data-aos="fade-right">
              <Mail className="text-primary w-5 h-5 flex-shrink-0" />
              <a
                href="mailto:srisaravanashoppings@gmail.com"
                className="hover:underline"
              >
                srisaravanashoppings@gmail.com
              </a>
            </div>

            <div
              className="flex items-center gap-3"
              data-aos="fade-right"
              data-aos-delay="100"
            >
              <Phone className="text-primary w-5 h-5 flex-shrink-0" />
              <p>+91 7010575375, +91 9791316576</p>
            </div>

            <div
              className="flex items-center gap-3"
              data-aos="fade-right"
              data-aos-delay="200"
            >
              <MapPin className="text-primary w-5 h-5 flex-shrink-0" />
              <p>78/3, Chetty Street, Tirupattur 635601, Tamil Nadu, India</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TermsAndConditions;
