'use client';

import { useEffect, useState, useRef } from 'react';
import { Camera, X, Upload, Trash2, Eye } from 'lucide-react';
import Sidebar from '@/components/UI/Sidebar';
import api from '@/utils/axiosInstance'; // Import your axios instance
import Navbar from '@/components/UI/Navbar';
import { useRouter } from 'next/navigation'; 

interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  sku?: string;
  barcode?: string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  category: Category | string;
  imageUrl?: string;
  imageKey?: string;
  createdAt: string;
}

// Import components
interface NavbarProps {}
interface SidebarProps {}



export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & pagination
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(5);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    costPrice: '',
    category: '',
    sku: '',
    barcode: '',
    stock: '',
    lowStockThreshold: '5',
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Image handling
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
    const router = useRouter(); 

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');   // ✅ redirect
    }
  }, [router]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);

      const res = await fetch(
        `https://cloudposbackchalana-hr2459ntd-chalana-prabhashwaras-projects.vercel.app/api/products?${params.toString()}`
      );
      const data = await res.json();
        console.log('Products with image URLs:', data);
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [search, selectedCategory]);

  // Pagination logic
  const totalPages = Math.ceil(products.length / limit);
  const paginatedProducts = products.slice((page - 1) * limit, page * limit);

  // Handle form input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Create or update product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formDataToSend = new FormData();
      
      // Append form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Append image if selected
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      // If editing and want to remove existing image without adding new one
      if (editingProduct && !selectedImage && !editingProduct.imageUrl) {
        formDataToSend.append('removeImage', 'true');
      }

      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct
        ? `https://cloudposbackchalana-hr2459ntd-chalana-prabhashwaras-projects.vercel.app/api/products/${editingProduct._id}`
        : 'https://cloudposbackchalana-hr2459ntd-chalana-prabhashwaras-projects.vercel.app/api/products';

      const res = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save product');
      }

      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setUploading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      costPrice: '',
      category: '',
      sku: '',
      barcode: '',
      stock: '',
      lowStockThreshold: '5',
    });
    setEditingProduct(null);
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Delete product
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`https://cloudposbackchalana-hr2459ntd-chalana-prabhashwaras-projects.vercel.app/api/products/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete product');
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to delete product');
    }
  };

  // Delete product image
  const handleDeleteImage = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      const res = await fetch(`https://cloudposbackchalana-hr2459ntd-chalana-prabhashwaras-projects.vercel.app/api/products/${productId}/image`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete image');
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to delete image');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">{/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Overview</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            New Product
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-lg w-64 bg-white dark:bg-gray-700 dark:text-white"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Products Table */}
        {loading ? (
          <p className="text-gray-700 dark:text-gray-300">Loading...</p>
        ) : paginatedProducts.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">No products found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <th className="py-3 px-4 text-left">Image</th>
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Price</th>
                  <th className="py-3 px-4 text-left">Stock</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <tr key={product._id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-3 px-4">
                      <div className="relative w-12 h-12">
                        {product.imageUrl ? (
                          <div className="relative">
                            <img
                             src={product.imageUrl.startsWith('http') ? product.imageUrl : `https://${product.imageUrl}`}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded cursor-pointer"
                              onClick={() => {
                                setViewingImage(product.imageUrl!);
                                setShowImageModal(true);
                              }}
                            />
                            <button
                              onClick={() => handleDeleteImage(product._id)}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                              title="Delete image"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                            <Camera className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.sku && (
                          <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {typeof product.category === 'string'
                        ? categories.find((c) => c._id === product.category)?.name || '-'
                        : product.category.name}
                    </td>
                    <td className="py-3 px-4">${product.price}</td>
                    <td className="py-3 px-4">
                      <span className={`${product.stock <= product.lowStockThreshold ? 'text-red-600' : 'text-green-600'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 space-x-2">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setFormData({
                            name: product.name,
                            description: product.description || '',
                            price: product.price.toString(),
                            costPrice: product.costPrice.toString(),
                            category: typeof product.category === 'string' ? product.category : product.category._id,
                            sku: product.sku || '',
                            barcode: product.barcode || '',
                            stock: product.stock.toString(),
                            lowStockThreshold: product.lowStockThreshold.toString(),
                          });
                          setShowModal(true);
                        }}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-gray-900 dark:text-white">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Modal for Create/Update */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                {editingProduct ? 'Edit Product' : 'New Product'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload Section */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <div className="text-center">
                    {imagePreview || (editingProduct?.imageUrl && !selectedImage) ? (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview || editingProduct?.imageUrl}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg mx-auto"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {imagePreview || editingProduct?.imageUrl ? 'Change Image' : 'Upload Image'}
                      </label>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300">Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300">Cost Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="costPrice"
                      value={formData.costPrice}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300">SKU</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300">Barcode</label>
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300">Stock</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300">Low Stock Threshold</label>
                    <input
                      type="number"
                      name="lowStockThreshold"
                      value={formData.lowStockThreshold}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {editingProduct ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingProduct ? 'Update' : 'Create'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Image View Modal */}
        {showImageModal && viewingImage && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
            <div className="relative max-w-4xl max-h-[90vh] p-4">
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setViewingImage(null);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={viewingImage}
                alt="Product"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}