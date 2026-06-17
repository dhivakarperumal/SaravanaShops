import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";
import { FaArrowLeft, FaSave, FaTimes } from "react-icons/fa";

export default function AddBilling() {
  const location = useLocation();
  const initialData = location.state?.billing || null;
  const navigate = useNavigate();

  const billingId = initialData?.id ?? null;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    invoiceNo: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    invoiceValue: "",
    invoiceGSTValue: "",
    invoiceTotalValue: "",
    transportAmount: "",
    status: "Pending",
  });

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      setForm({
        invoiceNo: initialData.invoiceNo || "",
        invoiceDate: initialData.invoiceDate || new Date().toISOString().split("T")[0],
        invoiceValue: initialData.invoiceValue || "",
        invoiceGSTValue: initialData.invoiceGSTValue || "",
        invoiceTotalValue: initialData.invoiceTotalValue || "",
        transportAmount: initialData.transportAmount || "",
        status: initialData.status || "Pending",
      });
      if (initialData.billPdfBase64) {
        setPdfPreview("PDF attached");
      }
    } else {
      // Get next invoice number
      fetchNextInvoiceNo();
    }
  }, [initialData]);

  // Fetch next invoice number
  const fetchNextInvoiceNo = async () => {
    try {
      const res = await api.get("/invoices/nextno");
      if (res.data.success) {
        setForm((prev) => ({ ...prev, invoiceNo: res.data.invoiceNo }));
      }
    } catch (err) {
      console.error("Error fetching invoice number:", err);
      toast.error("Could not fetch invoice number");
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Auto-calculate total
    if (name === "invoiceValue" || name === "invoiceGSTValue" || name === "transportAmount") {
      const invValue = name === "invoiceValue" ? parseFloat(value) || 0 : parseFloat(form.invoiceValue) || 0;
      const gst = name === "invoiceGSTValue" ? parseFloat(value) || 0 : parseFloat(form.invoiceGSTValue) || 0;
      const transport = name === "transportAmount" ? parseFloat(value) || 0 : parseFloat(form.transportAmount) || 0;
      const total = invValue + gst + transport;
      setForm((prev) => ({ ...prev, invoiceTotalValue: total.toFixed(2) }));
    }
  };

  // Handle PDF file
  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please select a PDF file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("PDF size should be less than 5MB");
        return;
      }
      setPdfFile(file);
      setPdfPreview(file.name);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Validate form
  const validateForm = () => {
    if (!form.invoiceNo?.trim()) {
      toast.error("Invoice Number is required");
      return false;
    }
    if (!form.invoiceDate) {
      toast.error("Invoice Date is required");
      return false;
    }
    if (form.invoiceValue === "" || parseFloat(form.invoiceValue) <= 0) {
      toast.error("Invoice Value must be greater than 0");
      return false;
    }
    return true;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        invoiceNo: form.invoiceNo,
        invoiceDate: form.invoiceDate,
        invoiceValue: parseFloat(form.invoiceValue) || 0,
        invoiceGSTValue: parseFloat(form.invoiceGSTValue) || 0,
        invoiceTotalValue: parseFloat(form.invoiceTotalValue) || 0,
        transportAmount: parseFloat(form.transportAmount) || 0,
        status: form.status,
      };

      // Add PDF if new file selected
      if (pdfFile) {
        const base64 = await fileToBase64(pdfFile);
        payload.billPdfBase64 = base64;
        payload.billPdfName = pdfFile.name;
      }

      if (billingId) {
        // Update
        await api.put(`/invoices/${billingId}`, payload);
        toast.success("Billing updated successfully!");
      } else {
        // Create
        await api.post("/invoices", payload);
        toast.success("Billing created successfully!");
      }

      navigate("/superadmin/allbillings");
    } catch (err) {
      console.error("Error:", err);
      toast.error(err.response?.data?.message || "Error saving billing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-3 sm:px-5 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/superadmin/allbillings")}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
          >
            <FaArrowLeft className="text-lg" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {billingId ? "Edit Billing" : "Create New Billing"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {billingId ? "Update the billing details" : "Add a new billing/invoice"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-8 space-y-6">

            {/* Basic Info */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                Basic Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Invoice Number *</label>
                  <input
                    type="text"
                    name="invoiceNo"
                    value={form.invoiceNo}
                    onChange={handleChange}
                    readOnly={!!billingId}
                    placeholder="e.g., INV-001"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Invoice Date *</label>
                  <input
                    type="date"
                    name="invoiceDate"
                    value={form.invoiceDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Amount Details */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                Amount Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Invoice Value (₹) *</label>
                  <input
                    type="number"
                    name="invoiceValue"
                    value={form.invoiceValue}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">GST Value (₹)</label>
                  <input
                    type="number"
                    name="invoiceGSTValue"
                    value={form.invoiceGSTValue}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Transport Amount (₹)</label>
                  <input
                    type="number"
                    name="transportAmount"
                    value={form.transportAmount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Total Value (₹)</label>
                  <input
                    type="number"
                    name="invoiceTotalValue"
                    value={form.invoiceTotalValue}
                    readOnly
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-100 text-gray-900 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                </div>
              </div>
            </div>

            {/* PDF Upload */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                Bill PDF
              </h2>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary/50 transition-all">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfChange}
                  className="hidden"
                  id="pdfInput"
                />
                <label htmlFor="pdfInput" className="cursor-pointer">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-gray-900 font-semibold">Drop PDF here or click to select</p>
                  <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
                </label>
                {pdfPreview && (
                  <div className="mt-4 flex items-center justify-center gap-2 bg-green-50 p-3 rounded-lg border border-green-200">
                    <span className="text-green-600 font-semibold">✓</span>
                    <span className="text-sm text-gray-700">{pdfPreview}</span>
                    <button
                      type="button"
                      onClick={() => { setPdfFile(null); setPdfPreview(null); }}
                      className="ml-auto text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 sm:px-8 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/superadmin/allbillings")}
              className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <FaSave className="text-sm" />
              {loading ? "Saving..." : billingId ? "Update Billing" : "Create Billing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
