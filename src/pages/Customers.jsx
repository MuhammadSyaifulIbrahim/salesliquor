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
  <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-between hover:shadow-2xl transition">
    <h3 className="font-bold text-lg">{customer.name}</h3>
    <p className="text-gray-600">{customer.email}</p>
    <p className="text-gray-500">{customer.phone}</p>
    <div className="mt-4 flex space-x-2">
      <button
        onClick={() => onEdit(customer)}
        className="flex-1 flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded transition"
      >
        <Edit className="w-4 h-4 mr-1" /> Edit
      </button>
      <button
        onClick={() => onDelete(customer.id)}
        className="flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition"
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
    "flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const buttonClass =
    "flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition";

  return (
    <div className="p-6">
      <form
        onSubmit={saveCustomer}
        className="bg-white rounded-xl shadow p-6 flex flex-col sm:flex-row gap-4 items-center"
      >
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
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
          >
            Cancel
          </button>
        )}
      </form>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.length === 0 && (
          <p className="text-gray-500 col-span-full">Belum ada customer</p>
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
