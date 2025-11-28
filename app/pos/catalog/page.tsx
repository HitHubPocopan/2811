'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Cart } from '@/components/Cart';
import { useAuthStore, useCartStore } from '@/lib/store';
import { productService } from '@/lib/services/products';
import { Product } from '@/lib/types';

const PRODUCTS_PER_PAGE = 12;

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
  const [currentPage, setCurrentPage] = useState(1);

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
    const fetchSubcategories = async () => {
      if (selectedCategory) {
        const subcats = await productService.getSubcategories(selectedCategory);
        setSubcategories(subcats);
        setSelectedSubcategory('');
      } else {
        setSubcategories([]);
      }
      setCurrentPage(1);
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

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIdx, startIdx + PRODUCTS_PER_PAGE);

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex-1 flex overflow-hidden gap-6 p-6 lg:p-8">
        <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl shadow-lg">
          <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-slate-50">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Catálogo de Productos</h1>
            <p className="text-gray-600 mb-4">
              Mostrando {filteredProducts.length} de {products.length} productos
            </p>
            
            <input
              type="text"
              placeholder="🔍 Buscar productos..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm mb-4"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory('');
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm"
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
                  onChange={(e) => {
                    setSelectedSubcategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={!selectedCategory}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {paginatedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-1 p-4 border border-gray-100"
                    >
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">{product.name}</h3>
                      
                      {(product.category || product.subcategory) && (
                        <div className="mb-2">
                          <div className="flex gap-2 flex-wrap">
                            {product.category && (
                              <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold">
                                {product.category}
                              </span>
                            )}
                            {product.subcategory && (
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                                {product.subcategory}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-2xl font-bold text-orange-600">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {product.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex-shrink-0 border-t border-gray-200 p-4 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-50 to-slate-50">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    ← Anterior
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-semibold transition ${
                          currentPage === page
                            ? 'bg-orange-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    Siguiente →
                  </button>

                  <span className="ml-4 text-sm text-gray-600 font-semibold">
                    Página {currentPage} de {totalPages}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="w-96 flex flex-col gap-4">
          <Cart products={products} />
          <button
            onClick={handleCheckout}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition shadow-md"
          >
            ✓ Finalizar venta
          </button>
        </div>
      </div>
    </div>
  );
}
