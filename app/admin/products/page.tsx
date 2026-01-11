'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { productService } from '@/lib/services/products';
import { importExportService } from '@/lib/services/import-export';
import { purchaseService } from '@/lib/services/purchases';
import { Product, PurchaseRecord } from '@/lib/types';

export default function ProductsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [showDeleteCatalogModal, setShowDeleteCatalogModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    subcategory: '',
    image_url: '',
  });
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedProductForPurchase, setSelectedProductForPurchase] = useState<string>('');
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [purchaseData, setPurchaseData] = useState({ quantity: '', purchasePrice: '' });
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState('');
  const [showPurchaseDropdown, setShowPurchaseDropdown] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      const [productsData, categoriesData, purchasesData] = await Promise.all([
        productService.getAll(),
        productService.getCategories(),
        purchaseService.getAllPurchases(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setPurchases(purchasesData);
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
    };

    fetchSubcategories();
  }, [selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category || undefined,
      subcategory: formData.subcategory || undefined,
      image_url: formData.image_url,
      stock: 0,
    };

    if (editingId) {
      const result = await productService.update(editingId, productData);
      if (result) {
        setProducts(products.map((p) => (p.id === editingId ? result : p)));
        setEditingId(null);
      }
    } else {
      const result = await productService.create(productData);
      if (result) {
        setProducts([...products, result]);
      }
    }

    setFormData({ name: '', description: '', price: '', category: '', subcategory: '', image_url: '' });
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category || '',
      subcategory: product.subcategory || '',
      image_url: product.image_url,
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      const success = await productService.delete(id);
      if (success) {
        setProducts(products.filter((p) => p.id !== id));
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '', price: '', category: '', subcategory: '', image_url: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleDeleteAllCatalog = async () => {
    const CORRECT_PASSWORD = 'laviudanegradebernal1994';

    if (deletePassword !== CORRECT_PASSWORD) {
      setDeleteMessage('Contraseña incorrecta');
      return;
    }

    try {
      let successCount = 0;
      for (const product of products) {
        const success = await productService.delete(product.id);
        if (success) successCount++;
      }

      setProducts([]);
      setCategories([]);
      setSubcategories([]);
      setDeletePassword('');
      setShowDeleteCatalogModal(false);
      setDeleteMessage('');
    } catch {
      setDeleteMessage('Error al eliminar el catálogo');
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMessage('');

    try {
      const importedProducts = await importExportService.importProductsFromExcel(file);

      if (importedProducts.length === 0) {
        setImportMessage('❌ El archivo está vacío');
        setImporting(false);
        return;
      }

      let successCount = 0;
      for (const product of importedProducts) {
        const result = await productService.create(product);
        if (result) successCount++;
      }

      const allProducts = await productService.getAll();
      setProducts(allProducts);

      setImportMessage(`${successCount} productos importados correctamente`);
      setTimeout(() => setImportMessage(''), 5000);
    } catch {
      setImportMessage('Error al importar el archivo');
    }

    setImporting(false);
    e.target.value = '';
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const allProducts = await productService.getAll();
      await importExportService.exportProductsToExcel(allProducts);
    } catch (error) {
      console.error('Error al exportar:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleAddPurchase = async () => {
    if (!selectedProductForPurchase || !purchaseData.quantity || !purchaseData.purchasePrice) {
      setPurchaseMessage('Por favor completa todos los campos');
      return;
    }

    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductForPurchase,
          quantity: parseInt(purchaseData.quantity),
          purchasePrice: parseFloat(purchaseData.purchasePrice),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPurchaseMessage(data.error || 'Error al registrar la compra');
        return;
      }

      setPurchases([data, ...purchases]);
      setSelectedProductForPurchase('');
      setPurchaseData({ quantity: '', purchasePrice: '' });
      setPurchaseSearchTerm('');
      setShowPurchaseModal(false);
      setPurchaseMessage('');
    } catch (err) {
      setPurchaseMessage(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const filteredProductsForPurchase = products.filter((product) =>
    product.name.toLowerCase().includes(purchaseSearchTerm.toLowerCase())
  );

  const getMarginColor = (product: Product): string => {
    const lastPurchase = purchases.find((p) => p.product_id === product.id);
    if (!lastPurchase) return 'bg-gray-50';

    const margin = ((product.price - lastPurchase.purchase_price) / lastPurchase.purchase_price) * 100;
    
    if (margin >= 300) return 'bg-green-50';
    if (margin < 100) return 'bg-yellow-50';
    return 'bg-gray-50';
  };

  const getMarginBadgeColor = (product: Product): string => {
    const lastPurchase = purchases.find((p) => p.product_id === product.id);
    if (!lastPurchase) return 'bg-gray-200 text-gray-700';

    const margin = ((product.price - lastPurchase.purchase_price) / lastPurchase.purchase_price) * 100;
    
    if (margin >= 300) return 'bg-green-200 text-green-800';
    if (margin < 100) return 'bg-yellow-200 text-yellow-800';
    return 'bg-gray-200 text-gray-700';
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
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col overflow-hidden">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6 lg:p-8 flex-1 flex flex-col overflow-hidden w-full">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Gestión de Productos</h1>
              <p className="text-gray-600 mt-1">Administra tu catálogo de productos ({filteredProducts.length} de {products.length})</p>
            </div>
            {!showForm && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleExportExcel}
                  disabled={exporting}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-shadow font-semibold text-sm disabled:opacity-50"
                >
                  {exporting ? '📊 Exportando...' : '📊 Exportar'}
                </button>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                    disabled={importing}
                    className="hidden"
                  />
                  <span className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-shadow font-semibold text-sm">
                    {importing ? '⏳ Importando...' : '📥 Importar'}
                  </span>
                </label>
                <button
                  onClick={() => {
                    setShowPurchaseModal(true);
                    setSelectedProductForPurchase('');
                    setPurchaseSearchTerm('');
                    setPurchaseData({ quantity: '', purchasePrice: '' });
                    setPurchaseMessage('');
                  }}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-shadow font-semibold text-sm"
                >
                  📦 Compra
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-shadow font-semibold text-sm"
                >
                  ➕ Producto
                </button>
                <button
                  onClick={() => {
                    setShowDeleteCatalogModal(true);
                    setDeletePassword('');
                    setDeleteMessage('');
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-shadow font-semibold text-sm"
                >
                  🗑️ Eliminar
                </button>
              </div>
            )}
          </div>

          {!showForm && (
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 border border-gray-200">
              <div>
                <input
                  type="text"
                  placeholder="🔍 Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm text-sm text-black"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Categoría</label>
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sub-Categoría</label>
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
          )}
        </div>

        {importMessage && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6 font-semibold">
            {importMessage}
          </div>
        )}

        {showDeleteCatalogModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar catalogo completo</h3>
              <p className="text-gray-600 mb-4">Ingresa la contraseña para confirmar</p>
              
              {deleteMessage && (
                <div className={`p-3 rounded-lg mb-4 text-sm font-semibold ${deleteMessage.includes('incorrecta') ? 'bg-red-50 text-red-700' : 'bg-red-50 text-red-700'}`}>
                  {deleteMessage}
                </div>
              )}
              
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Ingresa la contraseña"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 text-sm text-black"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleDeleteAllCatalog();
                  }
                }}
              />
              
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAllCatalog}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => {
                    setShowDeleteCatalogModal(false);
                    setDeletePassword('');
                    setDeleteMessage('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showPurchaseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">📦 Cargar Compra</h3>
                <button
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setSelectedProductForPurchase('');
                    setPurchaseSearchTerm('');
                    setPurchaseData({ quantity: '', purchasePrice: '' });
                    setPurchaseMessage('');
                  }}
                  className="text-gray-600 hover:text-gray-600 text-xl font-bold"
                >
                  ✕
                </button>
              </div>
              
              {purchaseMessage && (
                <div className={`p-3 rounded-lg mb-4 text-sm font-semibold border ${purchaseMessage.includes('Error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                  {purchaseMessage}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Producto</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Busca un producto..."
                      value={purchaseSearchTerm}
                      onChange={(e) => {
                        setPurchaseSearchTerm(e.target.value);
                        setShowPurchaseDropdown(true);
                      }}
                      onFocus={() => setShowPurchaseDropdown(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                    />
                    {showPurchaseDropdown && filteredProductsForPurchase.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                        {filteredProductsForPurchase.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => {
                              setSelectedProductForPurchase(product.id);
                              setPurchaseSearchTerm(product.name);
                              setShowPurchaseDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-purple-50 border-b border-gray-100 last:border-b-0 transition-colors text-black text-sm"
                          >
                            <div className="font-semibold text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-600">Venta: ${product.price.toFixed(2)}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedProductForPurchase && (
                    <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-xs font-semibold text-purple-700">Producto seleccionado</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">📊 Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={purchaseData.quantity}
                      onChange={(e) => setPurchaseData({ ...purchaseData, quantity: e.target.value })}
                      placeholder="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">💵 Precio Unit.</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={purchaseData.purchasePrice}
                      onChange={(e) => setPurchaseData({ ...purchaseData, purchasePrice: e.target.value })}
                      placeholder="25.50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black font-semibold"
                    />
                  </div>
                </div>

                {selectedProductForPurchase && purchaseData.purchasePrice && (
                  <div className="rounded-lg text-sm border-2">
                    {(() => {
                      const product = products.find((p) => p.id === selectedProductForPurchase);
                      const margin = product ? ((product.price - parseFloat(purchaseData.purchasePrice)) / parseFloat(purchaseData.purchasePrice)) * 100 : 0;
                      let borderColor = 'border-gray-300';
                      let bgColor = 'bg-gray-50';
                      let color = 'text-gray-700';
                      let badge = '📊';
                      
                      if (margin >= 300) {
                        borderColor = 'border-green-300';
                        bgColor = 'bg-green-50';
                        color = 'text-green-700';
                        badge = '🟢';
                      } else if (margin < 100) {
                        borderColor = 'border-yellow-300';
                        bgColor = 'bg-yellow-50';
                        color = 'text-yellow-700';
                        badge = '🟡';
                      } else {
                        borderColor = 'border-blue-300';
                        bgColor = 'bg-blue-50';
                        color = 'text-blue-700';
                        badge = '🔵';
                      }
                      
                      return (
                        <div className={`${bgColor} ${borderColor} p-3 rounded-lg border-2`}>
                          <p className="font-bold text-gray-900 mb-2">{badge} Margen: <span className={color}>{margin.toFixed(1)}%</span></p>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>💵 Compra: <span className="font-semibold">${parseFloat(purchaseData.purchasePrice).toFixed(2)}</span></p>
                            <p>🏷️ Venta: <span className="font-semibold text-orange-600">${product?.price.toFixed(2)}</span></p>
                            <p>💰 Ganancia: <span className="font-semibold">${(product ? product.price - parseFloat(purchaseData.purchasePrice) : 0).toFixed(2)} por unidad</span></p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddPurchase}
                  disabled={!selectedProductForPurchase || !purchaseData.quantity || !purchaseData.purchasePrice}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                >
                  ✓ Registrar
                </button>
                <button
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setSelectedProductForPurchase('');
                    setPurchaseSearchTerm('');
                    setPurchaseData({ quantity: '', purchasePrice: '' });
                    setPurchaseMessage('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded-lg font-semibold transition text-sm"
                >
                  ✕ Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-4 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm text-black"
                    placeholder="Ej: Laptop Gaming"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm text-black"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm text-black"
                  placeholder="Describe el producto..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Categoría</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm text-black"
                    placeholder="Ej: Computadoras"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sub-Categoría</label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm text-black"
                    placeholder="Ej: Laptops"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">URL de imagen</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm text-black"
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-shadow font-semibold text-sm"
                >
                  {editingId ? 'Guardar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-600 text-lg font-medium">{searchTerm || selectedCategory || selectedSubcategory ? 'No hay productos que coincidan' : 'No hay productos'}</p>
              <p className="text-gray-500 mt-2">{products.length === 0 ? 'Crea tu primer producto para comenzar' : 'Intenta con otros filtros'}</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Categoría</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Precio Venta</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Precio Compra</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ganancia</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const lastPurchase = purchases.find((p) => p.product_id === product.id);
                  const margin = lastPurchase ? ((product.price - lastPurchase.purchase_price) / lastPurchase.purchase_price) * 100 : null;
                  
                  return (
                    <tr key={product.id} className={`border-b border-gray-100 hover:opacity-80 transition-colors ${getMarginColor(product)}`}>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.category ? (
                          <div className="flex gap-2">
                            <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold">
                              {product.category}
                            </span>
                            {product.subcategory && (
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                                {product.subcategory}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600">Sin categoría</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="font-bold text-orange-600">${product.price.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {lastPurchase ? (
                          <span className="font-bold text-blue-600">${lastPurchase.purchase_price.toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-600 italic">Sin datos</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {margin !== null ? (
                          <span className={`font-bold px-2 py-1 rounded text-xs ${getMarginBadgeColor(product)}`}>
                            {margin.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-600 italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
