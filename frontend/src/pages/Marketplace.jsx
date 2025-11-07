import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { marketplaceAPI, authAPI } from '../services/api';
import { 
  ShoppingCart, Coins, BookOpen, Laptop, Package, 
  CheckCircle, AlertCircle, Loader2, Filter, Search 
} from 'lucide-react';

const Marketplace = () => {
  const { user, updateUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [message, setMessage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'course', label: 'Courses' },
    { value: 'book', label: 'Books' },
    { value: 'software', label: 'Software' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'subscription', label: 'Subscriptions' },
    { value: 'other', label: 'Other' }
  ];

  const categoryIcons = {
    course: BookOpen,
    book: BookOpen,
    software: Laptop,
    equipment: Package,
    subscription: Package,
    other: Package
  };

  useEffect(() => {
    if (user) {
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    filterProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, selectedCategory, searchQuery]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await marketplaceAPI.getAll({ studentId: user?.id });
      setProducts(response.data.data.products || []);
    } catch (error) {
      console.error('Load products error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to load products'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  };

  const handlePurchase = async (productId) => {
    if (!user || user.role !== 'student') {
      setMessage({
        type: 'error',
        text: 'Only students can purchase products'
      });
      return;
    }

    setPurchasing(productId);
    setMessage(null);

    try {
      const response = await marketplaceAPI.purchase({ productId });
      setMessage({
        type: 'success',
        text: 'Product purchased successfully!'
      });
      
      // Reload products to update purchase status
      await loadProducts();
      
      // Update user token balance in context
      if (response.data.data.remainingBalance !== undefined && updateUser) {
        try {
          const userRes = await authAPI.getCurrentUser();
          updateUser(userRes.data.data.user);
        } catch (error) {
          console.error('Failed to update user:', error);
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to purchase product'
      });
    } finally {
      setPurchasing(null);
    }
  };

  const getCategoryIcon = (category) => {
    const Icon = categoryIcons[category] || Package;
    return <Icon className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <ShoppingCart className="h-8 w-8 mr-3 text-primary-600" />
          Marketplace
        </h1>
        <p className="mt-2 text-gray-600">Browse and purchase educational products</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className={`card relative overflow-hidden transition-all hover:shadow-lg ${
                product.isPurchased ? 'opacity-75 border-2 border-green-500' : ''
              }`}
            >
              {product.isPurchased && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Purchased</span>
                </div>
              )}

              {/* Product Image */}
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center rounded-t-lg">
                  {getCategoryIcon(product.category)}
                </div>
              )}

              <div className="p-6">
                {/* Category Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium capitalize">
                    {product.category}
                  </span>
                  {product.course && (
                    <span className="text-xs text-gray-500">
                      {product.course.name}
                    </span>
                  )}
                </div>

                {/* Product Name */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {product.description}
                </p>

                {/* Price */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Price</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${product.price}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Token Price</p>
                    <div className="flex items-center space-x-1 text-primary-600">
                      <Coins className="h-5 w-5" />
                      <span className="text-lg font-semibold">{product.tokenPrice}</span>
                    </div>
                  </div>
                </div>

                {/* Stock */}
                {product.stock !== -1 && product.stock !== undefined && (
                  <p className="text-xs text-gray-500 mb-4">
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </p>
                )}

                {/* Purchase Button */}
                {user?.role === 'student' && (
                  <button
                    onClick={() => handlePurchase(product._id)}
                    disabled={product.isPurchased || purchasing === product._id || (product.stock !== -1 && product.stock <= 0) || ((user?.tokenBalance || 0) < product.tokenPrice)}
                    className={`w-full btn-primary flex items-center justify-center space-x-2 ${
                      product.isPurchased ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {purchasing === product._id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Purchasing...</span>
                      </>
                    ) : product.isPurchased ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Already Purchased</span>
                      </>
                    ) : (user?.tokenBalance || 0) < product.tokenPrice ? (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        <span>Insufficient Tokens</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        <span>Purchase</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchQuery || selectedCategory !== 'all' 
              ? 'No products found matching your filters'
              : 'No products available'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Marketplace;

