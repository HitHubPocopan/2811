'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Cart } from '@/components/Cart';
import { useAuthStore, useCartStore } from '@/lib/store';
import { productService } from '@/lib/services/products';
import { salesService } from '@/lib/services/sales';
import { Product } from '@/lib/types';



export default function CatalogPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'pos') {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      const [productsData, categoriesData] = await Promise.all([
        productService.getAll(),
        productService.getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setLoading(false);
    };

    fetchData();
  }, [user, router]);

  useEffect(() => {
    const fetchTodayTotal = async () => {
      if (user && user.role === 'pos' && user.pos_number) {
        const total = await salesService.getTodaySalesTotal(user.pos_number);
        setTodayTotal(total);
      }
    };

    fetchTodayTotal();
    const interval = setInterval(fetchTodayTotal, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (selectedCategory) {
        const subcats = await productService.getSubcategories(selectedCategory);
        setSubcategories(subcats);
        setSelectedSubcategory('');
      } else {
        setSubcategories([]);
      }
    };

    fetchSubcategories();
  }, [selectedCategory]);

  const handleAddToCart = (product: Product) => {
    addItem({
      product_id: product.id,
      quantity: 1,
      price: product.price,
    });
  };

  const handleCheckout = () => {
    router.push('/pos/checkout');
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || product.subcategory === selectedSubcategory;

    return matchesSearch && matchesCategory && matchesSubcategory;
  });



  if (!user) {
    return null;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col overflow-hidden" style={{ WebkitFontSmoothing: 'antialiased', textRendering: 'optimizeLegibility' }}>
      <Navbar />
      <div className="flex-1 flex overflow-hidden gap-6 p-6 lg:p-8">
        <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl shadow-lg">
          <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-slate-50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Catálogo de Productos</h1>
                <p className="text-gray-600">
                  Mostrando {filteredProducts.length} de {products.length} productos
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 border-2 border-orange-200 text-right">
                <p className="text-xs font-semibold text-gray-600 mb-1">VENDIDO HOY</p>
                <p className="text-2xl font-bold text-orange-600">${todayTotal.toFixed(2)}</p>
              </div>
            </div>
            
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm mb-4 text-black"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm text-black"
                >
                  <option value="">Todas ({categories.length})</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sub-Categoría</label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  disabled={!selectedCategory}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed text-black"
                >
                  <option value="">Todas ({subcategories.length})</option>
                  {subcategories.map((subcat) => (
                    <option key={subcat} value={subcat}>
                      {subcat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando productos...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-600 text-lg">
                  {searchTerm ? '❌ No hay productos que coincidan con tu búsqueda' : '📦 No hay productos disponibles'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow hover:shadow-md transition-all p-2 border border-gray-100 flex flex-col"
                    >
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                      )}
                      <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2" style={{ textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased' }}>{product.name}</h3>
                      
                      {(product.category || product.subcategory) && (
                        <div className="mb-1 flex-grow">
                          <div className="flex gap-1 flex-wrap">
                            {product.category && (
                              <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold" style={{ WebkitFontSmoothing: 'antialiased' }}>
                                {product.category}
                              </span>
                            )}
                            {product.subcategory && (
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold" style={{ WebkitFontSmoothing: 'antialiased' }}>
                                {product.subcategory}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold text-orange-600">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-1 px-2 rounded text-xs font-semibold transition"
                      >
                        Agregar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-96 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 min-h-0">
            <Cart products={products} />
          </div>
          <button
            onClick={handleCheckout}
            className="flex-shrink-0 w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition shadow-md"
          >
            ✓ Finalizar venta
          </button>
        </div>
      </div>
    </div>
  );
}
