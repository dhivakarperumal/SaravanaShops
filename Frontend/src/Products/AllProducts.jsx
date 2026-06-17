import React, { useEffect, useState } from "react";
import api from "../api";
import ProductCard from "./ProductCard";
import { FaFilter, FaThLarge, FaTh } from "react-icons/fa";
import {
  MdOutlineArrowBackIosNew,
  MdOutlineArrowForwardIos,
} from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import ProductModal from "./ProductModal";
import Head from './../Components/Head';
import { IoIosArrowForward } from "react-icons/io";

const AllProducts = ({ onOpenModal }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [gridCols, setGridCols] = useState(4);
  const [sortOption, setSortOption] = useState("default");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    price: [0, 10000],
    rating: "",
    offer: "",
    category: "",
    subcategory: "",
    color: [],
    size: [],
    count: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showFilters]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const res = await api.get("/products");

        if (res.data.success) {
          const data = res.data.data.map((item) => ({
            ...item,
            id: item.id,
            sellingprice: Number(item.sellingprice || item.price || 0),
          }));

          setProducts(data);
          setFilteredProducts(data);

          const cats = [
            ...new Set(data.map((p) => p.category)),
          ].filter(Boolean);

          setCategories(cats);

          if (data.length > 0) {
            const minPrice = Math.min(
              ...data.map((p) => p.sellingprice)
            );

            const maxPrice = Math.max(
              ...data.map((p) => p.sellingprice)
            );

            setFilters((prev) => ({
              ...prev,
              price: [minPrice, maxPrice],
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const location = useLocation();

  useEffect(() => {
    if (!filters.category) return setSubcategories([]);
    const cat = categories.find((c) => c === filters.category);
    const subcats = products
      .filter((p) => p.category === cat && p.subcategory)
      .flatMap((p) =>
        Array.isArray(p.subcategory) ? p.subcategory : [p.subcategory]
      );

    setSubcategories([...new Set(subcats)]);
    setFilters((prev) => ({
      ...prev,
      subcategory: "",
      color: [],
      size: [],
      count: "",
    }));
  }, [filters.category, categories, products]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (name, value) => {
    setFilters((prev) => {
      const current = prev[name] || [];
      return current.includes(value)
        ? { ...prev, [name]: current.filter((v) => v !== value) }
        : { ...prev, [name]: [...current, value] };
    });
  };

  const clearFilters = () => {
    setFilters({
      price: [0, 10000],
      rating: "",
      offer: "",
      category: "",
      subcategory: "",
      color: [],
      size: [],
      count: "",
    });
  };

  // --- Dynamic Colors ---
  const getColors = () => {
    if (filters.category === "Saree") {
      return Array.from(
        new Set(
          products
            .filter((p) => p.category === "Saree")
            .flatMap((p) => (p.color ? [p.color] : []))
        )
      );
    }

    if (filters.category === "Bangle" && filters.count === "SingleColor") {
      return Array.from(
        new Set(
          products
            .filter((p) => p.category === "Bangle" && p.count === "SingleColor")
            .flatMap((p) => p.colors?.map((c) => c.color) || [])
        )
      );
    }

    return [];
  };

  // --- Dynamic Sizes ---
  const getSizes = () => {
    if (filters.category === "Bangle" && filters.count === "SingleColor") {
      return Array.from(
        new Set(
          products
            .filter((p) => p.category === "Bangle" && p.count === "SingleColor")
            .flatMap((p) => p.colors?.flatMap((c) => c.size || []))
        )
      );
    }
    return [];
  };

  // --- Filtering Logic ---
  useEffect(() => {
    let temp = [...products];

    // Price
    temp = temp.filter(
      (p) =>
        p.sellingprice >= filters.price[0] && p.sellingprice <= filters.price[1]
    );

    // Rating
    if (filters.rating)
      temp = temp.filter((p) => Number(p.rating) >= Number(filters.rating));

    // Offer
    if (filters.offer)
      temp = temp.filter((p) => Number(p.offer) >= Number(filters.offer));

    // Category
    if (filters.category)
      temp = temp.filter((p) => p.category === filters.category);

    if (filters.subcategory) {
      temp = temp.filter((p) => {
        if (!p.subcategory) return false;

        if (Array.isArray(p.subcategory)) {
          return p.subcategory.some((s) =>
            typeof s === "string"
              ? s === filters.subcategory
              : s.cname === filters.subcategory
          );
        } else if (typeof p.subcategory === "string") {
          return p.subcategory === filters.subcategory;
        }
        return false;
      });
    }

    // Color
    if (filters.color.length > 0) {
      temp = temp.filter((p) => {
        if (p.colors)
          return p.colors.some((c) => filters.color.includes(c.color));
        if (p.color) return filters.color.includes(p.color);
        return false;
      });
    }

    // Size
    if (filters.size.length > 0) {
      temp = temp.filter((p) =>
        p.colors?.some((c) => c.size?.some((s) => filters.size.includes(s)))
      );
    }

    // Count
    if (filters.count) {
      temp = temp.filter((p) => p.count === filters.count);
    }

    // --- Sorting ---
    if (sortOption === "priceHigh")
      temp.sort((a, b) => b.sellingprice - a.sellingprice);
    else if (sortOption === "priceLow")
      temp.sort((a, b) => a.sellingprice - b.sellingprice);

    setFilteredProducts(temp);
    setCurrentPage(1);
  }, [filters, products, sortOption]);

  // --- Pagination ---
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <>
      <Head
        title="All Product's"
        subtitle={
          <>
            <Link className="text-lg font-semibold text-white" to="/">
              Home
            </Link>
            <IoIosArrowForward className="text-lg font-bold text-white mx-1" />
            <Link className="text-lg font-semibold text-white" to="/allproducts">
              All Product's
            </Link>
          </>
        }
      />
      <div className="flex flex-col md:flex-row gap-4 p-4 mt-4 relative">
        {/* Sidebar */}
        <aside
          className={`
            bg-white p-4 border border-primary/30 rounded-lg
            md:w-64 md:sticky md:top-25 md:self-start
            w-70 fixed top-0 left-0 h-full z-50 md:z-30
            transform transition-transform duration-300 overflow-y-auto
            ${showFilters ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          {/* Mobile Header */}
          <div className="flex justify-between items-center mb-4 md:hidden">
            <h3 className="text-lg font-bold">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-black font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <h3 className="text-2xl font-bold mb-4 hidden md:block text-primary">
            Filters
          </h3>

          {/* Category */}
          <div className="mb-4">
            <h4 className="font-bold mb-1 text-primary text-lg mt-2">Category</h4>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="category"
                value=""
                checked={filters.category === ""}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="accent-primary cursor-pointer"
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
                  className="accent-primary  cursor-pointer"
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
                  className="accent-primary  cursor-pointer"
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
                    className="accent-primary  cursor-pointer"
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
                      className={`w-6 h-6 rounded-full cursor-pointer border-2 ${filters.color.includes(c) ? "border-black" : "border-gray-300"
                        }`}
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
                  className="accent-primary  cursor-pointer"
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
                      className="accent-primary  cursor-pointer"
                    />
                    {s}
                  </label>
                ))}
            </div>
          )}

          {/* Count (Bangle only) */}
          {filters.category === "Bangle" && (
            <div className="mb-4">
              <label className="block font-semibold text-primary text-lg mt-1">Count:</label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="count"
                  value=""
                  checked={filters.count === ""}
                  onChange={(e) => handleFilterChange("count", e.target.value)}
                  className="accent-primary  cursor-pointer"
                />
                All
              </label>
              {["SingleColor", "MultiColor"].map((c) => (
                <label key={c} className="flex items-center gap-2 mt-1">
                  <input
                    type="radio"
                    name="count"
                    value={c}
                    checked={filters.count === c}
                    onChange={(e) => handleFilterChange("count", e.target.value)}
                    className="accent-primary  cursor-pointer"
                  />
                  {c}
                </label>
              ))}
            </div>
          )}

          {/* Price Range */}
          <div className="mb-4">
            <label className="block font-semibold mb-2 text-primary text-lg">Price Range:</label>
            {products.length > 0 && (
              <>
                {(() => {
                  const minSellingPrice = Math.min(...products.map((p) => p.sellingprice));
                  const maxSellingPrice = Math.max(...products.map((p) => p.sellingprice));
                  return (
                    <>
                      <div className="text-center mt-1 text-sm font-medium">
                        ₹{filters.price[0]} – ₹{filters.price[1]}
                      </div>
                      <input
                        type="range"
                        min={minSellingPrice}
                        max={maxSellingPrice}
                        value={filters.price[1]}
                        onChange={(e) =>
                          handleFilterChange("price", [filters.price[0], Number(e.target.value)])
                        }
                        className="w-full accent-primary  cursor-pointer -mt-2"
                      />
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>₹{minSellingPrice}</span>
                        <span>₹{maxSellingPrice}</span>
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>

          {/* Rating */}
          <div className="mb-4">
            <label className="block font-semibold text-primary text-lg mb-1">Rating:</label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="rating"
                value=""
                checked={filters.rating === ""}
                onChange={(e) => handleFilterChange("rating", e.target.value)}
                className="accent-primary cursor-pointer"
              />
              All
            </label>
            {[5, 4, 3, 2, 1].map((r) => (
              <label key={r} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rating"
                  value={r}
                  checked={filters.rating == r}
                  onChange={(e) => handleFilterChange("rating", e.target.value)}
                  className="accent-primary cursor-pointer"
                />
                {r} & up
              </label>
            ))}
          </div>

          {/* Offer */}
          <div className="mb-4">
            <label className="block font-semibold text-primary text-lg mb-1">Offer:</label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="offer"
                value=""
                checked={filters.offer === ""}
                onChange={(e) => handleFilterChange("offer", e.target.value)}
                className="accent-primary cursor-pointer"
              />
              All
            </label>
            {[50, 30, 20, 10].map((o) => (
              <label key={o} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="offer"
                  value={o}
                  checked={filters.offer == o}
                  onChange={(e) => handleFilterChange("offer", e.target.value)}
                  className="accent-primary cursor-pointer"
                />
                {o}% & above
              </label>
            ))}
          </div>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="w-full bg-primary cursor-pointer text-white px-4 py-2 rounded mt-6"
          >
            Clear Filters
          </button>
        </aside>

        {/* Overlay */}
        {showFilters && (
          <div
            onClick={() => setShowFilters(false)}
            className="fixed inset-0 bg-black/40 md:hidden z-40"
          />
        )}

        {/* Products Section */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar: Sort + Grid + Mobile Filter */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 md:hidden cursor-pointer border px-3 py-1 rounded"
            >
              <FaFilter /> Filters
            </button>

            <select
              className="border cursor-pointer border-gray-300 p-1 rounded"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="default">Sort By</option>
              <option value="priceHigh">Price: High → Low</option>
              <option value="priceLow">Price: Low → High</option>
            </select>

            <div className="hidden md:flex gap-2">
              <button
                onClick={() => setGridCols(3)}
                className={`cursor-pointer ${gridCols === 3 ? "bg-primary text-white" : "bg-white"
                  } p-2 border rounded`}
              >
                <FaThLarge />
              </button>
              <button
                onClick={() => setGridCols(4)}
                className={`cursor-pointer ${gridCols === 4 ? "bg-primary text-white" : "bg-white"
                  } p-2 border rounded`}
              >
                <FaTh />
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary border-solid"></div>
                <span className="ml-4 text-primary font-semibold">Loading products...</span>
              </div>
            ) : currentProducts.length === 0 ? (
              <p className="text-center mt-10 text-gray-500">No products found.</p>
            ) : (
              <div
                className={`grid gap-4 ${gridCols === 3
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
                  }`}
              >
                {currentProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onOpenModal={() => setSelectedProduct(p)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
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
                  className={`cursor-pointer px-3 py-1 border rounded-full ${currentPage === i + 1
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
        </div>
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </div>
    </>
  );
};

export default AllProducts;