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
        title="PrivacyPolicy - Sri Saravana Shoppings"
        subtitle={
          <>
            <Link className="text-lg font-semibold text-white" to="/">
              Home
            </Link>
            <IoIosArrowForward className="text-lg font-bold text-white mx-1" />
            <Link
              className="text-lg font-semibold text-white"
              to="/privacypolicy"
            >
              PrivacyPolicy
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
          Privacy Policy
        </h1>
        <p
          data-aos="fade-up"
          data-aos-delay="100"
          className="text-sm md:text-base text-gray-600 text-left"
        >
          Last Updated: November 2025
        </p>
      </div>
      <hr className="border-t border-primary/20 mt-2" />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-10 leading-relaxed text-justify space-y-8">
        <section data-aos="fade-up">
          <p>
            Welcome to{" "}
            <span className="font-semibold">Sri Saravana Shoppings</span>. At Libas, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data. {" "}
            
          </p>
        </section>

        {/* Section Template */}
        <section data-aos="fade-up" data-aos-delay="100">
          <h2 className="text-xl font-semibold text-primary mb-2">
            Information We Collect
            We collect the following types of information when you use our website:
          </h2>
          <ul className="list-disc pl-6 space-y-1">
          <li>Personal Information: Name, email address, phone number, shipping address, and billing information</li>
          <li>Order Information: Purchase history, product preferences, and payment details</li>
          <li>Technical Information: IP address, browser type, device information, and cookies</li>
          <li>Usage Data: Pages visited, time spent on site, and interaction with our content</li>
          </ul>
        
        </section>

        <section data-aos="fade-up" data-aos-delay="150">
          <h2 className="text-xl font-semibold text-primary mb-2">
          How We Use Your Information
We use the collected information for the following purposes:
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Processing and fulfilling your orders </li>
            <li>        
              Communicating with you about your purchases and account </li>
            <li>
              Providing customer support and responding to inquiries </li>
            <li>
              Personalizing your shopping experience </li>
            <li>
              Improving our website, products, and services </li>
            <li>
              Sending promotional offers and marketing communications (with your consent) </li>
            <li>
              Preventing fraud and ensuring website security </li>
            <li>
              Complying with legal obligations </li>
            <li>
              Data Storage and Security
            </li>
           
          </ul>
        </section>

        <section data-aos="fade-up" data-aos-delay="200">
          <h2 className="text-xl font-semibold text-primary mb-2">
            We implement industry-standard security measures to protect your personal information:
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
             Shopping cart data is stored locally in your browser using localStorage
             </li>
            <li>
             We use secure connections (HTTPS) to protect data transmission
            </li>
            <li>
             Payment information is processed through secure payment gateways
            </li>
            <li>
             We limit access to personal information to authorized personnel only
            </li>
            <li>
             Regular security audits and updates are performed
             </li>
            <li>
             Use of
            Cookies and Tracking
            </li>
            
          </ul>
        </section>

        <section data-aos="fade-up" data-aos-delay="250">
          <h2 className="text-xl font-semibold text-primary mb-2">
            We use cookies and similar technologies to enhance your browsing experience:
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Essential Cookies: Required for basic website functionality</li>
            <li>
             Preference Cookies: Remember your settings (e.g., dark mode preference)
            </li>
            <li>
             Analytics Cookies: Help us understand how visitors use our website
            </li>
            <li>
             Marketing Cookies: Used to deliver personalized advertisements
            </li>
            <li>
             You can control cookies through your browser settings. However, disabling cookies may affect website functionality.</li>
            
          </ul>
        </section>

        <section data-aos="fade-up" data-aos-delay="300">
          <h2 className="text-xl font-semibold text-primary mb-2">
           Third-Party Services
          </h2>
          <p className="text-base text-primary mb-2">We may share your information with trusted third-party service providers who assist us in:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Payment processing</li>
            <li>
             Shipping and delivery </li>
            <li>
             Customer support </li>
            <li>
             Email marketing </li>
            <li>
             Website analytics </li>
            <li>
             These third parties are contractually obligated to protect your data and use it only for specified purposes.
            </li>
            
          </ul>
        </section>

        <section data-aos="fade-up" data-aos-delay="350">
          <h2 className="text-xl font-semibold text-primary mb-2">
           Your Rights You have the following rights regarding your personal information:

          </h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Access: Request a copy of your personal data </li>
          <li>
            Rectification: Update or correct inaccurate information </li>
          <li>
            Deletion: Request deletion of your personal data </li>
          <li> Correction: Update or correct inaccurate information </li>

            <li>   Deletion: Request deletion of your personal data</li>
          <li> Opt-Out: Unsubscribe from marketing communications</li>
          <li> Data Portability: Receive your data in a portable format</li>
          <li> Children's Privacy
         Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
          </li>
        </ul>
        </section>

        <section data-aos="fade-up" data-aos-delay="400">
          <h2 className="text-xl font-semibold text-primary mb-2">
           Updates to Privacy Policy

          </h2>
          <p>
           We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
          </p>
        </section>

       

        {/* Contact Section */}
        <section data-aos="fade-up" data-aos-delay="600">
          <h2 className="text-xl font-semibold text-primary mb-3">
            Contact Us
          </h2>
          <p className="mb-4">
           If you have any questions or concerns about our Privacy Policy or data practices, please contact us:

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
