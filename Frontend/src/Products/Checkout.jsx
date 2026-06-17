// Checkout.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  addDoc,
  setDoc,
  writeBatch,
  Timestamp,
  runTransaction,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Head from "../Components/Head";
import { IoIosArrowForward } from "react-icons/io";
import emailjs from "@emailjs/browser";

/**
 * Checkout component
 * - Supports 'Buy Now' and normal cart checkout
 * - Loads Razorpay key from Firestore collection 'razorpayKeys'
 * - Generates order number using a transaction document at metadata/ordersCounter
 * - Updates product stock using transactions
 * - Saves order in global orders collection + users/{uid}/orders
 * - Sends confirmation email via EmailJS
 */

/* ----------------------------- Static lists ------------------------------ */
const indianStates = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands",
  "Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi",
  "Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const countryList = ["India", "Malaysia", "Singapore", "UAE"];

/* ----------------------------- Helpers ---------------------------------- */


const loadScript = (src) => {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
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

  /* ------------------------- Fetch Razorpay key & pre-load SDK -------------- */
  useEffect(() => {
    const initPayment = async () => {
      try {
        // Fetch Razorpay key
        const snaps = await getDocs(collection(db, "razorpayKeys"));
        if (!snaps.empty) {
          // expecting first doc contains { key: "rzp_live_..." }
          const keyData = snaps.docs[0].data()?.key;
          setRazorpayKey(keyData || null);
        } else {
          console.warn("No razorpayKeys document found in Firestore.");
        }

        // Pre-load Razorpay SDK on mount for instant payment opening
        await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        console.log("Razorpay SDK pre-loaded");
      } catch (err) {
        console.error("Error initializing payment:", err);
      }
    };
    initPayment();
  }, []);

  /* ---------------------- Load saved addresses (if any) ------------------ */
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const fetchAddresses = async () => {
      try {
        const snap = await getDocs(collection(db, "users", user.uid, "addresses"));
        const addrs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSavedAddresses(addrs);
        if (addrs.length > 0 && !selectedAddressId) {
          setSelectedAddressId(addrs[0].id);
        }
      } catch (err) {
        console.error("Error fetching addresses:", err);
      }
    };

    fetchAddresses();
  }, [auth.currentUser, selectedAddressId]);

  /* ------------------------- Pre-fill user email ------------------------ */
  useEffect(() => {
    const user = auth.currentUser;
    if (user && !shipping.email) {
      setShipping((prev) => ({ ...prev, email: user.email || "" }));
    }
  }, [auth.currentUser]); // eslint-disable-line

  /* ---------------------- Load cart or buy-now item --------------------- */
  useEffect(() => {
    const user = auth.currentUser;
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
    const cartCol = collection(db, "users", user.uid, "cart");
    const unsubscribe = onSnapshot(
      cartCol,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCartItems(items);
        const total = items.reduce(
          (acc, it) => acc + (parseFloat(it.sellingprice) || 0) * (it.quantity || 1),
          0
        );
        const qty = items.reduce((a, b) => a + (b.quantity || 1), 0);
        setSubtotal(total);
        setTotalQuantity(qty);
        setLoading(false);
      },
      (err) => {
        console.error("Cart listener error:", err);
        toast.error("Failed to load cart.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [location.state, auth.currentUser]); // eslint-disable-line

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
    // Order number format requested: ORD + MM + DD + NN
    // Uses a per-day counter stored in Firestore metadata/ordersCounter_MMDD
    // Transaction increments atomically so IDs are unique for the day.
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const dayKey = `${mm}${dd}`; // e.g. '0224'
    const counterRef = doc(db, "metadata", `ordersCounter_${dayKey}`);

    const maxRetries = 5;
    let lastErr = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const orderNum = await runTransaction(db, async (tx) => {
          const docSnap = await tx.get(counterRef);
          const current = docSnap.exists() ? (docSnap.data().count || 0) : 0;
          const next = current + 1;

          // Persist the new counter with server timestamp
          tx.set(counterRef, { count: next, updatedAt: Timestamp.now() }, { merge: true });

          // Pad sequence to at least 2 digits (01..09,10..99). If >99, sequence will grow to 3+ digits
          const seq = String(next).padStart(2, "0");
          return `ORD${mm}${dd}${seq}`;
        });
        return orderNum;
      } catch (err) {
        lastErr = err;
        console.warn(`generateOrderNumber attempt ${attempt + 1} failed:`, err);
        // small backoff before retry
        await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
      }
    }

    console.error("generateOrderNumber failed after", maxRetries, "attempts:", lastErr);
    // Fallback: use MMDD + random 2-digit to reduce collision chance
    const fallbackSeq = String(Math.floor(Math.random() * 90 + 10));
    return `ORD${mm}${dd}${fallbackSeq}`;
  };

  /* ---------------------- Reduce product stock ------------------------- */
  const reduceProductStock = async (items) => {
    // For each item, run transaction on product doc
    for (const item of items) {
      const prodRef = doc(db, "products", item.productId || item.id);
      try {
        await runTransaction(db, async (tx) => {
          const prodSnap = await tx.get(prodRef);
          if (!prodSnap.exists()) return;
          const prodData = prodSnap.data();

          // bangle singlecolor with size/color stock map
          if (
            prodData.colors &&
            item.color &&
            item.size &&
            prodData.category?.toLowerCase() === "bangle" &&
            prodData.count?.toLowerCase() === "singlecolor"
          ) {
            const colorsArr = (prodData.colors || []).map((c) => {
              if (String(c.color).toLowerCase() === String(item.color).toLowerCase()) {
                const prevStock = (c.stock && c.stock[item.size] !== undefined) ? c.stock[item.size] : (c.stock ? c.stock[String(item.size)] : undefined);
                const newStockVal = Math.max(0, (Number(prevStock) || 0) - Number(item.quantity || 0));
                return {
                  ...c,
                  stock: {
                    ...c.stock,
                    [item.size]: newStockVal,
                  },
                };
              }
              return c;
            });
            tx.update(prodRef, { colors: colorsArr });
          } else if (prodData.stock !== undefined) {
            const newStock = Math.max(0, (Number(prodData.stock) || 0) - Number(item.quantity || 0));
            tx.update(prodRef, { stock: newStock });
          } else {
            // product has no tracked stock - skip
            return;
          }
        });
      } catch (err) {
        console.error("reduceProductStock transaction error for item", item, err);
        // continue to next item
      }
    }
  };

  /* ------------------------ Clear user cart ---------------------------- */
  const clearUserCart = async (uid) => {
    try {
      const cartCol = collection(db, "users", uid, "cart");
      const snap = await getDocs(cartCol);
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.error("clearUserCart error:", err);
    }
  };

  /* ------------------------ Place Order / Pay -------------------------- */
  const handlePlaceOrder = async () => {
    const user = auth.currentUser;
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

      // Verify Razorpay SDK is ready (pre-loaded on mount)
      if (!window.Razorpay) {
        toast.error("Payment SDK not ready. Please refresh page and try again.");
        setPlacing(false);
        return;
      }

      // Razorpay options
      const options = {
        key: razorpayKey,
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
              const adRef = await addDoc(collection(db, "users", user.uid, "addresses"), {
                firstname: shipping.name.split(" ")[0] || shipping.name,
                lastname: shipping.name.split(" ").slice(1).join(" ") || "",
                contact: shipping.phone,
                doorNumber: shipping.doorNumber,
                streetName: shipping.streetName,
                address: shipping.address,
                landmark: shipping.landmark,
                city: shipping.city,
                state: shipping.state,
                pin: shipping.zip,
                createdAt: Timestamp.now()
              });
              finalAddressId = adRef.id;
              setSelectedAddressId(adRef.id);
            }

            // Create order doc reference
            const orderRef = doc(collection(db, "orders"));
            const docId = orderRef.id;

            const orderPayload = {
              id: docId,
              orderId,
              userId: user.uid,
              shipping: {
                ...shipping,
                savedAddressId: finalAddressId || null,
              },
              ordertype: "Online",
                items: cartItems.map((it) => ({
                id: it.id,
                productId: it.product_id || it.id,
                name: it.product_name,
                productName: it.product_name || "",
                price: Number(it.sellingprice) || 0,
                quantity: Number(it.quantity) || 1,
                color: it.color || "",
                size: it.size || "",
                image: it.image || "",
                category: it.category || "",
                count: it.count || "",
              })),
              subtotal,
              shippingCost,
              total: totalAmount,
              paymentMethod: "Online",
              status: "Order Placed",
              createdAt: Timestamp.now(),
              paidAt: Timestamp.now(),
              paymentId: response?.razorpay_payment_id || null,
            };

            // Save order globally and under user orders
            await setDoc(orderRef, orderPayload);
            await setDoc(doc(db, "users", user.uid, "orders", docId), orderPayload);

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

            // Reduce product stock
            try {
              await reduceProductStock(cartItems);
            } catch (stockErr) {
              console.warn("Stock reduction issue:", stockErr);
            }

            // Clear user cart unless it's buy now
            if (!isBuyNow) {
              await clearUserCart(user.uid);
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
        {savedAddresses.length > 0 && (
          <div className="mb-6 max-w-7xl mx-auto px-2">
            <h3 className="font-semibold mb-3 text-primary">Select Address</h3>
            <div className={`grid gap-4 ${savedAddresses.length === 1 ? "grid-cols-1" : savedAddresses.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
              {savedAddresses.map((a) => (
                <label key={a.id} className={`p-4 border rounded hover:border-primary cursor-pointer flex flex-col gap-2 ${selectedAddressId === a.id ? "border-primary bg-primary/10" : ""}`}>
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="selectedAddress"
                      value={a.id}
                      checked={selectedAddressId === a.id}
                      onChange={() => setSelectedAddressId(a.id)}
                      className="mt-1"
                    />
                    <div className="flex flex-col gap-1">
                      <div className="text-sm text-gray-700"><span className="font-semibold">Name: </span>{a.firstname} {a.lastname}</div>
                      <div className="text-sm text-gray-700"><span className="font-semibold">Phone: </span>{a.contact}</div>
                      <div className="text-sm text-gray-700"><span className="font-semibold">Address: </span>{a.address}</div>
                      <div className="text-sm text-gray-700"><span className="font-semibold">Landmark: </span>{a.landmark}</div>
                      <div className="text-sm text-gray-700"><span className="font-semibold">City: </span>{a.city}</div>
                      <div className="text-sm text-gray-700"><span className="font-semibold">State: </span>{a.state}</div>
                      <div className="text-sm text-gray-700"><span className="font-semibold">Pincode: </span>{a.pin}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping form */}
          <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-6">Shipping Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
              {/* Full Name - Full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  name="name"
                  placeholder="Enter your full name"
                  value={shipping.name}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                  className="w-full p-3 border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                  className="w-full p-3 border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                  className="w-full p-3 border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                  className="w-full p-3 border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                  className="w-full p-3 border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
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
                  className="w-full p-3 border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                  className="w-full p-3 border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                  className="w-full p-3 border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                  className="w-full p-3 border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                  className="w-full p-3 border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
              className={`w-full py-2 rounded transition font-medium ${
                placing ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-primary text-white hover:bg-primary/80 cursor-pointer"
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
