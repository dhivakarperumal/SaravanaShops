// Checkout.jsx
import React, { useEffect, useState } from "react";
import api from "../api";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Head from "../Components/Head";
import { IoIosArrowForward } from "react-icons/io";
import emailjs from "@emailjs/browser";
import { FaLocationDot } from "react-icons/fa6";

/* ----------------------------- Static lists ------------------------------ */
const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const countryList = ["India", "Malaysia", "Singapore", "UAE"];

/* ----------------------------- Helpers ---------------------------------- */


const loadScript = (src) => {
  return new Promise((resolve) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);
    const hasRazorpay = typeof window !== "undefined" && !!window.Razorpay;

    if (existingScript) {
      if (hasRazorpay) return resolve(true);
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      resolve(typeof window !== "undefined" && !!window.Razorpay);
    };
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const ensureRazorpay = async () => {
  if (typeof window !== "undefined" && window.Razorpay) {
    return true;
  }

  const url = "https://checkout.razorpay.com/v1/checkout.js";
  const maxAttempts = 2;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;
    const loaded = await loadScript(url);
    if (loaded && typeof window !== "undefined" && window.Razorpay) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return false;
};

/* ----------------------------- Component -------------------------------- */
const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Razorpay key
  const [razorpayKey, setRazorpayKey] = useState(null);

  // Cart / buy now flow
  const [cartItems, setCartItems] = useState([]);
  const [isBuyNow, setIsBuyNow] = useState(false);

  // Totals & shipping
  const [subtotal, setSubtotal] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);

  // UI & state
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  // Shipping address form
  const [shipping, setShipping] = useState({
    name: "",
    email: "",
    phone: "",
    doorNumber: "",
    streetName: "",
    address: "",
    landmark: "", // new field
    city: "",
    state: "",
    zip: "",
    country: "India",
  });


  const [errors, setErrors] = useState({});
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [addressSearch, setAddressSearch] = useState("");
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    const initPayment = async () => {
      try {
        // Fetch Razorpay key
        const res = await api.get("/razorpay");

        if (Array.isArray(res.data) && res.data.length > 0) {
          const validKey = res.data.find(
            (item) =>
              item?.key_id &&
              typeof item.key_id === "string" &&
              item.key_id.trim() !== "" &&
              item.key_id.trim().toLowerCase() !== "undefined" &&
              item.key_id.trim().toLowerCase() !== "null"
          );

          if (validKey) {
            setRazorpayKey(validKey.key_id.trim());
          } else {
            console.warn("No valid Razorpay key found:", res.data);
          }
        }

        // Pre-load Razorpay SDK on mount for instant payment opening
        const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        if (!loaded || !window.Razorpay) {
          console.error("Razorpay SDK failed to load", { loaded, hasRazorpay: !!window.Razorpay });
          toast.error("Failed to load payment SDK. Please refresh and try again.");
        } else {
          console.log("Razorpay SDK pre-loaded");
        }
      } catch (err) {
        console.error("Error initializing payment:", err);
        toast.error("Could not initialize payment service. Please try again later.");
      }
    };
    initPayment();
  }, []);

  /* ---------------------- Load saved addresses (if any) ------------------ */
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.user_id || user?.id;
    if (!user) return;

    const fetchAddresses = async () => {
      try {
        const res = await api.get(`/addresses/${userId}`);

        setSavedAddresses(res.data || []);
        const addrs = res.data || [];

        setSavedAddresses(addrs);

        if (addrs.length > 0 && !selectedAddressId) {
          setSelectedAddressId(addrs[0].id);
        }
      } catch (err) {
        console.error("Error fetching addresses:", err);
      }
    };

    fetchAddresses();
  }, [selectedAddressId]);

  /* ------------------------- Pre-fill user email ------------------------ */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/auth/profile");

        if (data?.user) {
          setShipping((prev) => ({
            ...prev,
            name: data.user.username || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
          }));
        }
      } catch (err) {
        console.error("Profile fetch failed:", err);
      }
    };

    fetchProfile();
  }, []);

  /* ---------------------- Load cart or buy-now item --------------------- */
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.user_id || user?.id;
    const buyNowOrder = location.state?.order;

    if (buyNowOrder) {
      setIsBuyNow(true);
      const item = {
        id: buyNowOrder.productId || "temp_buy_now",
        productId: buyNowOrder.productId || "temp_buy_now",
        name: buyNowOrder.name,
        productName: buyNowOrder.product_name || buyNowOrder.productName || "",
        sellingprice: Number(buyNowOrder.sellingprice || 0),
        quantity: Number(buyNowOrder.quantity || 1),
        size: buyNowOrder.size || "",
        color: buyNowOrder.color || "",
        image: buyNowOrder.image || "",
        category: buyNowOrder.category || "",
        count: buyNowOrder.count || "",
      };
      setCartItems([item]);
      setSubtotal(item.sellingprice * item.quantity);
      setTotalQuantity(item.quantity);
      setLoading(false);
      return;
    }

    if (!user) {
      setCartItems([]);
      setSubtotal(0);
      setTotalQuantity(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Realtime snapshot of user cart
    const fetchCart = async () => {
      try {
        const res = await api.get(`/cart/${userId}`);

        const items = res.data || [];

        setCartItems(items);

        const total = items.reduce(
          (acc, it) =>
            acc +
            (parseFloat(it.sellingprice) || 0) *
            (it.quantity || 1),
          0
        );

        const qty = items.reduce(
          (a, b) => a + (b.quantity || 1),
          0
        );

        setSubtotal(total);
        setTotalQuantity(qty);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load cart");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();

  }, [location.state]); // eslint-disable-line

  /* ------------------------- Shipping calculation ----------------------- */
  useEffect(() => {
    // original logic: base cost depends on state + extra blocks for > 6 dozen
    // Here we used totalQuantity directly; keep the old bucket logic
    const computeShipping = () => {
      const totalDozen = Math.ceil(totalQuantity); // the original used Math.ceil(totalQuantity)
      let baseCost = 0;
      const southStates = ["Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];
      const tamilNadu = "Tamil Nadu";
      const northStates = indianStates.filter(
        (st) => ![...southStates, tamilNadu].includes(st)
      );

      if (shipping.state === tamilNadu) baseCost = 60;
      else if (southStates.includes(shipping.state)) baseCost = 80;
      else if (northStates.includes(shipping.state)) baseCost = 200;
      else baseCost = 0;

      if (totalDozen <= 6) {
        setShippingCost(baseCost);
      } else {
        const extraDozenBlocks = Math.ceil((totalDozen - 4) / 4);
        setShippingCost(baseCost + extraDozenBlocks * 20);
      }
    };

    computeShipping();
  }, [totalQuantity, shipping.state]);

  /* ------------------------- Form handlers ----------------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
    // clear the field error if any
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const err = {};

    // Name validation
    if (!shipping.name) {
      err.name = "Customer name is required";
    } else if (shipping.name.length < 3) {
      err.name = "Name must be at least 3 characters";
    }

    // Door number validation
    // if (!shipping.doorNumber) {
    //   err.doorNumber = "Door number is required";
    // }

    // Street name validation
    if (!shipping.streetName) {
      err.streetName = "Street name is required";
    }

    // Address validation
    if (!shipping.address) {
      err.address = "Address is required";
    }

    // Phone validation (exactly 10 digits)
    if (!shipping.phone) {
      err.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(shipping.phone)) {
      err.phone = "Enter valid 10-digit mobile number";
    }

    // Email validation
    if (!shipping.email) {
      err.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) {
      err.email = "Enter valid email address";
    }

    // Pincode validation (exactly 6 digits)
    if (!shipping.zip) {
      err.zip = "Pincode is required";
    } else if (!/^\d{6}$/.test(shipping.zip)) {
      err.zip = "Enter valid 6-digit pincode";
    }

    // Other required fields
    if (!shipping.city) err.city = "City is required";
    if (!shipping.state) err.state = "State is required";
    if (!shipping.landmark) err.landmark = "Landmark is required";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const generateOrderNumber = async () => {
    const res = await api.get("/orders/generate-order-id");
    return res.data.orderId;
  };

  /* ------------------------ Clear user cart ---------------------------- */
  const clearUserCart = async (userId) => {
    await api.delete(`/cart/clear/${userId}`);
  };

  /* ------------------------ Place Order / Pay -------------------------- */
  const handlePlaceOrder = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.user_id || user?.id;
    if (!user) return toast.error("Please login first");

    if (cartItems.length === 0) {
      return toast.info("Your cart is empty");
    }

    if (!validate()) return toast.error("Please fix form errors");

    // No minimum order amount enforced — allow any subtotal

    if (!razorpayKey) {
      // still allow but warn
      toast.error("Payment key not configured. Try again later.");
      return;
    }

    setPlacing(true);

    try {
      // Generate order ID (quick, non-blocking)
      const orderId = await generateOrderNumber();
      const totalAmount = subtotal + shippingCost;
      const addressId = selectedAddressId; // Use existing address; will save new one after payment

      // Verify Razorpay SDK is ready (pre-loaded on mount or retry now)
      const razorpayReady = await ensureRazorpay();
      if (!razorpayReady) {
        toast.error("Payment SDK not ready. Please refresh page and try again.");
        setPlacing(false);
        return;
      }

      const razorpayKeyValue = razorpayKey?.toString().trim();
      if (!razorpayKeyValue || razorpayKeyValue === "undefined" || razorpayKeyValue === "null") {
        toast.error("Payment key not configured or invalid. Try again later.");
        setPlacing(false);
        return;
      }

      // Razorpay options
      const options = {
        key: razorpayKeyValue,
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        name: "Sri Saravana Shoppings",
        description: `Order ${orderId}`,
        handler: async (response) => {
          // Called after successful payment
          try {
            // Save address if new (after payment succeeds)
            const isExisting = savedAddresses.some(
              (a) =>
                (a.firstname + " " + a.lastname).trim() === shipping.name.trim() &&
                a.doorNumber === shipping.doorNumber &&
                a.streetName === shipping.streetName &&
                a.address === shipping.address &&
                a.landmark === shipping.landmark &&
                a.city === shipping.city &&
                a.state === shipping.state &&
                a.pin === shipping.zip &&
                a.contact === shipping.phone
            );

            let finalAddressId = addressId;
            if (!isExisting) {
              const addressRes = await api.post("/addresses", {
                user_id: userId,
                firstname: shipping.name.split(" ")[0],
                lastname: shipping.name.split(" ").slice(1).join(" "),
                contact: shipping.phone,
                doorNumber: shipping.doorNumber,
                streetName: shipping.streetName,
                address: shipping.address,
                landmark: shipping.landmark,
                city: shipping.city,
                state: shipping.state,
                pin: shipping.zip
              });

              finalAddressId = addressRes.data.addressId;
              setSelectedAddressId(finalAddressId);
            }

            // Save order globally and under user orders
            await api.post("/orders/create", {
              user_id: userId,
              order_id: orderId,
              items: cartItems,
              subtotal,
              shippingCost,
              total: totalAmount,
              status: "Order Placed",
              ordertype: "Shop",
              payment_id: response.razorpay_payment_id,
              payment_method: "Online",
              shipping: {
                name: shipping.name,
                email: shipping.email,
                phone: shipping.phone,
                address: `${shipping.doorNumber ? shipping.doorNumber + ", " : ""}${shipping.streetName ? shipping.streetName + ", " : ""}${shipping.address}`,
                city: shipping.city,
                state: shipping.state,
                zip: shipping.zip,
                country: shipping.country,
              },
              clientCreatedAt: new Date().toISOString(),
            });

            // Send EmailJS confirmation (ensure you use your own service/template/ID)
            try {
              await emailjs.send(
                "service_34zh5xr", // replace with your EmailJS service id
                "template_6dq4ihe", // replace with your EmailJS template id
                {
                  customer_name: shipping.name,
                  order_id: orderId,
                  order_total: totalAmount,
                  order_items: cartItems
                    .map((i) => `${(i.product_name || "N/A")} - Qty: ${i.quantity}${i.size ? " | Size: " + i.size : ""}${i.color ? " | Color: " + i.color : ""}`)
                    .join("\n"),
                  shipping_address: `${shipping.address}, ${shipping.city}, ${shipping.state} - ${shipping.zip}, ${shipping.country}`,
                  to_email: shipping.email,
                },
                "n7WhNO4flv5T-P16y" // replace with your EmailJS user id / public key
              );
            } catch (emailErr) {
              console.warn("EmailJS send failed:", emailErr);
            }

            // Clear user cart unless it's buy now
            if (!isBuyNow) {
              await clearUserCart(userId);
            }

            toast.success(`Payment successful — order ${orderId} placed`);
            navigate("/account", { state: { tab: "orders" }, replace: true });
          } catch (err) {
            console.error("Error saving order after payment:", err);
            toast.error("Order save failed after payment. Contact support.");
          } finally {
            setPlacing(false);
          }
        },
        prefill: { name: shipping.name, contact: shipping.phone, email: shipping.email },
        notes: { orderId },
        theme: { color: "#ec4899" },
      };

      // Open Razorpay UI
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("handlePlaceOrder error:", err);
      toast.error("Failed to place order. Try again.");
      setPlacing(false);
    }
  };

  /* ------------------------- Effects for saved address ------------------ */
  useEffect(() => {
    if (!selectedAddressId || savedAddresses.length === 0) return;
    const selected = savedAddresses.find((a) => a.id === selectedAddressId);
    if (selected) {
      setShipping((prev) => ({
        ...prev,
        name: `${selected.firstname || ""} ${selected.lastname || ""}`.trim(),
        phone: selected.contact || "",
        doorNumber: selected.doorNumber || "",  // Add door number
        streetName: selected.streetName || "",  // Add street name
        address: selected.address || "",
        landmark: selected.landmark || "",
        city: selected.city || "",
        state: selected.state || "",
        zip: selected.pin || "",
        country: prev.country || "India",
      }));
    }
  }, [selectedAddressId, savedAddresses]); // eslint-disable-line

  /* ---------------------------- Render UI ------------------------------- */
  if (loading) {
    return (
      <>
        <Head title="Checkout" />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Loading checkout...</p>
        </div>
      </>
    );
  }

  const totalPayable = subtotal + shippingCost;

  const filteredAddresses = savedAddresses.filter((addr) => {
    const search = addressSearch.toLowerCase();

    return (
      `${addr.firstname || ""} ${addr.lastname || ""}`
        .toLowerCase()
        .includes(search) ||
      (addr.contact || "").toLowerCase().includes(search) ||
      (addr.address || "").toLowerCase().includes(search) ||
      (addr.city || "").toLowerCase().includes(search) ||
      (addr.state || "").toLowerCase().includes(search)
    );
  });
  const selectAddress = (addr) => {
    setSelectedAddressId(addr.id);

    setShipping((prev) => ({
      ...prev,
      name: `${addr.firstname || ""} ${addr.lastname || ""}`.trim(),
      phone: addr.contact || "",
      doorNumber: addr.doorNumber || "",
      streetName: addr.streetName || "",
      address: addr.address || "",
      landmark: addr.landmark || "",
      city: addr.city || "",
      state: addr.state || "",
      zip: addr.pin || "",
      country: "India",
    }));

    setAddressSearch(
      `${addr.firstname || ""} ${addr.lastname || ""} - ${addr.contact || ""}`
    );

    setShowAddressDropdown(false);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );

          const data = await res.json();

          const address = data.address || {};

          setShipping((prev) => ({
            ...prev,
            address: data.display_name || "",
            city:
              address.city ||
              address.town ||
              address.village ||
              "",
            state: address.state || "",
            zip: address.postcode || "",
            country: address.country || "India",
          }));

          toast.success("Location fetched successfully");
        } catch (err) {
          console.error(err);
          toast.error("Failed to fetch address");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        toast.error("Location permission denied");
        setLocationLoading(false);
      }
    );
  };

  return (
    <>
      <Head
        title="Checkout"
        subtitle={
          <>
            <Link className="text-lg font-semibold text-white" to="/">Home</Link>
            <IoIosArrowForward className="text-lg font-bold text-white mx-1" />
            <Link className="text-lg font-semibold text-white" to="/checkout">Checkout</Link>
          </>
        }
      />

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        {/* Saved addresses */}


        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping form */}
          <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-6">Shipping Details</h2>

            <div className="mb-6 relative">
              <label className="block text-sm font-medium mb-2">
                Search Saved Address
              </label>

              <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search by name, phone, address..."
                    value={addressSearch}
                    onChange={(e) => {
                      setAddressSearch(e.target.value);
                      setShowAddressDropdown(true);
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />

                  {showAddressDropdown && filteredAddresses.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => selectAddress(addr)}
                          className="p-3 border-b cursor-pointer hover:bg-gray-100"
                        >
                          <div className="font-semibold">
                            {addr.firstname} {addr.lastname}
                          </div>

                          <div className="text-sm text-gray-600">
                            {addr.contact}
                          </div>

                          <div className="text-xs text-gray-500">
                            {addr.address}, {addr.city}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary/80 cursor-pointer whitespace-nowrap flex items-center gap-2"
                >
                  <FaLocationDot />

                  {locationLoading
                    ? "Fetching..."
                    : "Current Location"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
              {/* Full Name - Full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  name="name"
                  placeholder="Enter your full name"
                  value={shipping.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name}</span>}
              </div>

              {/* Contact Info - 2 columns */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  name="phone"
                  type="tel"
                  maxLength="10"
                  placeholder="10-digit mobile number"
                  value={shipping.phone}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                {errors.phone && <span className="text-red-500 text-xs mt-1">{errors.phone}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={shipping.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email}</span>}
              </div>

              {/* Address Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Door Number</label>
                <input
                  name="doorNumber"
                  placeholder="Door/Flat/Block No."
                  value={shipping.doorNumber}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                {errors.doorNumber && <span className="text-red-500 text-xs mt-1">{errors.doorNumber}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Name</label>
                <input
                  name="streetName"
                  placeholder="Street name"
                  value={shipping.streetName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                {errors.streetName && <span className="text-red-500 text-xs mt-1">{errors.streetName}</span>}
              </div>

              {/* Full Address - Full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  placeholder="Full address"
                  value={shipping.address}
                  onChange={handleChange}
                  rows="2"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                />
                {errors.address && <span className="text-red-500 text-xs mt-1">{errors.address}</span>}
              </div>

              {/* Landmark */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                <input
                  name="landmark"
                  placeholder="Nearby landmark"
                  value={shipping.landmark}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                {errors.landmark && <span className="text-red-500 text-xs mt-1">{errors.landmark}</span>}
              </div>

              {/* City, State, PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  name="city"
                  placeholder="City/Town"
                  value={shipping.city}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                {errors.city && <span className="text-red-500 text-xs mt-1">{errors.city}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                <input
                  name="zip"
                  type="text"
                  maxLength="6"
                  placeholder="6-digit PIN code"
                  value={shipping.zip}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                {errors.zip && <span className="text-red-500 text-xs mt-1">{errors.zip}</span>}
              </div>

              {/* State and Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  name="state"
                  value={shipping.state}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300  rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="">Select State</option>
                  {indianStates.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                {errors.state && <span className="text-red-500 text-xs mt-1">{errors.state}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  name="country"
                  value={shipping.country}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  {countryList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="flex flex-col gap-4 mb-4 max-h-64 overflow-y-auto">
              {cartItems.map((it) => (
                <div key={it.id} className="flex items-center gap-3">
                  <img src={it.image || "/placeholder.jpg"} className="w-14 h-14 object-cover rounded" alt={it.product_name || it.name} />
                  <div className="flex-1 flex flex-col">
                    <span className="font-medium">{it.product_name || "N/A"}</span>
                    <span className="text-xs text-gray-500">Qty: {it.quantity || 1}</span>
                    {it.size && <span className="text-xs text-gray-400">Size: {it.size} {it.color && `| Color: ${it.color}`}</span>}
                  </div>
                  <div className="font-semibold">₹{((Number(it.sellingprice) || 0) * (it.quantity || 1)).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mb-2"><span>Subtotal:</span> <span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between mb-2"><span>Shipping:</span> <span>₹{shippingCost}</span></div>

            <div className="flex justify-between font-semibold text-lg mb-4"><span>Total:</span> <span>₹{totalPayable.toFixed(2)}</span></div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className={`w-full py-2 rounded transition font-medium ${placing ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-primary text-white hover:bg-primary/80 cursor-pointer"
                }`}
            >
              {placing ? "Placing Order..." : "Pay Online"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
