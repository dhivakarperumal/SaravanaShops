import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { FaArrowLeft } from "react-icons/fa";
import namer from "color-namer"; 

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const page = Number(searchParams.get("page")) || null;
  const fromPage = location.state?.fromPage || page || 1;
  const [order, setOrder] = useState(null);

  const orderStages = [
    "Placed",
    "Packing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];

  const safeIndex = (arr, val) =>
    Array.isArray(arr) ? arr.indexOf(val) : -1;

  // 🎨 Convert color code to readable name
  const getColorName = (colorCode) => {
    if (!colorCode) return "N/A";
    try {
      const result = namer(colorCode, { pick: ["html"] });
      return result.html[0]?.name || colorCode;
    } catch {
      return colorCode;
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderRef = doc(db, "orders", id);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          setOrder({ id: orderSnap.id, ...orderSnap.data() });
        } else {
          alert("Order not found");
          navigate("/superadmin/allOrders");
        }
      } catch (error) {
        console.error(error);
        alert("Failed to fetch order");
      }
    };

    fetchOrder();
  }, [id, navigate]);

  if (!order)
    return (
      <p className="p-6 text-center text-gray-500">Loading...</p>
    );

  // ✅ Total Quantity Calculation
  const totalQuantity = order.items?.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  return (
    <div className="p-6 sm:p-10 bg-white shadow-2xl rounded-2xl min-h-screen">
      {/* 🔙 Back Button */}
     

   <button
  className="mb-6 flex items-center gap-2 text-primary"
  onClick={() => navigate(`/superadmin/allOrders?page=${fromPage}`)}
>
  Back
</button>

      <h1 className="text-3xl font-bold mb-6 text-primary">
        Order Details
      </h1>

      <div className="mb-4">
        <p>
          <span className="font-semibold">Order ID:</span>{" "}
          {order.orderId}
        </p>
        <p>
          <span className="font-semibold">Customer Name:</span>{" "}
          {order.shipping?.name}
        </p>
      </div>

     {/* 🧾 Order Items - Desktop Table */}
<div className="hidden sm:block overflow-x-auto shadow rounded-2xl">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-primary text-white">
      <tr>
        <th className="px-4 py-4">Image</th>
        <th className="px-4 py-4">Name</th>
        <th className="px-4 py-4">Size</th>
        <th className="px-4 py-4">Color</th>
        <th className="px-4 py-4">Quantity</th>
        <th className="px-4 py-4">Price</th>
        <th className="px-4 py-4">Total</th>
      </tr>
    </thead>

    <tbody className="bg-white divide-y divide-gray-200">
      {order.items?.map((item, index) => (
        <tr key={index}>
          <td className="px-4 py-2 text-center">
            <img
              src={item.image}
              alt={item.name}
              className="w-16 h-16 object-cover rounded-lg mx-auto"
            />
          </td>

          <td className="px-4 py-2 text-center">{item.name || "N/A"}</td>

          <td className="px-4 py-2 text-center">
            {item.size || "N/A"}
          </td>

          <td className="px-4 py-2 text-center">
            {item.color ? (
              <div className="flex items-center justify-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: item.color }}
                />
                <span>{getColorName(item.color)}</span>
              </div>
            ) : (
              "N/A"
            )}
          </td>

          <td className="px-4 py-2 text-center">{item.quantity}</td>

          <td className="px-4 py-2 text-right">₹{item.price}</td>

          <td className="px-4 py-2 text-right">
            ₹{(item.quantity * item.price).toFixed(2)}
          </td>
        </tr>
      ))}
    </tbody>

    {/* ✅ Desktop Footer */}
    <tfoot>
      <tr>
        <td colSpan={4} className="px-4 py-2 font-semibold text-right text-primary">
          Total Quantity:
        </td>
        <td className="px-4 py-2 text-center font-semibold text-primary">
          {totalQuantity}
        </td>
        <td colSpan={2}></td>
      </tr>

      <tr>
        <td colSpan={6} className="px-4 py-2 font-semibold text-right">
          Subtotal:
        </td>
        <td className="px-4 py-2 text-right">
          ₹{order.subtotal?.toFixed(2) || "0.00"}
        </td>
      </tr>

      <tr>
        <td colSpan={6} className="px-4 py-2 font-semibold text-right">
          Shipping:
        </td>
        <td className="px-4 py-2 text-right">
          ₹{order.shippingCost?.toFixed(2) || "0.00"}
        </td>
      </tr>

      <tr>
        <td colSpan={6} className="px-4 py-2 font-bold text-right text-primary text-lg">
          Total:
        </td>
        <td className="px-4 py-2 font-bold text-right text-primary text-lg">
          ₹{order.total?.toFixed(2) || "0.00"}
        </td>
      </tr>
    </tfoot>
  </table>
</div>

{/* 📱 Mobile Cards */}
<div className="sm:hidden flex flex-col gap-4">
  {order.items?.map((item, index) => (
    <div
      key={index}
      className="border rounded-xl shadow-sm p-3 flex gap-3 bg-white"
    >
      {/* Image */}
        <img
          src={item.image}
          alt={item.productName || item.name}
        className="w-20 h-20 object-cover rounded-lg"
      />

      {/* Details */}
      <div className="flex flex-col flex-1 gap-1 text-sm">
        <div className="font-semibold text-gray-800">
            {item.productName || "N/A"}
          </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Size</span>
          <span>{item.size || "N/A"}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Color</span>
          {item.color ? (
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: item.color }}
              />
              <span>{getColorName(item.color)}</span>
            </div>
          ) : (
            <span>N/A</span>
          )}
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Qty</span>
          <span>{item.quantity}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Price</span>
          <span>₹{item.price}</span>
        </div>

        <div className="flex justify-between font-semibold text-green-600">
          <span>Total</span>
          <span>
            ₹{(item.quantity * item.price).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  ))}

  {/* 📱 Mobile Totals Card */}
  <div className="border rounded-xl shadow-sm p-4 bg-gray-50 text-sm">
    <div className="flex justify-between mb-1">
      <span className="font-medium">Total Qty</span>
      <span className="font-semibold text-primary">{totalQuantity}</span>
    </div>

    <div className="flex justify-between mb-1">
      <span>Subtotal</span>
      <span>₹{order.subtotal?.toFixed(2) || "0.00"}</span>
    </div>

    <div className="flex justify-between mb-1">
      <span>Shipping</span>
      <span>₹{order.shippingCost?.toFixed(2) || "0.00"}</span>
    </div>

    <div className="flex justify-between font-bold text-primary text-base pt-2 border-t mt-2">
      <span>Total</span>
      <span>₹{order.total?.toFixed(2) || "0.00"}</span>
    </div>
  </div>
</div>


      {/* 🚚 Order Status Tracker */}
      <div className="my-8 shadow p-4 rounded-2xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Order Status Tracker
        </h2>
        <div className="flex items-center justify-between relative">
          {orderStages.map((stage, idx) => {
            if (stage === "Shipped" && !order.docketNumber) return null;

            const currentStageIndex = Array.isArray(orderStages)
              ? Math.max(0, safeIndex(orderStages, order.status || orderStages[0]))
              : 0;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center relative">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold z-10 ${
                    idx <= currentStageIndex ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  {idx + 1}
                </div>
                <span className="mt-2 text-sm text-center">{stage}</span>
                {idx < orderStages.length - 1 && (
                  <div
                    className={`absolute top-4 left-1/2 w-full h-1 -z-10 ${
                      idx < currentStageIndex ? "bg-green-500" : "bg-gray-300"
                    }`}
                    style={{ transform: "translateX(50%)" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🏷️ Order Info & Shipping */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        <div className="bg-white shadow rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Order Info</h2>
          <p className="mb-2">
            <span className="font-semibold">Order ID:</span> {order.orderId}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Customer Name:</span>{" "}
            {order.shipping?.name}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Payment Method:</span>{" "}
            {order.paymentMethod || "N/A"}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Status:</span> {order.status}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Total Amount:</span> ₹{order.total}
          </p>
        </div>

        <div className="bg-white shadow rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Shipping Address
          </h2>
          <p className="mb-2">
            <span className="font-semibold">Door No:</span>{" "}
            {order.shipping?.doorNumber},<br />
            <span className="font-semibold">Street Name:</span>{" "}
            {order.shipping?.streetName},
          </p>
          <p className="mb-2">
            <span className="font-semibold">Address:</span>{" "}
            {order.shipping?.address},<br />
            <span className="font-semibold">Landmark:</span>{" "}
            {order.shipping?.landmark},<br />
            <span className="font-semibold">City:</span>{" "}
            {order.shipping?.city}, {order.shipping?.state},{" "}
            {order.shipping?.zip}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Country:</span>{" "}
            {order.shipping?.country}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Contact:</span>{" "}
            {order.shipping?.phone}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Email:</span>{" "}
            {order.shipping?.email}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
