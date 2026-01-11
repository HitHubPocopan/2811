'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Cart } from '@/components/Cart';
import { useAuthStore, useCartStore } from '@/lib/store';
import { productService } from '@/lib/services/products';
import { salesService } from '@/lib/services/sales';
import { supabase } from '@/lib/supabase';
import { Product, Sale } from '@/lib/types';



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
  const [todayTotalCombined, setTodayTotalCombined] = useState(0);
  const [productSalesCount, setProductSalesCount] = useState<Record<string, number>>({});

  const getSalesCountByProduct = async () => {
    try {
      const { data: sales, error } = await supabase
        .from('sales')
        .select('items')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error || !sales) return;

      const counts: Record<string, number> = {};
      sales.forEach((sale: any) => {
        sale.items.forEach((item: any) => {
          if (!counts[item.product_id]) {
            counts[item.product_id] = 0;
          }
          counts[item.product_id] += item.quantity;
        });
      });

      setProductSalesCount(counts);
    } catch (error) {
      console.error('Error getting sales count:', error);
    }
  };

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
      getSalesCountByProduct();
      setLoading(false);
    };

    fetchData();
  }, [user, router]);

  useEffect(() => {
    const fetchTodayTotal = async () => {
      if (user && user.role === 'pos' && user.pos_number) {
        const total = await salesService.getTodaySalesTotal(user.pos_number);
        const combined = await salesService.getTodaySalesCombined();
        setTodayTotal(total);
        setTodayTotalCombined(combined);
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
      product_name: product.name,
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
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex flex-col overflow-hidden" style={{ WebkitFontSmoothing: 'antialiased', textRendering: 'optimizeLegibility' }}>
      <Navbar />
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden gap-4 xl:gap-6 p-3 sm:p-4 xl:p-8">
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg">
          <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-slate-50 dark:from-gray-700 dark:to-gray-800">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Catálogo de Productos</h1>
                <p className="text-gray-600 dark:text-gray-600">
                  Mostrando {filteredProducts.length} de {products.length} productos
                </p>
              </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 flex-1 transition-all hover:shadow-md">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Total Turno</p>
                <p className="text-2xl font-bold text-orange-500 tracking-tight">${todayTotal.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 flex-1 transition-all hover:shadow-md">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Total Redes</p>
                <p className="text-2xl font-bold text-blue-500 tracking-tight">${todayTotalCombined.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 shadow-sm mb-4 text-gray-900 text-sm transition-all placeholder-gray-300 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory('');
                }}
                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 shadow-sm text-xs font-bold text-gray-600 appearance-none transition-all"
              >
                <option value="">Todas ({categories.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Sub-Categoría</label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                disabled={!selectedCategory}
                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 shadow-sm text-xs font-bold text-gray-600 appearance-none disabled:opacity-30 transition-all"
              >
                <option value="">Todas ({subcategories.length})</option>
                {subcategories.map((subcat) => (
                  <option key={subcat} value={subcat}>
                    {subcat.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">Cargando Catálogo</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center grayscale opacity-30">
              <span className="text-5xl mb-4 block">📦</span>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                {searchTerm ? 'No hay coincidencias' : 'Inventario Vacío'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-100 scrollbar-track-transparent">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pb-4">
                {filteredProducts.map((product) => {
                  const count = productSalesCount[product.id] || 0;
                  let badgeColor = 'bg-blue-500';
                  if (count > 0 && count <= 5) badgeColor = 'bg-amber-500';
                  if (count > 5) badgeColor = 'bg-red-500';

                  return (
                    <div
                      key={product.id}
                      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all p-3 border border-gray-100 flex flex-col relative overflow-hidden"
                    >
                      <div className="absolute top-2 right-2 z-10">
                        <div className={`${badgeColor} text-white rounded-full min-w-[24px] h-[24px] px-1.5 flex items-center justify-center text-[10px] font-bold shadow-lg border-2 border-white`}>
                          {count}
                        </div>
                      </div>
                      {product.image_url && (
                        <div className="relative h-28 w-full mb-3 overflow-hidden rounded-xl bg-gray-50">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22150%22%20height%3D%22150%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20150%20150%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22150%22%20height%3D%22150%22%20fill%3D%22%23f9fafb%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20fill%3D%22%23e5e7eb%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ESin%20Imagen%3C%2Ftext%3E%3C%2Fsvg%3E';
                            }}
                          />
                        </div>
                      )}
                      <h3 className="font-bold text-[11px] text-gray-900 mb-2 line-clamp-2 uppercase tracking-tight h-8 leading-tight" style={{ textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased' }}>{product.name}</h3>
                      
                      <div className="flex flex-wrap gap-1 mb-3 flex-grow">
                        {product.category && (
                          <span className="text-[8px] font-bold bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full uppercase tracking-wider border border-orange-100">
                            {product.category}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-50">
                        <span className="text-sm font-bold text-gray-900 tracking-tight">
                          ${product.price.toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="bg-orange-500 text-white p-2 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/10 active:scale-95"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="w-full xl:w-96 flex flex-col gap-4 overflow-hidden bg-white/50 p-4 xl:p-0">
        <div className="flex-1 min-h-0">
          <Cart products={products} />
        </div>
        <button
          onClick={handleCheckout}
          className="flex-shrink-0 w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-[0.2em] hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/20 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/10"
        >
          Finalizar Venta
        </button>
      </div>
      </div>
    </div>
  );
}
