'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { productService } from '@/lib/services/products';
import { Product } from '@/lib/types';

export default function ProductsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchProducts = async () => {
      const data = await productService.getAll();
      setProducts(data);
      setLoading(false);
    };

    fetchProducts();
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      image_url: formData.image_url,
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

    setFormData({ name: '', description: '', price: '', stock: '', image_url: '' });
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
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
    setFormData({ name: '', description: '', price: '', stock: '', image_url: '' });
    setEditingId(null);
    setShowForm(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Gestión de Productos</h1>
            <p className="text-gray-600 mt-2">Administra tu catálogo de productos</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-shadow font-semibold"
            >
              + Nuevo producto
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-md p-6 lg:p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                    placeholder="Ej: Laptop Gaming"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                  placeholder="Describe el producto..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">URL de imagen</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-shadow font-semibold"
                >
                  {editingId ? 'Guardar cambios' : 'Crear producto'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg font-medium">📦 No hay productos</p>
            <p className="text-gray-500 mt-2">Crea tu primer producto para comenzar</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Descripción</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Precio</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 truncate">{product.description}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-bold text-orange-600">${product.price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${product.stock > 10 ? 'bg-green-100 text-green-800' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {product.stock}
                      </span>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
