import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { Plus, Trash2 } from "lucide-react";

const ProductButton = ({ product, onAdd }) => (
  <button
    onClick={() => onAdd(product)}
    className="border p-2 rounded hover:bg-gray-100 w-full text-left text-sm sm:text-base truncate"
  >
    {product.name} - Rp {product.price.toLocaleString()}
  </button>
);

const CartItem = ({ item, onRemove }) => (
  <div className="flex justify-between items-center border-b py-2 text-sm sm:text-base">
    <div className="truncate">
      {item.name} x {item.qty}
    </div>
    <div>Rp {item.subtotal.toLocaleString()}</div>
    <button
      onClick={() => onRemove(item.id)}
      className="text-red-500 hover:text-red-600"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  </div>
);

export default function DashboardSales() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [cart, setCart] = useState([]);
  const [sales, setSales] = useState([]);

  const tenantId = "tenant_demo_1";
  const customersRef = collection(db, `tenants/${tenantId}/customers`);
  const productsRef = collection(db, `tenants/${tenantId}/products`);
  const salesRef = collection(db, `tenants/${tenantId}/sales`);

  useEffect(() => {
    const fetchInitialData = async () => {
      const cSnap = await getDocs(customersRef);
      setCustomers(cSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      const pSnap = await getDocs(productsRef);
      setProducts(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchInitialData();

    const unsubscribe = onSnapshot(salesRef, (snapshot) => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const filteredSales = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((sale) => {
          const saleDate = sale.createdAt?.toDate();
          return (
            saleDate &&
            saleDate.getMonth() === currentMonth &&
            saleDate.getFullYear() === currentYear
          );
        });
      setSales(filteredSales);
    });
    return () => unsubscribe();
  }, []);

  const addToCart = (product) => {
    if (product.stock <= 0) return alert("Stok produk habis!");
    const exist = cart.find((c) => c.id === product.id);
    if (exist) {
      if (exist.qty >= product.stock)
        return alert("Jumlah melebihi stok tersedia!");
      setCart(
        cart.map((c) =>
          c.id === product.id
            ? { ...c, qty: c.qty + 1, subtotal: (c.qty + 1) * c.price }
            : c
        )
      );
    } else {
      setCart([...cart, { ...product, qty: 1, subtotal: product.price }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter((c) => c.id !== id));

  const saveSale = async () => {
    if (!selectedCustomer) return alert("Pilih customer!");
    if (cart.length === 0) return alert("Keranjang kosong!");
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

    try {
      await addDoc(salesRef, {
        customerId: selectedCustomer,
        items: cart.map((c) => ({
          productId: c.id,
          name: c.name,
          price: c.price,
          qty: c.qty,
          subtotal: c.subtotal,
        })),
        total,
        createdAt: serverTimestamp(),
      });

      await Promise.all(
        cart.map((item) =>
          updateDoc(doc(productsRef, item.id), { stock: item.stock - item.qty })
        )
      );

      setCart([]);
      setSelectedCustomer("");
      alert("Transaksi berhasil!");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan transaksi");
    }
  };

  const inputClass =
    "border p-2 w-full rounded text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500";
  const buttonClass =
    "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm sm:text-base transition w-full sm:w-auto";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
          <h2 className="font-semibold mb-4 text-sm sm:text-base">
            Pilih Customer
          </h2>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className={inputClass}
          >
            <option value="">-- Pilih Customer --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <h2 className="font-semibold mt-6 mb-2 text-sm sm:text-base">
            Pilih Produk:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {products.map((p) => (
              <ProductButton key={p.id} product={p} onAdd={addToCart} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 sm:p-6 flex flex-col">
          <h2 className="font-semibold mb-4 text-sm sm:text-base">Keranjang</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center text-sm sm:text-base">
              Keranjang kosong
            </p>
          ) : (
            <>
              {cart.map((item) => (
                <CartItem key={item.id} item={item} onRemove={removeFromCart} />
              ))}
              <div className="mt-4 font-bold text-sm sm:text-base">
                Total: Rp{" "}
                {cart.reduce((sum, i) => sum + i.subtotal, 0).toLocaleString()}
              </div>
              <button onClick={saveSale} className={buttonClass}>
                <Plus className="w-4 h-4 inline-block mr-1" /> Simpan Transaksi
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold mb-4 text-sm sm:text-base">
          Riwayat Transaksi
        </h2>
        {sales.length === 0 ? (
          <p className="text-gray-500 text-center text-sm sm:text-base">
            Belum ada transaksi
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {sales.map((s) => (
              <div key={s.id} className="bg-white rounded-xl shadow p-4">
                <p className="text-gray-700 mb-2 text-sm sm:text-base">
                  Customer:{" "}
                  {customers.find((c) => c.id === s.customerId)?.name ||
                    "Unknown"}
                </p>
                <div className="text-gray-700 mb-2 text-sm sm:text-base">
                  Items:
                  <ul className="list-disc pl-5">
                    {s.items?.map((item, index) => (
                      <li key={index}>
                        {item.name} x {item.qty} - Rp{" "}
                        {item.subtotal.toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="font-bold text-sm sm:text-base">
                  Total: Rp {s.total?.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
