import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./Home/Home.jsx";
import AllProducts from "./Products/AllProducts.jsx";
import ProductDetails from "./Products/ProductDetails.jsx";

import Checkout from "./Products/Checkout.jsx";
import Account from "./Components/Account.jsx";
import NotFound from "./Components/NotFound.jsx";
import Category from "./Home/Category.jsx";
import Contact from "./Components/Contact.jsx";
import { AuthProvider } from "./PrivateRouter.jsx/AuthContext.jsx";
import PrivateRoute from "./PrivateRouter.jsx/PrivateRouter.jsx";


// superadmin
import AdminPanel from "./Admin/AdminPanel.jsx";
import Dashboard from "./Admin/Dashboard.jsx";
import AddProducts from "./Admin/Products/AddProducts.jsx";
import AllProduct from "./Admin/Products/AllProducts.jsx";
import Categorys from "./Admin/Products/Category.jsx";
import NewUsers from "./Admin/Users/NewUsers.jsx";
import AllUsers from "./Admin/Users/AllUsers.jsx";
import AddReviews from "./Admin/Reviews/Reviews.jsx";
import AddStock from "./Admin/Stock/AddStock.jsx";
import StockDetails from "./Admin/Stock/StockDetails.jsx";
import Billing from "./Admin/Dealers/Billing.jsx";
import Dealers from "./Admin/Dealers/Delears.jsx";
import Invoice from "./Admin/Dealers/Invoice.jsx";
import NewOrders from "./Admin/Orders/NewOrders.jsx";
import AllOrders from "./Admin/Orders/AllOrders.jsx";
import Delivery from "./Admin/Orders/Delivery.jsx";
import CancelOrders from "./Admin/Orders/cancelOrders.jsx";
// import BanglesForm from "./Home/BangleForm.jsx";
// import SareeForm from "./Home/SareeForm.jsx";
// import Juwels from "./Admin/Products/AllForms/Juwels.jsx"
import Profile from "./Admin/Dealers/Profile.jsx";
import OrderDetail from "./Admin/Orders/OrdersDetails.jsx";
import VideoForm from "./Admin/Reviews/Videos.jsx";

import { Toaster, toast } from "react-hot-toast";
import Login from "./Components/Login.jsx";
import Register from "./Components/Register.jsx";
import RazorpayKeyForm from './Admin/RazerpayKey';
import About from "./Components/About.jsx";
import TermsAndConditions from "./Components/TermsAndConditions.jsx";
import PrivacyPolicy from "./Components/PrivacyPolicy.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/about", element: <About /> },
      { path: "/privacypolicy", element: <PrivacyPolicy /> },
      { path: "/termsandconditions", element: <TermsAndConditions /> },
      { path: "/allproducts", element: <AllProducts /> },
      { path: "/allproducts/:id", element: <ProductDetails /> },
      { path: "/checkout", element: <Checkout /> },
      {
        path: "/account",
        element: (
          <PrivateRoute>
            <Account />
          </PrivateRoute>
        ),
      },
      { path: "/category", element: <Category /> },
      { path: "/contact", element: <Contact /> },
    ],
  },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },


  

 {
   path: "/superadmin",
    element: (
      <PrivateRoute allowedRoles={["admin"]}>
        <AdminPanel />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Dashboard/> },

      { path: "allproducts", element: <AllProduct/> },
      { path: "addproducts", element: <AddProducts/> },
      { path: "addproducts/:id", element: <AddProducts/> },
      { path: "category", element: <Categorys/> },
      { path: "stocks", element: <AddStock/> },
      { path: "stocks/:id", element: <AddStock/> },
      { path: "stockDetails", element: <StockDetails/> },


      { path: "billing", element: <Billing/> },
      { path: "dealers", element: <Dealers/> },
      { path: "invoice", element: <Invoice/> },


       { path: "videos", element: <VideoForm/> },

      { path: "allreviews", element: <AddReviews/> },

      { path: "newOrders", element: <NewOrders/> },
      { path: "allOrders", element: <AllOrders/> },
      { path: "deliveryOrder", element: <Delivery/> },
      { path: "cancleOrders", element: <CancelOrders/> },
     
      { path: "orders/:id", element: <OrderDetail/> },






      { path: "newusers", element: <NewUsers/> },
      { path: "allusers", element: <AllUsers/> },

      { path: "settings", element: <Profile/> },

      { path: "razerpay", element: <RazorpayKeyForm/> },



    ],
  },
  { path: "/*", element: <NotFound /> },

  { path: "/*", element: <NotFound /> },
]);

import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "dummy_client_id"}>
    <AuthProvider>
        <Toaster position="top-left" reverseOrder={false} />

      <RouterProvider router={router} />
    </AuthProvider>
  </GoogleOAuthProvider>
);
