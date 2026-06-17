import React, { useContext, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Header from "./Components/Header";
import Footer from "./Components/Footer";
 import AOS from "aos";
import "aos/dist/aos.css";

import "react-toastify/dist/ReactToastify.css";
import ScrollNavigator from "./Components/ScrollNavigator";
import ScrollToTop from "./Components/ScrollToTop";
import { AuthContext } from "./PrivateRouter.jsx/AuthContext";

function App() {

useEffect(() => {
  AOS.init({ duration: 1000, once: true }); // once: true -> animate only once
}, []);


  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Ensure hooks are called in the same order on every render.
  // Call context/location hooks before any early returns.
  const { loginOpen } = useContext(AuthContext); // get login popup state
  const location = useLocation();

  if (loading) {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
      <div className="relative w-16 h-16" data-aos="rotate">
        {[...Array(8)].map((_, i) => {
          const angle = (i * 360) / 8;
          const style = {
            top: `${50 - 40 * Math.cos((angle * Math.PI) / 180)}%`,
            left: `${50 + 40 * Math.sin((angle * Math.PI) / 180)}%`,
          };
          return (
            <span
              key={i}
              style={style}
              className="absolute w-2 h-2 bg-primary rounded-full"
            ></span>
          );
        })}
      </div>
      <p className="mt-4 text-gray-600 text-sm animate-pulse">
        Loading, please wait...
      </p>
    </div>
  );
}


  // Hide header/navbar/footer if login popup is open for a protected page
  const hideLayout = loginOpen && location.pathname === "/account";

  return (
    <section>
      {!hideLayout && <Header />}
      {!hideLayout && <Navbar />}
      <ScrollToTop />
      <ScrollNavigator />
      <Outlet />
      {!hideLayout && <Footer />}
    </section>
  );
}

export default App;
