'use client';

import { useState, useEffect, JSX } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/UI/Navbar';
import Sidebar from '@/components/UI/Sidebar';
import { Download, Calendar, Filter, Package, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

// Type definitions
interface OrderItem {
  product: {
    _id: string;
    name: string;
    category: {
      _id: string;
      name: string;
    };
  };
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  status: 'pending' | 'completed' | 'cancelled';
  customerName?: string;
  customerContact?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface SalesReport {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalItems: number;
    averageOrderValue: number;
  };
  orders: Order[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  category?: {
    _id: string;
    name: string;
  };
  sku?: string;
  barcode?: string;
  imageUrl?: string;
  cloudflareImageId?: string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InventoryReport {
  summary: {
    totalProducts: number;
    outOfStock: number;
    lowStock: number;
    inStock: number;
    totalInventoryValue: number;
  };
  products: Product[];
}

interface Category {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface SalesFilters {
  startDate: string;
  endDate: string;
}

interface InventoryFilters {
  category: string;
  lowStock: boolean;
}

interface StockStatus {
  status: string;
  color: string;
  icon: typeof XCircle | typeof AlertTriangle | typeof CheckCircle;
}

export default function ReportPage(): JSX.Element {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory'>('sales');
  const [loading, setLoading] = useState<boolean>(false);
  
  // Sales Report State
  const [salesData, setSalesData] = useState<SalesReport | null>(null);
  const [salesFilters, setSalesFilters] = useState<SalesFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // Inventory Report State
  const [inventoryData, setInventoryData] = useState<InventoryReport | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventoryFilters, setInventoryFilters] = useState<InventoryFilters>({
    category: '',
    lowStock: false
  });

  // Fetch categories for inventory filtering
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch reports when filters change
  useEffect(() => {
    if (activeTab === 'sales') {
      fetchSalesReport();
    }
  }, [salesFilters, activeTab]);

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventoryReport();
    }
  }, [inventoryFilters, activeTab]);

  const fetchCategories = async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:5000/api/reports/categories');
      if (response.ok) {
        const data: Category[] = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSalesReport = async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: salesFilters.startDate,
        endDate: salesFilters.endDate
      });
      const response = await fetch(`http://localhost:5000/api/reports/sales?${params}`);
      
      if (response.ok) {
        const data: SalesReport = await response.json();
        setSalesData(data);
      }
    } catch (error) {
      console.error('Error fetching sales report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryReport = async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...inventoryFilters,
        lowStock: inventoryFilters.lowStock.toString()
      });
      const response = await fetch(`http://localhost:5000/api/reports/inventory?${params}`);
      
      if (response.ok) {
        const data: InventoryReport = await response.json();
        setInventoryData(data);
      }
    } catch (error) {
      console.error('Error fetching inventory report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (type: 'sales' | 'inventory'): Promise<void> => {
    try {
      let params: URLSearchParams;
      let endpoint: string;
      let filename: string;

      if (type === 'sales') {
        params = new URLSearchParams({ ...salesFilters, format: 'csv' });
        endpoint = 'http://localhost:5000/api/reports/sales';
        filename = `sales_report_${salesFilters.startDate}_to_${salesFilters.endDate}.csv`;
      } else {
        params = new URLSearchParams({
          ...inventoryFilters,
          lowStock: inventoryFilters.lowStock.toString(),
          format: 'csv'
        });
        endpoint = 'http://localhost:5000/api/reports/inventory';
        filename = 'inventory_report.csv';
      }

      const response = await fetch(`${endpoint}?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStockStatus = (stock: number, threshold: number): StockStatus => {
    if (stock === 0) return { status: 'Out of Stock', color: 'text-red-600', icon: XCircle };
    if (stock <= threshold) return { status: 'Low Stock', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'In Stock', color: 'text-green-600', icon: CheckCircle };
  };

  const handleSalesFilterChange = (field: keyof SalesFilters, value: string): void => {
    setSalesFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleInventoryFilterChange = (field: keyof InventoryFilters, value: string | boolean): void => {
    setInventoryFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reports Overview
            </h1>
            
            {/* Tab Toggle */}
            <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('sales')}
                className={`px-6 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  activeTab === 'sales'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Sales Report
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-6 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                  activeTab === 'inventory'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Inventory Report
              </button>
            </div>
          </div>

          {/* Sales Report Section */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              {/* Sales Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Start Date:
                    </label>
                    <input
                      type="date"
                      value={salesFilters.startDate}
                      onChange={(e) => handleSalesFilterChange('startDate', e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      End Date:
                    </label>
                    <input
                      type="date"
                      value={salesFilters.endDate}
                      onChange={(e) => handleSalesFilterChange('endDate', e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={() => downloadReport('sales')}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              {/* Sales Summary Cards */}
              {salesData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Total Revenue
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(salesData.summary.totalRevenue)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Total Orders
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {salesData.summary.totalOrders}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Total Items
                    </h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {salesData.summary.totalItems}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Avg Order Value
                    </h3>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(salesData.summary.averageOrderValue)}
                    </p>
                  </div>
                </div>
              )}

              {/* Sales Table */}
              {salesData && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Sales Transactions
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Order #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Payment
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {salesData.orders.map((order) => (
                          <tr key={order._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {order.orderNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {order.customerName || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {order.items.length} item(s)
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold">
                              {formatCurrency(order.total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                order.paymentMethod === 'cash' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                                order.paymentMethod === 'card' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                                'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                              }`}>
                                {order.paymentMethod}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inventory Report Section */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Inventory Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category:
                    </label>
                    <select
                      value={inventoryFilters.category}
                      onChange={(e) => handleInventoryFilterChange('category', e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="lowStock"
                      checked={inventoryFilters.lowStock}
                      onChange={(e) => handleInventoryFilterChange('lowStock', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="lowStock" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Low Stock Only
                    </label>
                  </div>
                  <button
                    onClick={() => downloadReport('inventory')}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              {/* Inventory Summary Cards */}
              {inventoryData && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Total Products
                    </h3>
                    <p className="text-xl font-bold text-blue-600">
                      {inventoryData.summary.totalProducts}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      In Stock
                    </h3>
                    <p className="text-xl font-bold text-green-600">
                      {inventoryData.summary.inStock}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Low Stock
                    </h3>
                    <p className="text-xl font-bold text-yellow-600">
                      {inventoryData.summary.lowStock}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Out of Stock
                    </p>
                    <p className="text-xl font-bold text-red-600">
                      {inventoryData.summary.outOfStock}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Total Value
                    </h3>
                    <p className="text-xl font-bold text-purple-600">
                      {formatCurrency(inventoryData.summary.totalInventoryValue)}
                    </p>
                  </div>
                </div>
              )}

              {/* Inventory Table */}
              {inventoryData && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Inventory Items
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Product Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            SKU
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Stock
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {inventoryData.products.map((product) => {
                          const stockInfo = getStockStatus(product.stock, product.lowStockThreshold);
                          const StatusIcon = stockInfo.icon;
                          return (
                            <tr key={product._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {product.category?.name || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {product.sku || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {product.stock}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {formatCurrency(product.price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`flex items-center ${stockInfo.color}`}>
                                  <StatusIcon className="w-4 h-4 mr-2" />
                                  <span className="text-sm font-medium">{stockInfo.status}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Empty States */}
          {!loading && activeTab === 'sales' && salesData && salesData.orders.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Sales Data
              </h3>
              <p className="text-gray-500 dark:text-gray-300">
                No sales found for the selected date range.
              </p>
            </div>
          )}

          {!loading && activeTab === 'inventory' && inventoryData && inventoryData.products.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Products Found
              </h3>
              <p className="text-gray-500 dark:text-gray-300">
                No products match the selected filters.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}