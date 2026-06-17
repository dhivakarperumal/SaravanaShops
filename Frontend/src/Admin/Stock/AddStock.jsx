import React, { useEffect, useState, useRef } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { FaSearch, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function AddStock() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calculateColorStock = (c) => {
    if (!c.stock) return 0;
    return Object.values(c.stock).reduce((sum, val) => sum + (Number(val) || 0), 0);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        let data = res.data.success ? res.data.data : (res.data || []);
        // Normalize IDs to handle the expected property name 'id' in this component
        data = data.map(p => ({ ...p, id: p.productId || p.id || p._id }));
        setProducts(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleStockChange = (prodId, value, color = null, size = null) => {
    const addVal = Number(value);
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== prodId) return p;
        const newP = { ...p };

        if (p.productType === "Bangles") {
          if (p.count === "SingleColor" && color && size) {
            newP.colors = newP.colors.map(c => {
              if (c.color !== color) return c;

              const oldStock = c.stock[size] || 0;
              const stock = { ...c.stock, [size]: oldStock + addVal };
              const stocks = Object.values(stock).reduce((sum, v) => sum + v, 0);

              return { ...c, stock, stocks };
            });
          } else if (p.count === "MultiColor") {
            const oldStock = p.stock || 0;
            newP.stock = oldStock + addVal;
            newP.stocks = newP.stock;
          }
        }

        if (p.productType === "Sarees" || p.productType === "Jewels") {
          const oldStock = p.stock || 0;
          newP.stock = oldStock + addVal;
        }

        return newP;
      })
    );
  };

  const saveStock = async (prod) => {
    try {
      await api.put(`/products/${prod.id}`, prod);
      toast.success("Stock updated successfully!");
      navigate("/superadmin/stockDetails");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update stock");
    }
  };

  if (loading) return <div>Loading products...</div>;

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const getImg = (p) => {
    if (p?.images && Array.isArray(p.images) && p.images[0]) return p.images[0];
    if (p?.image && typeof p.image === 'string') return p.image;
    if (Array.isArray(p?.image) && p.image[0]) return p.image[0];
    if (p?.colors && Array.isArray(p.colors)) {
      for (const c of p.colors) {
        if (c?.images && Array.isArray(c.images) && c.images[0]) return c.images[0];
        if (c?.image && typeof c.image === 'string') return c.image;
      }
    }
    return null;
  };

  const getColorImg = (c) => {
    if (c?.images && Array.isArray(c.images) && c.images[0]) return c.images[0];
    if (c?.image && typeof c.image === 'string') return c.image;
    if (Array.isArray(c?.image) && c.image[0]) return c.image[0];
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-semibold mb-4">Add / Update Stock</h2>

      {/* Product Selector — Searchable Dropdown */}
      <div className="mb-6" ref={dropdownRef}>
        <label className="font-semibold block mb-2">Select Product:</label>
        <div className="relative">
          <div
            className="w-full border border-gray-300 rounded-lg px-4 py-3 flex items-center gap-2 cursor-pointer bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all"
            onClick={() => setShowDropdown(true)}
          >
            <FaSearch className="text-gray-400 text-sm flex-shrink-0" />
            <input
              type="text"
              placeholder={selectedProduct ? `${selectedProduct.name} (${selectedProduct.productId})` : "Search by Name, ID, or Type…"}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            />
            {(searchTerm || selectedProductId) && (
              <button
                onClick={(e) => { e.stopPropagation(); setSearchTerm(""); setSelectedProductId(""); setShowDropdown(false); }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>

          {showDropdown && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
              {products
                .filter(p => {
                  if (!searchTerm) return true;
                  const q = searchTerm.toLowerCase();
                  return (
                    p.name?.toLowerCase().includes(q) ||
                    p.productId?.toLowerCase().includes(q) ||
                    p.productType?.toLowerCase().includes(q)
                  );
                })
                .map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      setSelectedProductId(prod.id);
                      setSearchTerm("");
                      setShowDropdown(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-0 ${
                      selectedProductId === prod.id ? "bg-primary/10" : ""
                    }`}
                  >
                    {getImg(prod) ? (
                      <img src={getImg(prod)} alt={prod.name} className="w-10 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs flex-shrink-0">No img</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-800 truncate">{prod.name}</div>
                      <div className="text-xs text-gray-500">{prod.productId} • {prod.productType}</div>
                    </div>
                    {selectedProductId === prod.id && (
                      <span className="text-primary text-xs font-bold">✓</span>
                    )}
                  </div>
                ))}
              {products.filter(p => {
                if (!searchTerm) return true;
                const q = searchTerm.toLowerCase();
                return p.name?.toLowerCase().includes(q) || p.productId?.toLowerCase().includes(q) || p.productType?.toLowerCase().includes(q);
              }).length === 0 && (
                <div className="px-4 py-6 text-center text-gray-400 text-sm">No products found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stock Form for Selected Product */}
      {selectedProduct && (
        <div className="mb-6 p-4 border border-gray-300 rounded-lg">
          <div className="flex items-center gap-4 mb-3">
            {getImg(selectedProduct) && (
              <img
                src={getImg(selectedProduct)}
                alt={selectedProduct.name}
                className="w-16 h-16 object-cover rounded-xl border border-gray-200 shadow-sm flex-shrink-0"
              />
            )}
            <div>
              <h3 className="font-bold text-lg">
                {selectedProduct.name} ({selectedProduct.productId})
              </h3>
              <span className="text-sm text-gray-500">{selectedProduct.productType}</span>
            </div>
          </div>

   

          {selectedProduct.productType === "Bangles" && (
  <>
    <p className="mb-2 text-sm text-gray-700">Count Type: {selectedProduct.count}</p>

    {/* --- SingleColor --- */}
    {selectedProduct.count === "SingleColor" && (
      <>
        {/* Desktop Table */}
        <div className="hidden md:block bg-white shadow rounded-lg overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm text-left">
            <thead className="bg-primary text-white text-center">
              <tr>
                <th className="px-3 py-4">Image</th>
                <th className="px-3 py-4">Color</th>
                <th className="px-3 py-4">Size</th>
                <th className="px-3 py-4">Old Stock</th>
                <th className="px-3 py-4">Add Stock</th>
                <th className="px-3 py-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedProduct.colors?.map(c => (
                <tr key={c.color} className="text-center border border-gray-200">
                  {/* Image cell */}
                  <td className="px-3 py-3">
                    {getColorImg(c) ? (
                      <img
                        src={getColorImg(c)}
                        alt={c.color}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200 mx-auto shadow-sm"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-lg border border-gray-200 mx-auto shadow-sm"
                        style={{ backgroundColor: c.color }}
                      />
                    )}
                  </td>
                  {/* Color swatch + hex */}
                  <td className="px-3 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: c.color }}
                        title={c.color}
                      />
                      <span className="font-medium text-sm">{c.color}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4">{c.size.join(", ")}</td>
                  <td className="px-3 py-4">
                    {c.size.map(sz => (
                      <div key={sz}>{c.stock[sz]}</div>
                    ))}
                  </td>
                  <td className="px-3 py-4">
                          {c.size.map(sz => (
                            <div key={sz} className="mb-1 flex items-center justify-center gap-1">
                              <input
                                type="number"
                                placeholder={String(sz)}
                                min={0}
                                className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-center focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                                onChange={e =>
                                  handleStockChange(selectedProduct.id, e.target.value, c.color, sz)
                                }
                              />
                            </div>
                          ))}
                  </td>
                  <td className="px-3 py-4 font-semibold">{calculateColorStock(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden flex flex-col gap-4 mt-4">
          {selectedProduct.colors?.map(c => (
            <div key={c.color} className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white flex flex-col gap-2">
              <div className="flex items-center gap-3">
                {/* Product image for the color */}
                {getColorImg(c) ? (
                  <img
                    src={getColorImg(c)}
                    alt={c.color}
                    className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-lg border border-gray-200 shadow-sm flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: c.color }} />
                    <span className="font-semibold text-sm">{c.color}</span>
                  </div>
                  <span className="text-xs text-gray-500">Total: {calculateColorStock(c)}</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">Sizes: {c.size.join(", ")}</div>
              <div className="mt-2 space-y-2">
                {c.size.map(sz => (
                  <div key={sz} className="flex items-center justify-between gap-2">
                    <span className="text-sm">{sz} — {c.stock[sz]} pcs</span>
                    <input
                      type="number"
                      placeholder={String(sz)}
                      min={1}
                      className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-center focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                      onChange={e =>
                        handleStockChange(selectedProduct.id, e.target.value, c.color, sz)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    )}

    {/* --- MultiColor --- */}
    {selectedProduct.count === "MultiColor" && (
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
        <span>Old Stock: {selectedProduct.stock}</span>
        <input
          type="number"
          placeholder="Add"
          onChange={e => handleStockChange(selectedProduct.id, e.target.value)}
          className="w-full sm:w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
        />
        <span>Total: {selectedProduct.stocks}</span>
      </div>
    )}
  </>
)}


          {/* Sarees & Jewels */}
          {(selectedProduct.productType === "Sarees" || selectedProduct.productType === "Jewels") && (
            <div className="flex items-center gap-2 mt-2">
              <span>Old Stock: {selectedProduct.stock}</span>
              <input
                type="number"
                placeholder="Add"
                onChange={e => handleStockChange(selectedProduct.id, e.target.value)}
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
              <span>Total: {selectedProduct.stock}</span>
            </div>
          )}

          <button
            onClick={() => saveStock(selectedProduct)}
            className="mt-2 px-4 py-2 bg-primary text-white rounded  cursor-pointer"
          >
            Save Stock
          </button>
        </div>
      )}
    </div>
  );
}
