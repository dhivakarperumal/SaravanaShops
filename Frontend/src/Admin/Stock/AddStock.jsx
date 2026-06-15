import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";

export default function AddStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
      await updateDoc(doc(db, "products", prod.id), prod);
      toast.success("Stock updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update stock");
    }
  };

  if (loading) return <div>Loading products...</div>;

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-semibold mb-4">Add / Update Stock</h2>

      {/* Product Selector */}
      <div className="mb-6">
        <label className="font-semibold mr-2">Select Product:</label>
        <select
          value={selectedProductId}
          onChange={e => setSelectedProductId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
        >
          <option value="">-- Select --</option>
          {products.map(prod => (
            <option key={prod.id} value={prod.id}>
              {prod.name} ({prod.productId}) - {prod.productType}
            </option>
          ))}
        </select>
      </div>

      {/* Stock Form for Selected Product */}
      {selectedProduct && (
        <div className="mb-6 p-4 border border-gray-300 rounded-lg">
          <h3 className="font-bold text-lg mb-2">
            {selectedProduct.name} ({selectedProduct.productId}) - {selectedProduct.productType}
          </h3>

   

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
                  <td className="px-3 py-4">{c.color}</td>
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
                  <td className="px-3 py-4">{c.stocks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden flex flex-col gap-4 mt-4">
          {selectedProduct.colors?.map(c => (
            <div key={c.color} className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{c.color}</span>
                <span className="text-sm text-gray-500">Total: {c.stocks}</span>
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
