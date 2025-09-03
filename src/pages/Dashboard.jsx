import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Home, Users, ShoppingCart, FileText, LogOut } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Import halaman
import Products from "./Products";
import Customers from "./Customers";
import Sales from "./Sales";
import Reports from "./Reports";

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");
  const [stats, setStats] = useState({
    totalSales: 0,
    customers: 0,
    products: 0,
  });
  const [salesData, setSalesData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const tenantId = "tenant_demo_1";

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const navItems = [
    { name: "Dashboard", icon: Home },
    { name: "Products", icon: ShoppingCart },
    { name: "Customers", icon: Users },
    { name: "Sales", icon: FileText },
    { name: "Reports", icon: FileText },
  ];

  const fetchStats = async () => {
    try {
      const productsSnap = await getDocs(
        collection(db, `tenants/${tenantId}/products`)
      );
      const customersSnap = await getDocs(
        collection(db, `tenants/${tenantId}/customers`)
      );
      const salesSnap = await getDocs(
        collection(db, `tenants/${tenantId}/sales`)
      );

      // Filter per tanggal jika diisi
      let filteredProducts = productsSnap.docs.map((d) => d.data());
      let filteredCustomers = customersSnap.docs.map((d) => d.data());
      let filteredSales = salesSnap.docs.map((d) => d.data());

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        filteredProducts = filteredProducts.filter((p) => {
          const date = p.createdAt?.toDate ? p.createdAt.toDate() : new Date();
          return date >= start && date <= end;
        });

        filteredCustomers = filteredCustomers.filter((c) => {
          const date = c.createdAt?.toDate ? c.createdAt.toDate() : new Date();
          return date >= start && date <= end;
        });

        filteredSales = filteredSales.filter((s) => {
          const date = s.createdAt?.toDate ? s.createdAt.toDate() : new Date();
          return date >= start && date <= end;
        });
      }

      // Hitung total stats
      const totalSales = filteredSales.reduce(
        (acc, s) => acc + (s.total || 0),
        0
      );

      setStats({
        totalSales,
        customers: filteredCustomers.length,
        products: filteredProducts.length,
      });

      // Aggregate sales per bulan untuk chart
      const salesPerMonth = {};
      filteredSales.forEach((s) => {
        const date = s.createdAt?.toDate ? s.createdAt.toDate() : new Date();
        const month = date.toLocaleString("default", { month: "short" });
        salesPerMonth[month] = (salesPerMonth[month] || 0) + (s.total || 0);
      });

      const chartData = Object.keys(salesPerMonth).map((month) => ({
        month,
        sales: salesPerMonth[month],
      }));

      setSalesData(chartData);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  const renderContent = () => {
    switch (activePage) {
      case "Dashboard":
        return (
          <div className="p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow p-6 hover:shadow-2xl transition">
                <h3 className="text-gray-500">Total Sales</h3>
                <p className="text-2xl font-bold text-gray-800">
                  ${stats.totalSales.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow p-6 hover:shadow-2xl transition">
                <h3 className="text-gray-500">Customers</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.customers}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow p-6 hover:shadow-2xl transition">
                <h3 className="text-gray-500">Products</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.products}
                </p>
              </div>
            </div>

            {/* Date Filter */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-xl shadow p-4 items-center">
              <label className="flex items-center">
                Start Date:
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border rounded px-3 py-1 ml-2"
                />
              </label>
              <label className="flex items-center">
                End Date:
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border rounded px-3 py-1 ml-2"
                />
              </label>
            </div>

            {/* Sales Chart */}
            {salesData.length > 0 ? (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold mb-4">Sales Per Month</h2>
                <div className="w-full h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={salesData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      barSize={40}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="sales"
                        fill="#4f46e5"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center">
                Tidak ada data untuk tanggal ini.
              </p>
            )}
          </div>
        );
      case "Products":
        return <Products />;
      case "Customers":
        return <Customers />;
      case "Sales":
        return <Sales />;
      case "Reports":
        return <Reports />;
      default:
        return <div>Halaman tidak ditemukan</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 bg-gray-900 text-white w-64 p-6 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto`}
      >
        <h2 className="text-2xl font-bold mb-8">Dashboard Sales</h2>
        <nav className="space-y-4">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActivePage(item.name)}
              className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors ${
                activePage === item.name ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Navbar */}
        <div className="flex justify-between items-center bg-white shadow p-4">
          <button
            className="lg:hidden text-gray-700"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h1 className="text-xl font-semibold">{activePage}</h1>
          <button
            onClick={handleLogout}
            className="flex items-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
          >
            <LogOut className="w-5 h-5 mr-2" /> Logout
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{renderContent()}</div>
      </div>
    </div>
  );
}
