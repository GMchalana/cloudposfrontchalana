'use client';

import { useState, useEffect, JSX } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/UI/Navbar';
import Sidebar from '@/components/UI/Sidebar';
import { useRouter } from 'next/navigation';   // ✅ Import router
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  AlertTriangle,
  Users,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Type definitions
interface SalesStats {
  totalRevenue: number;
  totalOrders: number;
  totalItems: number;
  averageOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
}

interface ProductStats {
  totalProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  inStockProducts: number;
  totalInventoryValue: number;
}

interface Category {
  _id: string;
  name: string;
  productCount: number;
  totalStock: number;
  totalValue: number;
}

interface DashboardOverview {
  sales: SalesStats;
  products: ProductStats;
  categories: Category[];
}

interface SalesChartData {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  _id: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  currentStock: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
  customerName?: string;
  createdAt: string;
  items: Array<{
    product: {
      name: string;
    };
    quantity: number;
  }>;
}

interface LowStockProduct {
  _id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  category?: {
    name: string;
  };
}

export default function DashboardPage(): JSX.Element {
  const { user } = useAuth();
  const router = useRouter(); 
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<string>('30');
  
  // Dashboard data state
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [salesChart, setSalesChart] = useState<SalesChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockProduct[]>([]);
  

useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');   // ✅ redirect
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async (): Promise<void> => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // Fetch all dashboard data in parallel
      const [overviewRes, salesChartRes, topProductsRes, recentOrdersRes, lowStockRes] = await Promise.all([
        fetch(`https://cloudposbackchalana-hr2459ntd-chalana-prabhashwaras-projects.vercel.app/api/dashboard/overview?period=${period}`),
        fetch(`https://cloudposbackchalana-hr2459ntd-chalana-prabhashwaras-projects.vercel.app/dashboard/sales-chart?period=7`), // Always show last 7 days for chart
        fetch('https://cloudposbackchalana-hr2459ntd-chalana-prabhashwaras-projects.vercel.app/api/dashboard/top-products?limit=5'),
        fetch('https://cloudposbackchalana-hr2459ntd-chalana-prabhashwaras-projects.vercel.app/api/dashboard/recent-orders?limit=5'),
        fetch('https://cloudposbackchalana-hr2459ntd-chalana-prabhashwaras-projects.vercel.app/api/dashboard/low-stock-alerts?limit=10')
      ]);

      if (overviewRes.ok) {
        const data: DashboardOverview = await overviewRes.json();
        setOverview(data);
      }

      if (salesChartRes.ok) {
        const data: SalesChartData[] = await salesChartRes.json();
        setSalesChart(data);
      }

      if (topProductsRes.ok) {
        const data: TopProduct[] = await topProductsRes.json();
        setTopProducts(data);
      }

      if (recentOrdersRes.ok) {
        const data: RecentOrder[] = await recentOrdersRes.json();
        setRecentOrders(data);
      }

      if (lowStockRes.ok) {
        const data: LowStockProduct[] = await lowStockRes.json();
        setLowStockAlerts(data);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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

  const formatChartDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getGrowthColor = (growth: number): string => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUpRight className="w-4 h-4" />;
    if (growth < 0) return <ArrowDownRight className="w-4 h-4" />;
    return null;
  };

  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Header with period selector */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard Overview
            </h1>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>

          {/* Key Metrics Cards */}
          {overview && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Revenue */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(overview.sales.totalRevenue)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-300" />
                  </div>
                </div>
                <div className={`flex items-center mt-2 ${getGrowthColor(overview.sales.revenueGrowth)}`}>
                  {getGrowthIcon(overview.sales.revenueGrowth)}
                  <span className="text-sm font-medium ml-1">
                    {Math.abs(overview.sales.revenueGrowth).toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {overview.sales.totalOrders.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full">
                    <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
                <div className={`flex items-center mt-2 ${getGrowthColor(overview.sales.ordersGrowth)}`}>
                  {getGrowthIcon(overview.sales.ordersGrowth)}
                  <span className="text-sm font-medium ml-1">
                    {Math.abs(overview.sales.ordersGrowth).toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
                </div>
              </div>

              {/* Total Products */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {overview.products.totalProducts}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-full">
                    <Package className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-red-600 font-medium">
                    {overview.products.outOfStockProducts} out of stock
                  </span>
                </div>
              </div>

              {/* Average Order Value */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Order Value</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(overview.sales.averageOrderValue)}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-full">
                    <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-300" />
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {overview.sales.totalItems} items sold
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sales Trend Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Sales Trend (Last 7 Days)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatChartDate}
                      stroke="#6B7280"
                    />
                    <YAxis stroke="#6B7280" />
                    <Tooltip 
                      formatter={(value : any, name : any) => [
                        name === 'revenue' ? formatCurrency(Number(value)) : value,
                        name === 'revenue' ? 'Revenue' : 'Orders'
                      ]}
                      labelFormatter={(date : any) => formatDate(date)}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Distribution */}
            {overview && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Products by Category
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overview.categories}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="productCount"
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                                `${name ?? ''} ${(percent ? percent * 100 : 0).toFixed(0)}%`
                            }
                      >
                        {overview.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Data Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Products */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Top Selling Products
                </h3>
              </div>
              <div className="p-6">
                {topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={product._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Stock: {product.currentStock}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.totalQuantity} sold
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatCurrency(product.totalRevenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No sales data available
                  </p>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Orders
                </h3>
              </div>
              <div className="p-6">
                {recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order._id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {order.customerName || 'Guest'} • {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(order.total)}
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.paymentMethod === 'cash' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                            order.paymentMethod === 'card' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                            'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                          }`}>
                            {order.paymentMethod}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No recent orders
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {lowStockAlerts.length > 0 && (
            <div className="mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Low Stock Alerts
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lowStockAlerts.slice(0, 6).map((product) => (
                      <div key={product._id} className="border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {product.name}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {product.category?.name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-yellow-700 dark:text-yellow-300">
                            Stock: {product.stock}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Threshold: {product.lowStockThreshold}
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((product.stock / product.lowStockThreshold) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {lowStockAlerts.length > 6 && (
                    <div className="mt-4 text-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        +{lowStockAlerts.length - 6} more products need attention
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Inventory Summary */}
          {overview && (
            <div className="mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Inventory Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {overview.products.inStockProducts}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">In Stock</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {overview.products.lowStockProducts}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Low Stock</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {overview.products.outOfStockProducts}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Out of Stock</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(overview.products.totalInventoryValue)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Value</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !overview && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Dashboard Data
              </h3>
              <p className="text-gray-500 dark:text-gray-300">
                Unable to load dashboard data at this time.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}