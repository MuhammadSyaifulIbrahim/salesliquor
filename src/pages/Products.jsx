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

const ProductCard = ({ product, onEdit, onDelete }) => (
  <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-between hover:shadow-2xl transition w-full max-w-sm mx-auto">
    <h3 className="font-bold text-lg sm:text-xl truncate">{product.name}</h3>
    <p className="text-gray-600 text-sm sm:text-base">
      Rp {product.price.toLocaleString()}
    </p>
    <p className="text-gray-500 text-sm sm:text-base">Stock: {product.stock}</p>
    <div className="mt-4 flex space-x-2">
      <button
        onClick={() => onEdit(product)}
        className="flex-1 flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded text-sm sm:text-base transition"
      >
        Edit
      </button>
      <button
        onClick={() => onDelete(product.id)}
        className="flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm sm:text-base transition"
      >
        Hapus
      </button>
    </div>
  </div>
);

export default function DashboardProducts() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [editId, setEditId] = useState(null);

  const tenantId = "tenant_demo_1";
  const productsRef = collection(db, `tenants/${tenantId}/products`);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        setProducts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      },
      (error) => console.error(error)
    );
    return () => unsubscribe();
  }, []);

  const addProduct = async (e) => {
    e.preventDefault();
    if (!name || !price || !stock) return alert("Lengkapi data!");
    try {
      if (editId) {
        await updateDoc(doc(db, `tenants/${tenantId}/products`, editId), {
          name,
          price: Number(price),
          stock: Number(stock),
        });
        setEditId(null);
      } else {
        await addDoc(productsRef, {
          name,
          price: Number(price),
          stock: Number(stock),
          createdAt: serverTimestamp(),
        });
      }
      setName("");
      setPrice("");
      setStock("");
    } catch (error) {
      console.error(error);
    }
  };

  const removeProduct = async (id) => {
    if (window.confirm("Yakin ingin menghapus produk ini?")) {
      try {
        await deleteDoc(doc(db, `tenants/${tenantId}/products`, id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const editProduct = (p) => {
    setEditId(p.id);
    setName(p.name);
    setPrice(p.price);
    setStock(p.stock);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <form
        onSubmit={addProduct}
        className="bg-white rounded-xl shadow p-4 sm:p-6 flex flex-col gap-4 w-full max-w-3xl mx-auto"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded px-3 py-2 w-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border rounded px-3 py-2 w-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="border rounded px-3 py-2 w-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto text-sm sm:text-base transition"
        >
          {editId ? "Update" : "Add"}
        </button>
      </form>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {products.length === 0 && (
          <p className="text-gray-500 col-span-full text-center text-sm sm:text-base">
            Belum ada produk
          </p>
        )}
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onEdit={editProduct}
            onDelete={removeProduct}
          />
        ))}
      </div>
    </div>
  );
}
