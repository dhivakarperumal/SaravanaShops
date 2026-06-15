import React, { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { FaEdit, FaTrash, FaStar, FaEye } from "react-icons/fa";
import {
  MdOutlineArrowBackIosNew,
  MdOutlineArrowForwardIos,
} from "react-icons/md";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: "",
    subcategory: "",
    color: [],
    size: [],
    count: "",
    price: [0, 10000],
    rating: "",
    offer: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(8);
  const [viewProduct, setViewProduct] = useState(null);
  const navigate = useNavigate();

  // Fetch products
useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "products"),
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    },
    (error) => {
      console.error("Error fetching products:", error);
      toast.error("Error fetching products.");
    }
  );

  // Cleanup on unmount
  return () => unsubscribe();
}, []);

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      toast.success("Product deleted!");
      
    } catch (err) {
      console.error(err);
      toast.error("Error deleting product.");
    }
  };

  // Navigate to edit page
  const handleEdit = (product) => {
    navigate(`/superadmin/addproducts/${product.id}`, { state: { product } });
  };

  const handleAdd = () => {
    navigate("/superadmin/addproducts");
  };

  // Filter helpers
  const categories = [...new Set(products.map((p) => p.category))];
  const subcategories = filters.category
    ? [...new Set(products.filter((p) => p.category === filters.category).map((p) => p.subcategory))].filter(Boolean)
    : [];
  const getColors = () => [...new Set(products.flatMap((p) => p.color || []))];
  const getSizes = () => [...new Set(products.flatMap((p) => p.size || []))];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleMultiSelect = (key, value) => {
    setFilters((prev) => {
      const current = prev[key];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((v) => v !== value) };
      } else {
        return { ...prev, [key]: [...current, value] };
      }
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      subcategory: "",
      color: [],
      size: [],
      count: "",
      price: [0, 10000],
      rating: "",
      offer: "",
    });
    setCurrentPage(1);
  };

  // Apply filters
  const filteredProducts = products.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.subcategory && p.subcategory !== filters.subcategory) return false;
    if (filters.color.length && !filters.color.some((c) => (p.color || []).includes(c))) return false;
    if (filters.size.length && !filters.size.some((s) => (p.size || []).includes(s))) return false;
    if (filters.count && p.countType !== filters.count) return false;
    if (filters.rating && (p.rating || 0) < Number(filters.rating)) return false;
    if (filters.offer && (p.offer || 0) < Number(filters.offer)) return false;
    const price = p.sellingprice || p.price || 0;
    if (price < filters.price[0] || price > filters.price[1]) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirst, indexOfLast);

  return (
    <div className="p-2  min-h-screen">
      <div className="flex gap-6">
        {/* Sidebar */}
        {showFilters && (
          <aside className="w-64 mt-14 bg-white p-4 border border-gray-200 rounded-lg h-[calc(100vh-48px)] overflow-y-auto sticky top-6">
            <h3 className="text-2xl font-bold mb-4 text-primary">Filters</h3>

            {/* Category */}
            <div className="mb-4">
              <h4 className="font-bold mb-1 text-primary text-lg">Category</h4>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="category"
                  value=""
                  checked={filters.category === ""}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className="accent-primary"
                />
                All
              </label>
              {categories.filter(Boolean).map((c) => (
                <label key={c} className="flex items-center gap-2 mt-1">
                  <input
                    type="radio"
                    name="category"
                    value={c}
                    checked={filters.category === c}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                    className="accent-primary"
                  />
                  {c}
                </label>
              ))}
            </div>

            {/* Subcategory */}
            {subcategories.length > 0 && (
              <div className="mb-4">
                <h4 className="font-bold mb-2 text-primary text-lg">Subcategory</h4>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="subcategory"
                    value=""
                    checked={filters.subcategory === ""}
                    onChange={(e) => handleFilterChange("subcategory", e.target.value)}
                    className="accent-primary"
                  />
                  All
                </label>
                {subcategories.map((s) => (
                  <label key={s} className="flex items-center gap-2 mt-1">
                    <input
                      type="radio"
                      name="subcategory"
                      value={s}
                      checked={filters.subcategory === s}
                      onChange={(e) => handleFilterChange("subcategory", e.target.value)}
                      className="accent-primary"
                    />
                    {s}
                  </label>
                ))}
              </div>
            )}

            {/* Color */}
            {getColors().filter(Boolean).length > 0 && (
              <div className="mb-4">
                <label className="block font-semibold mb-2 text-primary text-lg">Color:</label>
                <div className="flex flex-wrap gap-2">
                  {getColors()
                    .filter(Boolean)
                    .map((c) => (
                      <div
                        key={c}
                        onClick={() => handleMultiSelect("color", c)}
                        className={`w-6 h-6 rounded-full cursor-pointer border-2 ${filters.color.includes(c) ? "border-black" : "border-gray-300"}`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Size */}
            {getSizes().filter(Boolean).length > 0 && (
              <div className="mb-4">
                <label className="block font-semibold text-primary text-lg">Size:</label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.size.length === 0}
                    onChange={() => handleFilterChange("size", [])}
                    className="accent-primary"
                  />
                  All
                </label>
                {getSizes()
                  .filter(Boolean)
                  .map((s) => (
                    <label key={s} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.size.includes(s)}
                        onChange={() => handleMultiSelect("size", s)}
                        className="accent-primary"
                      />
                      {s}
                    </label>
                  ))}
              </div>
            )}

            <button
              onClick={clearFilters}
              className="w-full cursor-pointer bg-primary text-white px-4 py-2 rounded mt-6"
            >
              Clear Filters
            </button>
          </aside>
        )}

        {/* Main Products Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Buttons */}
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={handleAdd}
              className="bg-primary cursor-pointer text-white px-4 py-2 rounded"
            >
              + Add Product
            </button>
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className="bg-primary hidden md:block cursor-pointer text-white px-4 py-2 rounded"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          {/* Products Grid */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {currentProducts.length === 0 ? (
              <p className="text-gray-500 text-center mt-10 col-span-full">
                No products found.
              </p>
            ) : (
              currentProducts.map((product) => {
                const img =
                  product?.images?.[0] ||
                  product?.image?.[0] ||
                  product?.image ||
                  (product?.colors && Object.values(product.colors)?.[0]?.image) ||
                  "/placeholder.jpg";

                return (
                  <div
                    key={product.id}
                    className="relative bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300"
                  >
                    <Link to={`/allproducts/${product.id}`}>
                      <img
                        src={img}
                        alt={product.name}
                        className="w-full h-70 object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>

                    <div className="p-4 space-y-2">
                      <h3 className="text-gray-800 font-semibold text-md truncate">
                        {product.name}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {product.category} • {product.subcategory}
                      </p>
                      <div className="flex items-center gap-2">
                        {product.mrp != null && (
                          <span className="text-gray-400 line-through text-sm">
                            ₹{Number(product.mrp || 0).toFixed(2)}
                          </span>
                        )}
                        <span className="text-indigo-600 font-bold text-lg">
                          ₹{Number(product.sellingprice ?? product.price ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between p-2">
                      <button
                        onClick={() => setViewProduct(product)}
                        className="border cursor-pointer border-gray-300 rounded-full px-3 py-3 text-gray-500 hover:text-indigo-600 transition"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="border cursor-pointer border-gray-300 rounded-full px-3 py-3 text-gray-500 hover:text-green-600 transition"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="border cursor-pointer border-gray-300 rounded-full px-3 py-3 text-gray-500 hover:text-red-600 transition"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* View Product Modal */}
      {
        viewProduct && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/2 lg:w-1/3 p-6 relative">
              <button onClick={() => setViewProduct(null)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">
                ✕
              </button>
              <img src={viewProduct.images?.[0] || "https://via.placeholder.com/150"} alt={viewProduct.name} className="w-full h-48 object-cover rounded mb-4" />
              <h2 className="text-xl font-bold mb-2">{viewProduct.name}</h2>
              <p className="text-gray-500 mb-1">Type: {viewProduct.productType}</p>
              <p className="text-gray-500 mb-1">Category: {viewProduct.category}</p>
              <p className="text-gray-500 mb-1">MRP: ₹{Number(viewProduct.mrp ?? 0).toFixed(2)}</p>
              <p className="text-gray-800 font-bold mb-2">Selling Price: ₹{Number(viewProduct.sellingprice ?? viewProduct.sellingPrice ?? 0).toFixed(2)}</p>
              <p className="text-gray-600">{viewProduct.description}</p>
            </div>
          </div>
        )
      }
      {totalPages > 1 && (
              <div className="flex  justify-center items-center  gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <MdOutlineArrowBackIosNew />
                </button>
  
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`cursor-pointer px-3 py-1 border rounded-full ${
                      currentPage === i + 1
                        ? "bg-primary text-white"
                        : "bg-white text-primary"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
  
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  <MdOutlineArrowForwardIos />
                </button>
              </div>
            )}
    </div >
  );
}
