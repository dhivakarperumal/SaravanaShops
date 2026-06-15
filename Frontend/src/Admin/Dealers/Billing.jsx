import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { IoMdPrint } from "react-icons/io";
import namer from "color-namer"; // 🎨 Color name library
import toast from "react-hot-toast";
import logo from "/Image/logo.png";

export default function Billing() {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [totals, setTotals] = useState({
    totalQty: 0,
    totalMRP: 0,
    totalSelling: 0,
  });
  const [shipping, setShipping] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });
  const [shippingCost, setShippingCost] = useState(0);
  const [currentProduct, setCurrentProduct] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [orderType, setOrderType] = useState("Shop");
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

   const logoUrl = logo;

  // 🟢 Convert any color code → readable color name
  const getColorName = (colorCode) => {
    if (!colorCode) return "Unknown";
    try {
      const result = namer(colorCode, { pick: ["html"] });
      return result.html[0]?.name || colorCode;
    } catch {
      return colorCode;
    }
  };

  // 🟢 Fetch all products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      const snap = await getDocs(collection(db, "products"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(data);
    };
    fetchProducts();
  }, []);

  // 🟢 Generate incremental order number
  const generateOrderNumber = async () => {
    const counterRef = doc(db, "metadata", "ordersCounter");
    const orderNum = await runTransaction(db, async (tx) => {
      const docSnap = await tx.get(counterRef);
      const current = docSnap.exists() ? docSnap.data().count || 0 : 0;
      const next = current + 1;
      tx.set(counterRef, { count: next }, { merge: true });
      return `ORD${String(next).padStart(6, "0")}`;
    });
    return orderNum;
  };

  // --- new helper: return image for a product given selected color (and fallback)
  const getColorImage = (p, color) => {
    if (!p) return "/placeholder.jpg";
    // if colors is array of objects { color, image, images }
    if (Array.isArray(p.colors) && color) {
      const matched = p.colors.find((c) => String(c.color) === String(color));
      if (matched) {
        return (
          matched.image ||
          (Array.isArray(matched.images) && matched.images[0]) ||
          matched.images ||
          (p.images && p.images[0]) ||
          p.image ||
          "/placeholder.jpg"
        );
      }
    }
    // if colors is object keyed by color (defensive)
    if (p.colors && typeof p.colors === "object" && color) {
      const entry = p.colors[color] || Object.values(p.colors)[0];
      if (entry) {
        return (entry.image || (Array.isArray(entry.images) && entry.images[0])) || p.images?.[0] || p.image || "/placeholder.jpg";
      }
    }
    // default fallbacks
    return p.images?.[0] || (Array.isArray(p.image) && p.image[0]) || p.image || "/placeholder.jpg";
  };

  // --- validate order before saving/printing (enhanced)
  const validateOrder = (items) => {
    if (!items || items.length === 0) {
      toast.error("No products selected");
      return false;
    }

    // Ensure bangle variants have size & color
    for (const key of items) {
      const parts = key.split("_");
      if (parts.length >= 3) {
        const [, size, color] = parts;
        if (!size || !color) {
          toast.error("Please select size and color for all bangle items");
          return false;
        }
      }
    }

    // Basic shipping validations
    const name = shipping.name?.trim();
    const email = shipping.email?.trim();
    const phone = shipping.phone?.trim();
    const addr = shipping.address?.trim();
    const state = shipping.state?.trim();
    const city = shipping.city?.trim();
    const zip = String(shipping.zip || "").trim();
    const country = (shipping.country || "").trim() || "India";

    if (!name || name.length < 2) {
      toast.error("Enter a valid customer name");
      return false;
    }

    // email validation (simple)
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRe.test(email)) {
      toast.error("Enter a valid email");
      return false;
    }

    // phone validation: Indian 10 digits
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      toast.error("Enter a valid phone (10 digits)");
      return false;
    }

    if (!addr || addr.length < 5) {
      toast.error("Enter a valid address");
      return false;
    }

    if (!state) {
      toast.error("Select state");
      return false;
    }

    if (!city) {
      toast.error("Enter/select city");
      return false;
    }

    // ZIP / PIN validation: India expects 6 digits
    if (country === "India") {
      if (!/^\d{6}$/.test(zip)) {
        toast.error("Enter valid 6-digit PIN code for India");
        return false;
      }
    } else {
      // fallback: basic length check
      if (zip.length < 3) {
        toast.error("Enter valid ZIP/Postal code");
        return false;
      }
    }

    // If order type is Online, require shippingCost numeric >= 0
    if (orderType === "Online") {
      const sc = Number(shippingCost);
      if (!Number.isFinite(sc) || sc < 0) {
        toast.error("Enter a valid shipping cost (>= 0)");
        return false;
      }
    }

    return true;
  };

  // 🟢 Add Product (supports Bangles with color & size)
  const handleAddProduct = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // If product is bangle single-color, ensure user selected color & size
    if (product.category === "Bangle" && product.count === "SingleColor") {
      if (!selectedColor || !selectedSize) {
        toast.error("Select color and size before adding this bangle");
        return;
      }
    }

    const variantKey =
      product.category === "Bangle"
        ? `${productId}_${selectedSize}_${selectedColor}`
        : productId;

    if (!selectedProducts.includes(variantKey)) {
      setSelectedProducts((prev) => [...prev, variantKey]);
      setQuantities((prev) => ({ ...prev, [variantKey]: 1 }));
      setCurrentProduct("");
      setSelectedSize("");
      setSelectedColor("");
    } else {
      toast.error("Product already added!");
    }
  };

  // 🟢 Handle quantity change
  const handleQuantityChange = (key, qty) => {
    if (qty < 1) qty = 1;
    setQuantities((prev) => ({ ...prev, [key]: qty }));
  };

  // 🟢 Remove product
  const handleRemoveProduct = (key) => {
    setSelectedProducts((prev) => prev.filter((id) => id !== key));
    setQuantities((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // 🟢 Update totals dynamically
  useEffect(() => {
    let totalQty = 0,
      totalMRP = 0,
      totalSelling = 0;

    selectedProducts.forEach((key) => {
      let [id] = key.split("_");
      const p = products.find((x) => x.id === id);
      const qty = Number(quantities[key] || 1);
      if (p) {
        totalQty += qty;
        totalMRP += qty * (p.mrp || 0);
        totalSelling += qty * (p.sellingprice || 0);
      }
    });

    const totalWithShipping = totalSelling + Number(shippingCost || 0);

    setTotals({
      totalQty,
      totalMRP,
      totalSelling,
      totalWithShipping,
    });
  }, [selectedProducts, quantities, products, shippingCost]);

  // 🟢 Save order + update stock in Firestore
  const handlePrint = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Add products before printing");
      return;
    }

    if (isSaving) return;

    // Validate early (client-side)
    if (!validateOrder(selectedProducts)) return;

    // Open popup synchronously to avoid browser popup blocking
    let win;
    try {
      win = window.open("", "_blank", "width=900,height=700");
    } catch (err) {
      win = null;
    }
    if (!win) {
      toast.error("Popup blocked. Please allow popups to print the invoice.");
      return;
    }

    // Show a temporary loading page in the popup
    try {
      win.document.open();
      win.document.write(`<html><head><title>Preparing Invoice</title></head><body style="font-family:Arial,sans-serif;padding:20px"><h3>Preparing invoice, please wait...</h3></body></html>`);
      win.document.close();
    } catch (e) {
      // ignore write errors but continue (popup exists)
    }

    setIsSaving(true);
    const toastId = toast.loading("Saving order and preparing print...");

    // Build items array with correct color-specific images
    const items = selectedProducts.map((key) => {
      const [id, size, color] = key.split("_");
      const p = products.find((x) => x.id === id) || {};
      return {
        id: p.id || id,
        name: p.name || "-",
        category: p.category || "",
        subcategory: p.subcategory || "",
        size: size || p.size || "",
        color: color || p.color || "",
        image: getColorImage(p, color),
        mrp: p.mrp || 0,
        price: p.sellingprice || 0,
        quantity: quantities[key] || 1,
      };
    });

    // Final validation using built items (extra safety)
    if (!validateOrder(selectedProducts)) {
      toast.dismiss(toastId);
      setIsSaving(false);
      try { win.close(); } catch (_) {}
      return;
    }

    // Compute subtotal locally (guaranteed fresh) and grand total including shipping
    const subtotalLocal = items.reduce(
      (s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)),
      0
    );
    const grandTotalLocal = subtotalLocal + Number(shippingCost || 0);

    const orderId = await generateOrderNumber();
    const clientNow = new Date(); // use for printed time

    try {
      await runTransaction(db, async (transaction) => {
        const productDocs = {};
        for (const item of items) {
          const productRef = doc(db, "products", item.id);
          const productSnap = await transaction.get(productRef);
          if (!productSnap.exists())
            throw new Error(`Product ${item.name} not found`);
          productDocs[item.id] = { ref: productRef, data: productSnap.data() };
        }

        // update stock
        for (const item of items) {
          const { ref, data } = productDocs[item.id];
          if (
            data.category?.toLowerCase() === "bangle" &&
            data.colors &&
            item.color &&
            item.size &&
            data.count === "SingleColor"
          ) {
            const updatedColors = data.colors.map((c) => {
              if (String(c.color) === String(item.color) && c.stock?.[item.size] !== undefined) {
                return {
                  ...c,
                  stock: {
                    ...c.stock,
                    [item.size]: Math.max(0, c.stock[item.size] - item.quantity),
                  },
                };
              }
              return c;
            });
            transaction.update(ref, { colors: updatedColors });
          } else if (data.stock !== undefined) {
            const currentStock = Number(data.stock || 0);
            if (currentStock < item.quantity)
              throw new Error(`Not enough stock for ${item.name}`);
            transaction.update(ref, {
              stock: Math.max(0, currentStock - item.quantity),
            });
          }
        }

        const orderRef = doc(collection(db, "orders"));
        transaction.set(orderRef, {
          id: orderRef.id,
          orderId,
          items,
          // use freshly computed subtotal and grand total so shipping is included correctly
          subtotal: subtotalLocal,
          shippingCost: Number(shippingCost || 0),
          total: grandTotalLocal,
          status: "Delivered",
          createdAt: serverTimestamp(),
          clientCreatedAt: clientNow.toISOString(),
          shipping,
          ordertype: orderType,
        });
      });

      // After successful save, prepare print HTML
      const formatCurrency = (v) => `₹${Number(v || 0).toFixed(2)}`;
      const itemsRows = items.map((it, idx) => {
        const subtotal = Number(it.price || 0) * Number(it.quantity || 1);
        return `<tr>
            <td style="padding:6px;border:1px solid #ddd">${idx + 1}</td>
            <td style="padding:6px;border:1px solid #ddd">${it.productName || "N/A"}</td>
            <td style="padding:6px;border:1px solid #ddd;text-align:center">${it.quantity}</td>
            <td style="padding:6px;border:1px solid #ddd;text-align:right">${formatCurrency(it.price)}</td>
            <td style="padding:6px;border:1px solid #ddd;text-align:right">${formatCurrency(subtotal)}</td>
          </tr>`;
      }).join("");

      // use the fresh computed totals for printing
      const totalForPrint = grandTotalLocal;

      const printHtml = `
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8"/>
            <title>Invoice - ${orderId}</title>
            <style>
              body { font-family: Arial, sans-serif; color:#111; padding:20px; }
              .header { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
              h2 { margin:0; }
              table { width:100%; border-collapse:collapse; margin-top:12px; }
              th { text-align:left; padding:8px; background:#f7f7f7; border:1px solid #ddd;}
              td { vertical-align:top; }
              .right { text-align:right; }
              .muted { color:#666; font-size:13px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
            <img src="${logoUrl}" style="height:60px;" />
                <h2>Sri Saravana Shoppings</h2>
                <div class="muted">Invoice for Order: ${orderId}</div>
                <div class="muted">Printed: ${clientNow.toLocaleString()}</div>
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;gap:12px">
              <div>
                <strong>Customer</strong><br/>
                ${shipping.name || "-"}<br/>
                ${shipping.phone || "-"}<br/>
                ${shipping.address || ""} ${shipping.city || ""} ${shipping.state || ""} ${shipping.zip || ""}
              </div>
              <div style="text-align:right;">
                <strong>Order Info</strong><br/>
                Order ID: ${orderId}<br/>
                Payment: ${orderType}<br/>
                Status: Delivered
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width:40px">#</th>
                  <th>Item</th>
                  <th style="width:70px;text-align:center">Qty</th>
                  <th style="width:120px;text-align:right">Price</th>
                  <th style="width:120px;text-align:right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows || `<tr><td colspan="5" style="padding:8px;border:1px solid #ddd">No items</td></tr>`}
                <tr>
                  <td colspan="4" style="padding:8px;border:1px solid #ddd;text-align:right"><strong>Subtotal</strong></td>
                  <td style="padding:8px;border:1px solid #ddd;text-align:right"><strong>${formatCurrency(subtotalLocal)}</strong></td>
                </tr>
                <tr>
                  <td colspan="4" style="padding:8px;border:1px solid #ddd;text-align:right"><strong>Shipping</strong></td>
                  <td style="padding:8px;border:1px solid #ddd;text-align:right"><strong>${formatCurrency(Number(shippingCost || 0))}</strong></td>
                </tr>
                <tr>
                  <td colspan="4" style="padding:8px;border:1px solid #ddd;text-align:right"><strong>Grand Total</strong></td>
                  <td style="padding:8px;border:1px solid #ddd;text-align:right"><strong>${formatCurrency(totalForPrint)}</strong></td>
                </tr>
              </tbody>
            </table>

            <div style="margin-top:18px" class="muted">
              This is a system generated invoice.
            </div>
          </body>
        </html>
      `;

      // replace popup content with final invoice and trigger print
      try {
        win.document.open();
        win.document.write(printHtml);
        win.document.close();

        let finalized = false;
        const finalize = () => {
          if (finalized) return;
          finalized = true;
          try { win.close(); } catch (_) {}
          toast.dismiss(toastId);
          toast.success(`Order ${orderId} saved`);
          // reset UI
          setSelectedProducts([]);
          setQuantities({});
          setShippingCost(0);
          setShipping({
            name: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            zip: "",
            country: "",
          });
          setCurrentProduct("");
          setSelectedSize("");
          setSelectedColor("");
          setIsSaving(false);
        };

        win.focus();
        win.onafterprint = finalize;
        win.print();
        setTimeout(() => finalize(), 4000);
      } catch (err) {
        // If printing fails, show error inside popup
        try {
          win.document.open();
          win.document.write(`<html><body><h3>Print failed</h3><p>${err?.message || "Unable to print"}</p></body></html>`);
          win.document.close();
        } catch (_) {}
        toast.dismiss(toastId);
        toast.error("Print failed, but order saved");
        setIsSaving(false);
      }
    } catch (err) {
      // write error into popup so user sees it
      try {
        win.document.open();
        win.document.write(`<html><body><h3>Order saving failed</h3><pre>${(err && err.message) || String(err)}</pre></body></html>`);
        win.document.close();
      } catch (_) {}
      toast.dismiss(toastId);
      toast.error(err?.message || "Error saving order");
      setIsSaving(false);
    }
  };

  // add country / state / city lists
  const COUNTRIES = ["India", "Other"];
  const INDIAN_STATES = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
    "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
    "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
    "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
    "Uttar Pradesh","Uttarakhand","West Bengal","Delhi"
  ];

  // small city map for major states (fallback to text input)
  const CITY_MAP = {
    "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Tiruchirappalli"],
    "Karnataka": ["Bengaluru","Mysuru","Mangalore","Hubli"],
    "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik"],
    "Delhi": ["New Delhi","Dwarka","Rohini"],
    "Kerala": ["Thiruvananthapuram","Kochi","Kozhikode"],
    "Telangana": ["Hyderabad","Warangal"],
    "Gujarat": ["Ahmedabad","Surat","Vadodara"],
    "West Bengal": ["Kolkata","Howrah","Durgapur"],
    "Uttar Pradesh": ["Lucknow","Kanpur","Agra"]
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-white rounded shadow-xl">
      <h2 className="text-xl font-semibold mb-4">Billing / Shop</h2>

      {/* Product Selection */}
      <div className="mb-4">
  <h3 className="font-medium mb-2 ml-4">Select Products</h3>

  {/* 🔸 Product Selector */}
  <div className="flex gap-2 ml-4 items-center">
    <select
      className="w-full border border-gray-300 rounded-lg px-4 py-3"
      onChange={(e) => setCurrentProduct(e.target.value)}
      value={currentProduct}
    >
      <option value="" disabled>
        Select Product by ID
      </option>
      {products.map((p) => (
        <option key={p.id} value={p.id}>
          {p.productId} — {p.name} — ₹{p.sellingprice}
        </option>
      ))}
    </select>

    <button
      className="px-4 py-2 bg-primary cursor-pointer text-white font-bold rounded-full"
      onClick={() => {
        if (currentProduct) handleAddProduct(currentProduct);
      }}
      disabled={isSaving}
    >
      Add
    </button>
  </div>

  {/* 🔹 Dynamic Color + Size Selector */}
{currentProduct &&
  (() => {
    const p = products.find((x) => x.id === currentProduct);
    if (p && p.category === "Bangle" && p.count === "SingleColor") {
      const availableColors = p.colors || [];
      const availableSizes =
        availableColors.find((c) => c.color === selectedColor)?.size || [];

      return (
        <div className="flex gap-3 mt-3 ml-4">
          {/* 🟣 Custom Color Dropdown with Real Color Swatch */}
          <div className="relative inline-block text-left w-56">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Color
            </label>

            <button
              type="button"
              onClick={() => setShowColorDropdown((prev) => !prev)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-left flex items-center justify-between focus:ring-2 focus:ring-primary/20"
            >
              {selectedColor ? (
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: selectedColor }}
                  ></span>
                  <span>{getColorName(selectedColor)}</span>
                </div>
              ) : (
                <span className="text-gray-400">Select Color</span>
              )}
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown List */}
            {showColorDropdown && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {availableColors.map((c) => (
                  <div
                    key={c.color}
                    onClick={() => {
                      setSelectedColor(c.color);
                      setSelectedSize("");
                      setShowColorDropdown(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                      selectedColor === c.color ? "bg-gray-50" : ""
                    }`}
                  >
                    <span
                      className="inline-block w-5 h-5 rounded-full border border-gray-400"
                      style={{ backgroundColor: c.color }}
                    ></span>
                    <span>{getColorName(c.color)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 🟢 Size Selector */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Select Size
            </label>
            <select
              className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
              value={selectedSize}
              disabled={!selectedColor}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              <option value="" disabled>
                {selectedColor ? "Select Size" : "Select Color First"}
              </option>
              {availableSizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }
    return null;
  })()}
</div>

      {/* Shipping Form */}
      <div className="mb-4 p-4 rounded">
        <h3 className="font-medium mb-2">Customer Shipping Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Name */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Name</label>
            <input
              type="text"
              placeholder="Enter customer name"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              value={shipping.name}
              onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Email</label>
            <input
              type="email"
              placeholder="Enter email"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              value={shipping.email}
              onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              placeholder="Enter phone (10 digits)"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              value={shipping.phone}
              onChange={(e) => {
                // allow digits only up to 10-12 chars
                const v = e.target.value.replace(/[^\d+]/g, "");
                setShipping({ ...shipping, phone: v.slice(0, 12) });
              }}
            />
          </div>

          {/* Address */}
          <div className="flex flex-col md:col-span-2">
            <label className="mb-1 font-medium text-gray-700">Address</label>
            <input
              type="text"
              placeholder="Enter address"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              value={shipping.address}
              onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
            />
          </div>

          {/* Country */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Country</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              value={shipping.country || "India"}
              onChange={(e) => {
                const c = e.target.value;
                setShipping({ ...shipping, country: c });
                // if country not India, clear state/city
                if (c !== "India") {
                  setShipping(s => ({ ...s, state: "", city: "" }));
                }
              }}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* State (only show India states when country is India) */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">State</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              value={shipping.state || ""}
              onChange={(e) => {
                const st = e.target.value;
                setShipping({ ...shipping, state: st, city: "" });
              }}
              disabled={(shipping.country || "India") !== "India"}
            >
              <option value="" disabled>Select state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* City: if state has known cities show dropdown else text input */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">City</label>
            {shipping.country === "India" && CITY_MAP[shipping.state] ? (
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                value={shipping.city || ""}
                onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
              >
                <option value="" disabled>Select city</option>
                {CITY_MAP[shipping.state].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Enter city"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                value={shipping.city}
                onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
              />
            )}
          </div>

          {/* ZIP / PIN */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Pin Code</label>
            <input
              type="text"
              placeholder="Enter PIN Code"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              value={shipping.zip}
              onChange={(e) => {
                // only digits
                const v = e.target.value.replace(/\D/g, "");
                // if India limit to 6 digits; else allow up to 10
                const limit = (shipping.country === "India") ? 6 : 10;
                setShipping({ ...shipping, zip: v.slice(0, limit) });
              }}
            />
          </div>

          {/* Shipping Cost */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700">Shipping Cost</label>
            <input
              type="number"
              placeholder="Enter Shipping Cost"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              value={shippingCost}
              disabled={orderType !== "Online"}
              onChange={(e) => setShippingCost(Number(e.target.value || 0))}
            />
          </div>

          {/* Order Type */}
          <div className="mb-4">
            <label className="mb-1 font-medium text-gray-700">Order Type</label>
            <select
              className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-3.5 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              value={orderType}
              required
              onChange={(e) => {
                const v = e.target.value;
                setOrderType(v);
                if (v !== "Online") setShippingCost(0);
              }}
            >
              <option value="Shop">Shop</option>
              <option value="Online">Online</option>
            </select>
          </div>

        </div>
      </div>

      {/* Invoice Table */}
      {selectedProducts.length > 0 && (
        <div className="mt-4 p-4">
          <h3 className="font-medium mb-2">Invoice</h3>
          <div className="hidden sm:block bg-white shadow rounded-2xl overflow-x-auto">
            <table className="min-w-full text-sm rounded-lg overflow-hidden">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="px-3 py-4">Image</th>
                  <th className="px-3 py-4">Name</th>
                  <th className="px-3 py-4">Category</th>
                  <th className="px-3 py-4">Size</th>
                  <th className="px-3 py-4">Color</th>
                  <th className="px-3 py-4">Qty</th>
                  <th className="px-3 py-4">Price</th>
                  <th className="px-3 py-4">Total</th>
                  <th className="px-3 py-4">Remove</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((key) => {
                  const [id, size, color] = key.split("_");
                  const p = products.find((x) => x.id === id) || {};
                  const qty = quantities[key] || 1;
                  // use color-specific image when available
                  const img = getColorImage(p, color);

                  return (
                    <tr key={key} className="border text-center border-gray-300">
                      <td className="px-3 py-3">
                        <img
                          src={img}
                          alt={p.name}
                          className="w-15 h-15 border p-1 border-gray-200"
                        />
                      </td>
                      <td className="px-3 py-3">{p.name}</td>
                      <td className="px-3 py-3">{p.category || "-"}</td>
                      <td className="px-3 py-3">{size || "-"}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className="inline-block w-4 h-4 rounded-full border border-gray-400"
                            style={{ backgroundColor: color }}
                          ></span>
                          <span>{getColorName(color)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={1}
                          className="w-16 border border-primary p-1 rounded text-center"
                          value={qty}
                          onChange={(e) =>
                            handleQuantityChange(key, Number(e.target.value))
                          }
                        />
                      </td>
                      <td className="px-3 py-3">₹{p.sellingprice}</td>
                      <td className="px-3 py-3">
                        ₹{(p.sellingprice * qty).toFixed(2)}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          className="px-2 py-2 cursor-pointer bg-red-600 text-white rounded-full text-sm"
                          onClick={() => handleRemoveProduct(key)}
                        >
                          <RiDeleteBin6Fill />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 text-center">
                  <td className="px-3 py-3" colSpan={6}>Subtotal</td>
                  <td className="px-3 py-3">-</td>
                  <td className="px-3 py-3">₹{totals.totalSelling.toFixed(2)}</td>
                  <td className="px-3 py-3">-</td>
                </tr>
                <tr className="bg-gray-50 text-center">
                  <td className="px-3 py-3" colSpan={6}>Shipping</td>
                  <td className="px-3 py-3">-</td>
                  <td className="px-3 py-3">₹{Number(shippingCost || 0).toFixed(2)}</td>
                  <td className="px-3 py-3">-</td>
                </tr>
                <tr className="font-semibold bg-gray-50 text-center">
                  <td className="px-3 py-3" colSpan={6}>Grand Total</td>
                  <td className="px-3 py-3">-</td>
                  <td className="px-3 py-3">₹{(totals.totalWithShipping ?? (totals.totalSelling + Number(shippingCost || 0))).toFixed(2)}</td>
                  <td className="px-3 py-3">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}



<div className="sm:hidden flex flex-col gap-3 mt-4">
  {selectedProducts.map(key => {
    const [id, size, color] = key.split("_");
    const p = products.find(x => x.id === id) || {};
    const qty = quantities[key] || 1;
    const img = getColorImage(p, color);

    const isSingleColorBangle = p?.category === "Bangle" && p?.count === "SingleColor";

    return (
      <div key={key} className="bg-white shadow rounded-2xl p-4 flex flex-col gap-2 border">
        <div className="flex gap-3">
          <img src={img} alt={p.name} className="w-20 h-20 object-cover rounded-lg border" />
          <div className="flex-1">
            <h4 className="font-semibold">{p.name}</h4>
            <p className="text-sm text-gray-500">{p.category} / {p.subcategory || "-"}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              <div>
                Size: {isSingleColorBangle ? (
                  <select
                    className="border px-2 py-1 rounded"
                    value={size}
                    onChange={(e) => {
                      const newKey = `${id}_${e.target.value}_${color}`;
                      setSelectedProducts(prev => prev.map(k => k === key ? newKey : k));
                      setQuantities(prev => ({ ...prev, [newKey]: qty }));
                    }}
                  >
                    {p.colors?.find(c => c.color === color)?.size?.map(s => (
                      <option key={s} value={s}>{s}</option>
                    )) || []}
                  </select>
                ) : size || "-"}
              </div>
              <div>
                Color: {isSingleColorBangle ? (
                  <select
                    className="border px-2 py-1 rounded"
                    value={color}
                    onChange={(e) => {
                      const newKey = `${id}_${size}_${e.target.value}`;
                      setSelectedProducts(prev => prev.map(k => k === key ? newKey : k));
                      setQuantities(prev => ({ ...prev, [newKey]: qty }));
                    }}
                  >
                    {p.colors?.map(c => (
                      <option key={c.color} value={c.color}>{getColorName(c.color)}</option>
                    )) || []}
                  </select>
                ) : color || "-"}
              </div>
            </div>
            <div className="flex gap-2 mt-2 items-center">
              <input
                type="number"
                value={qty}
                min={1}
                className="w-16 border border-primary p-1 rounded text-center"
                onChange={e => handleQuantityChange(key, Number(e.target.value))}
              />
              <span className="text-sm">₹{(p.sellingprice * qty).toFixed(2)}</span>
              <button
                className="ml-auto px-2 py-1 bg-red-600 text-white rounded-full"
                onClick={() => handleRemoveProduct(key)}
              >
                <RiDeleteBin6Fill />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  })}

  {/* Mobile totals section */}
  {selectedProducts.length > 0 && (
    <div className="bg-white p-4 rounded shadow mt-3 text-sm">
      <div className="flex justify-between mb-1"><span>Total Qty</span><span>{totals.totalQty}</span></div>
      <div className="flex justify-between mb-1"><span>Subtotal</span><span>₹{totals.totalSelling.toFixed(2)}</span></div>
      <div className="flex justify-between mb-1"><span>Shipping</span><span>₹{Number(shippingCost || 0).toFixed(2)}</span></div>
      <div className="flex justify-between font-semibold"><span>Total</span><span>₹{(totals.totalWithShipping ?? (totals.totalSelling + Number(shippingCost || 0))).toFixed(2)}</span></div>
    </div>
  )}
</div>


          {/* Actions */}
          <div className="mt-4 flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-red-600 text-white cursor-pointer rounded-full"
              onClick={() => {
                setSelectedProducts([]);
                setQuantities({});
                setCurrentProduct("");
                setSelectedSize("");
                setSelectedColor("");
              }}
            >
              Clear
            </button>
            <button
              className="px-4 py-2 flex items-center gap-3 bg-primary cursor-pointer text-white rounded-full"
              onClick={handlePrint}
              disabled={isSaving || selectedProducts.length === 0}
            >
              <IoMdPrint /> Print
            </button>
          </div>
        </div>
      );
}
