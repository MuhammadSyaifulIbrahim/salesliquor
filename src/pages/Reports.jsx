import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function DashboardReports() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  const tenantId = "tenant_demo_1";
  const salesRef = collection(db, `tenants/${tenantId}/sales`);
  const customersRef = collection(db, `tenants/${tenantId}/customers`);
  const productsRef = collection(db, `tenants/${tenantId}/products`);

  useEffect(() => {
    const fetchData = async () => {
      const snapCust = await getDocs(customersRef);
      setCustomers(snapCust.docs.map((d) => ({ id: d.id, ...d.data() })));
      const snapProd = await getDocs(productsRef);
      setProducts(snapProd.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, []);

  const fetchReport = async () => {
    if (!startDate || !endDate) return alert("Pilih tanggal awal & akhir!");
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end)
      return alert("Tanggal awal tidak boleh lebih baru dari tanggal akhir!");
    end.setHours(23, 59, 59);

    try {
      let q = query(
        salesRef,
        where("createdAt", ">=", start),
        where("createdAt", "<=", end),
        orderBy("createdAt", "asc")
      );
      if (selectedCustomer)
        q = query(
          salesRef,
          where("createdAt", ">=", start),
          where("createdAt", "<=", end),
          where("customerId", "==", selectedCustomer),
          orderBy("createdAt", "asc")
        );

      const snap = await getDocs(q);
      let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (selectedProduct)
        data = data.filter((s) =>
          s.items?.some((i) => i.productId === selectedProduct)
        );
      setSales(data);
    } catch (error) {
      console.error(error);
      alert("Gagal mengambil laporan.");
    }
  };

  const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalItems = sales.reduce(
    (sum, s) => sum + (s.items?.reduce((a, i) => a + i.qty, 0) || 0),
    0
  );

  const chartData =
    sales.length > 0
      ? sales.reduce((acc, s) => {
          const date = s.createdAt?.toDate().toLocaleDateString();
          const found = acc.find((d) => d.date === date);
          if (found) found.total += s.total || 0;
          else acc.push({ date, total: s.total || 0 });
          return acc;
        }, [])
      : [];

  const exportExcel = () => {
    const rows = sales.map((s) => ({
      Tanggal: s.createdAt?.toDate().toLocaleString(),
      Customer: customers.find((c) => c.id === s.customerId)?.name || "Unknown",
      Item: s.items?.map((i) => `${i.name} x${i.qty}`).join(", "),
      Total: s.total,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "sales_report.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Sales Report", 14, 15);
    const tableData = sales.map((s) => [
      s.createdAt?.toDate().toLocaleString(),
      customers.find((c) => c.id === s.customerId)?.name || "Unknown",
      s.items?.map((i) => `${i.name} x${i.qty}`).join(", "),
      `Rp ${s.total?.toLocaleString()}`,
    ]);
    doc.autoTable({
      head: [["Tanggal", "Customer", "Item", "Total"]],
      body: tableData,
      startY: 25,
    });
    doc.save("sales_report.pdf");
  };

  const inputClass = "border p-2 rounded";
  const buttonClass = "bg-blue-600 text-white px-4 py-2 rounded";

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-2 items-center mb-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={inputClass}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className={inputClass}
        />
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className={inputClass}
        >
          <option value="">Semua Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className={inputClass}
        >
          <option value="">Semua Produk</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button onClick={fetchReport} className={buttonClass}>
          Tampilkan
        </button>
      </div>

      {sales.length > 0 && (
        <>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="bg-white rounded-xl shadow p-4 flex-1">
              Total transaksi: {sales.length}
            </div>
            <div className="bg-white rounded-xl shadow p-4 flex-1">
              Total item terjual: {totalItems}
            </div>
            <div className="bg-white rounded-xl shadow p-4 flex-1 font-bold">
              Total pendapatan: Rp {totalRevenue.toLocaleString()}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={exportExcel}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Export Excel
              </button>
              <button
                onClick={exportPDF}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Export PDF
              </button>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="p-4 h-64 bg-white rounded-xl shadow mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#2563eb" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white rounded-xl shadow p-4">
            <table className="border w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Tanggal</th>
                  <th className="p-2 border">Customer</th>
                  <th className="p-2 border">Item</th>
                  <th className="p-2 border">Total</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td className="p-2 border">
                      {s.createdAt?.toDate().toLocaleString()}
                    </td>
                    <td className="p-2 border">
                      {customers.find((c) => c.id === s.customerId)?.name ||
                        "Unknown"}
                    </td>
                    <td className="p-2 border">
                      {s.items?.map((i) => `${i.name} x${i.qty}`).join(", ")}
                    </td>
                    <td className="p-2 border">
                      Rp {s.total?.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center p-4 text-gray-500">
                      Belum ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
