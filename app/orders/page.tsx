'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/UI/Navbar';
import Sidebar from '@/components/UI/Sidebar';
import axios from 'axios';
import { FaPlus, FaTrash } from 'react-icons/fa';
import useSound from 'use-sound';
// import beepSound from '@/public/sounds/beep.mp3';

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  barcode: string;
}

interface OrderItem {
  product: Product;
  quantity: number;
  total: number;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

useEffect(() => {
    // This runs only in the browser
    audioRef.current = new Audio('/beep.mp3');
  }, []);

  const playBeep = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [orderItems, discount]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('https://cloudposbackchalana-hr2459ntd-chalana-prabhashwaras-projects.vercel.app/api/products'); // Your API endpoint
      setProducts(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const addProductToOrder = (product: Product) => {
    playBeep();
    const existing = orderItems.find(item => item.product._id === product._id);
    if (existing) {
      setOrderItems(prev =>
        prev.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.product.price }
            : item
        )
      );
    } else {
      setOrderItems(prev => [...prev, { product, quantity: 1, total: product.price }]);
    }
  };

  const removeItem = (productId: string) => {
    setOrderItems(prev => prev.filter(item => item.product._id !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setOrderItems(prev =>
      prev.map(item =>
        item.product._id === productId
          ? { ...item, quantity, total: quantity * item.product.price }
          : item
      )
    );
  };

  const calculateTotals = () => {
    const sub = orderItems.reduce((acc, item) => acc + item.total, 0);
    const taxAmount = sub * 0.07; // Example 7% tax
    const totalAmount = sub + taxAmount - discount;
    setSubtotal(sub);
    setTax(taxAmount);
    setTotal(totalAmount);
  };

  const handleCompleteOrder = async () => {
    try {
      const orderData = {
        items: orderItems.map(item => ({ product: item.product._id, quantity: item.quantity, price: item.product.price, total: item.total })),
        subtotal,
        tax,
        discount,
        total,
        paymentMethod: 'cash', // You can add a selection
        userId: 1

      };
      const res = await axios.post('https://cloudposbackchalana-hr2459ntd-chalana-prabhashwaras-projects.vercel.app/api/orders', orderData);
      alert('Order completed!');
      // Optionally open PDF
      window.open(`https://cloudposbackchalana-hr2459ntd-chalana-prabhashwaras-projects.vercel.app/api/orders/${res.data._id}/pdf`, '_blank');
      setOrderItems([]);
      setDiscount(0);
    } catch (error) {
      console.error(error);
      alert('Error completing order');
    }
  };

  const handleCancelOrder = () => {
    if (confirm('Are you sure you want to cancel the order?')) {
      setOrderItems([]);
      setDiscount(0);
    }
  };

  const filteredProducts = products.filter(p =>
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode === searchTerm) &&
    (categoryFilter ? p.category === categoryFilter : true)
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 flex flex-col md:flex-row gap-6">
          {/* Left - Product selection */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add Products</h1>
            <div className="flex gap-2 mb-4">
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan barcode or search"
                className="flex-1 border rounded px-2 py-1"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {/* <select
                className="border rounded px-2 py-1"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {[...new Set(products.map(p => p.category))].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select> */}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
              {filteredProducts.map(product => (
                <div key={product._id} className="border rounded p-2 flex flex-col justify-between">
                  <div>
                    <h2 className="font-semibold">{product.name}</h2>
                    <p>${product.price.toFixed(2)}</p>
                    <p>Stock: {product.stock}</p>
                  </div>
                  <button
                    className="mt-2 bg-blue-500 text-white px-2 py-1 rounded flex items-center justify-center gap-1 hover:bg-blue-600"
                    onClick={() => addProductToOrder(product)}
                  >
                    <FaPlus /> Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Order summary */}
          <div className="w-full md:w-1/3 bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {orderItems.map(item => (
                <div key={item.product._id} className="flex justify-between items-center border-b pb-1">
                  <div>
                    <p>{item.product.name}</p>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => handleQuantityChange(item.product._id, parseInt(e.target.value))}
                      className="w-16 border rounded px-1 py-0.5 mt-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <p>${item.total.toFixed(2)}</p>
                    <button onClick={() => removeItem(item.product._id)} className="text-red-500 hover:text-red-700">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t pt-2 space-y-1">
              <div className="flex justify-between"><span>Subtotal:</span> <span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax:</span> <span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={e => setDiscount(parseFloat(e.target.value))}
                  className="w-20 border rounded px-1 py-0.5"
                />
              </div>
              <div className="flex justify-between font-bold text-lg"><span>Total:</span> <span>${total.toFixed(2)}</span></div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={handleCompleteOrder}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Complete Order & Generate PDF
              </button>
              <button
                onClick={handleCancelOrder}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
