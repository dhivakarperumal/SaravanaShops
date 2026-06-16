import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

export default function StockDetails() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  const calculateColorStock = (c) => {
    if (!c.stock) return 0;
    return Object.values(c.stock).reduce((sum, val) => sum + (Number(val) || 0), 0);
  };

  const calculateTotalStock = (p) => {
    if (p.productType === "Bangles" && p.count === "SingleColor") {
      if (!p.colors || !Array.isArray(p.colors)) return 0;
      return p.colors.reduce((total, c) => total + calculateColorStock(c), 0);
    }
    return p.stock || 0;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        if (res.data.success) {
          setProducts(res.data.data);
        } else {
          setProducts(res.data || []);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <div>Loading stock...</div>;

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Stock Details</h2>
        <button
          className="bg-primary cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          onClick={() => navigate("/superadmin/stocks")}
        >
          Add Stock
        </button>
      </div>

      <div className=" bg-white shadow rounded-lg overflow-x-auto">
 
        {/* --- Desktop Table --- */}
<div className="hidden md:block overflow-x-auto">
  <table className="min-w-full text-sm text-left">
    <thead className="bg-primary text-white text-center">
      <tr>
        <th className="px-3 py-4">Product ID</th>
        <th className="px-3 py-4">Name</th>
        <th className="px-3 py-4">Category</th>
        <th className="px-3 py-4">Total Stock</th>
      </tr>
    </thead>
    <tbody>
      {products.map(p => (
        <React.Fragment key={p.productId}>
          <tr
            className="cursor-pointer text-center hover:bg-gray-100 border border-gray-300"
            onClick={() => setExpandedId(expandedId === p.productId ? null : p.productId)}
          >
            <td className="px-3 py-4 font-semibold text-blue-600">{p.productId}</td>
            <td className="px-3 py-4">{p.name}</td>
            <td className="px-3 py-4">{p.productType}</td>
            <td className="px-3 py-4">{calculateTotalStock(p)}</td>
          </tr>

          {/* Expanded row */}
          {expandedId === p.productId && (
            <tr>
              <td colSpan={4} className="p-4 bg-gray-50 ">
                <div className=" bg-white shadow rounded-lg overflow-x-auto">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-primary text-white text-center">
                      <tr>
                        <th className="px-3 py-4">Attribute</th>
                        <th className="px-3 py-4">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.productType === "Bangles" && p.count === "SingleColor" &&
                              p.colors?.map(c => (
                                <tr key={c.color} className="border border-gray-300 text-center">
                                  <td className="px-3 py-4 font-semibold">
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="w-5 h-5 rounded-full border border-gray-300" style={{ backgroundColor: c.color }} title={c.color}></div>
                                      <span>{c.color}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-4">
                                    {c.size.map(sz => (
                                      <div key={sz}>{sz}: {c.stock[sz]}</div>
                                    ))}
                                    <div>Total: {calculateColorStock(c)}</div>
                                  </td>
                                </tr>
                              ))
                            }

                            {p.productType === "Bangles" && p.count === "MultiColor" && (
                              <tr>
                                <td className="px-3 py-4">Total Stock</td>
                                <td className="px-3 py-4">{p.stock}</td>
                              </tr>
                            )}

                            {p.productType === "Sarees" && (
                              <>
                                {/* <tr>
                                  <td className="px-3 py-4">Color</td>
                                  <td className="px-3 py-4">{p.color}</td>
                                </tr> */}

                                <tr>
                                  <td className="px-3 text-center py-4">Stock</td>
                                  <td className="px-3 text-center py-4">{p.stock}</td>
                                </tr>
                              </>
                            )}

                            {p.productType === "Jewels" && (
                              <>
                                <tr>
                                  <td className="px-3 py-4">Subcategory</td>
                                  <td className="px-3 py-4">{p.subcategory}</td>
                                </tr>
                                <tr>
                                  <td className="px-3 py-4">Items</td>
                                  <td className="px-3 py-4">{p.list_of_items?.join(", ")}</td>
                                </tr>
                                <tr>
                                  <td className="px-3 py-4">Stock</td>
                                  <td className="px-3 py-4">{p.stock}</td>
                                </tr>
                              </>
                            )}

                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          )}
        </React.Fragment>
      ))}
    </tbody>
  </table>
</div>

{/* --- Mobile Cards --- */}
<div className="md:hidden flex flex-col gap-4">
  {products.map(p => (
    <div key={p.productId} className="border rounded-lg shadow-sm bg-white p-4">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedId(expandedId === p.productId ? null : p.productId)}>
        <div>
          <div className="font-semibold text-blue-600">{p.productId}</div>
          <div className="text-gray-700">{p.name}</div>
          <div className="text-gray-500 text-sm">{p.productType}</div>
        </div>
        <div className="text-gray-800 font-semibold">{calculateTotalStock(p)}</div>
      </div>

      {/* Expanded info */}
      {expandedId === p.productId && (
        <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-2">
          {p.productType === "Bangles" && p.count === "SingleColor" &&
            p.colors?.map(c => (
              <div key={c.color} className="border border-gray-200 rounded p-2">
                <div className="font-semibold flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: c.color }} title={c.color}></div>
                  <span>{c.color}</span>
                </div>
                {c.size.map(sz => (
                  <div key={sz} className="text-sm">{sz}: {c.stock[sz]}</div>
                ))}
                <div className="text-sm font-medium">Total: {calculateColorStock(c)}</div>
              </div>
            ))
          }

          {p.productType === "Bangles" && p.count === "MultiColor" && (
            <div className="text-sm">Total Stock: {p.stock}</div>
          )}

          {p.productType === "Sarees" && (
            <>
              <div className="text-sm">Color: {p.color}</div>
              <div className="text-sm">Stock: {p.stock}</div>
            </>
          )}

          {p.productType === "Jewels" && (
            <>
              <div className="text-sm">Subcategory: {p.subcategory}</div>
              <div className="text-sm">Items: {p.list_of_items?.join(", ")}</div>
              <div className="text-sm">Stock: {p.stock}</div>
            </>
          )}
        </div>
      )}
    </div>
  ))}
</div>

      </div>
    </div>
  );
}
