import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { Plus, Edit, Trash2 } from "lucide-react";

const CustomerCard = ({ customer, onEdit, onDelete }) => (
  <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-between hover:shadow-2xl transition w-full max-w-sm mx-auto">
    <h3 className="font-bold text-base sm:text-lg truncate">{customer.name}</h3>
    <p className="text-gray-600 text-sm sm:text-base break-all">
      {customer.email}
    </p>
    <p className="text-gray-500 text-sm sm:text-base">{customer.phone}</p>
    <div className="mt-4 flex space-x-2">
      <button
        onClick={() => onEdit(customer)}
        className="flex-1 flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded text-sm sm:text-base transition"
      >
        <Edit className="w-4 h-4 mr-1" /> Edit
      </button>
      <button
        onClick={() => onDelete(customer.id)}
        className="flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm sm:text-base transition"
      >
        <Trash2 className="w-4 h-4 mr-1" /> Hapus
      </button>
    </div>
  </div>
);

export default function DashboardCustomers() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [editId, setEditId] = useState(null);

  const tenantId = "tenant_demo_1";
  const customersRef = collection(db, `tenants/${tenantId}/customers`);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      customersRef,
      (snapshot) => {
        setCustomers(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      },
      (error) => console.error(error)
    );
    return () => unsubscribe();
  }, []);

  const saveCustomer = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone) return alert("Lengkapi data!");
    if (!/^\S+@\S+\.\S+$/.test(email)) return alert("Email tidak valid!");
    if (!/^\d+$/.test(phone)) return alert("Nomor telepon harus berupa angka!");

    try {
      if (editId) {
        await updateDoc(doc(db, `tenants/${tenantId}/customers`, editId), {
          name,
          email,
          phone,
        });
        setEditId(null);
      } else {
        await addDoc(customersRef, {
          name,
          email,
          phone,
          createdAt: serverTimestamp(),
        });
      }
      setName("");
      setEmail("");
      setPhone("");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan pelanggan. Coba lagi!");
    }
  };

  const removeCustomer = async (id) => {
    if (window.confirm("Yakin ingin menghapus pelanggan ini?")) {
      try {
        await deleteDoc(doc(db, `tenants/${tenantId}/customers`, id));
      } catch (error) {
        console.error(error);
        alert("Gagal menghapus pelanggan. Coba lagi!");
      }
    }
  };

  const editCustomer = (c) => {
    setEditId(c.id);
    setName(c.name);
    setEmail(c.email);
    setPhone(c.phone);
  };

  const inputClass =
    "flex-1 border rounded px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 w-full";
  const buttonClass =
    "flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm sm:text-base transition w-full sm:w-auto";
  const cancelButtonClass =
    "flex items-center justify-center bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm sm:text-base transition w-full sm:w-auto";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <form
        onSubmit={saveCustomer}
        className="bg-white rounded-xl shadow p-4 sm:p-6 flex flex-col gap-4 w-full max-w-3xl mx-auto"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Customer Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button type="submit" className={buttonClass}>
            <Plus className="w-5 h-5 mr-2" /> {editId ? "Update" : "Add"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setName("");
                setEmail("");
                setPhone("");
              }}
              className={cancelButtonClass}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {customers.length === 0 && (
          <p className="text-gray-500 col-span-full text-center text-sm sm:text-base">
            Belum ada customer
          </p>
        )}
        {customers.map((c) => (
          <CustomerCard
            key={c.id}
            customer={c}
            onEdit={editCustomer}
            onDelete={removeCustomer}
          />
        ))}
      </div>
    </div>
  );
}
