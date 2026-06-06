import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, PlusCircle, Download, X } from 'lucide-react';
import type { Product } from '../types';

interface ProductsPageProps {
  products: Product[];
  productSearch: string;
  setProductSearch: (s: string) => void;
  productCategory: string;
  setProductCategory: (c: string) => void;
  showAddProductModal: boolean;
  setShowAddProductModal: (b: boolean) => void;
  newProduct: Partial<Product>;
  setNewProduct: React.Dispatch<React.SetStateAction<Partial<Product>>>;
  handleCreateProduct: (e: React.FormEvent) => void;
  generateBarcodePdfSheet: (sku: string, name: string) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products,
  productSearch,
  setProductSearch,
  productCategory,
  setProductCategory,
  showAddProductModal,
  setShowAddProductModal,
  newProduct,
  setNewProduct,
  handleCreateProduct,
  generateBarcodePdfSheet
}) => {
  return (
    <motion.div
      key="products"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Search / Filters block */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search name, brand, SKU..."
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs placeholder-gray-500 text-white min-w-[200px] outline-none focus:border-[#F97316] transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-lg px-2.5">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={productCategory}
              onChange={e => setProductCategory(e.target.value)}
              className="bg-transparent border-0 py-2 text-xs text-gray-300 pointer-events-auto outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Hardware">Hardware</option>
              <option value="Furniture">Furniture</option>
              <option value="Clothing">Clothing</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowAddProductModal(true)}
          className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-xs font-bold font-mono flex items-center gap-2 tracking-wide transition duration-150 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Add Specification Item
        </button>
      </div>

      {/* Products Catalog Table Grid */}
      <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden mt-4">
        <div className="p-4 bg-gray-900/30 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <span className="text-xs text-gray-400 font-mono uppercase tracking-widest font-semibold">Active Optical Registry Specifications</span>
          <span className="text-[11px] text-[#F97316] font-mono">{products.length} Products listed</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/40 text-[10px] text-gray-400 font-mono uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">
                <th className="p-4">Visual asset</th>
                <th className="p-4">SKU / Model</th>
                <th className="p-4">Brand / Title</th>
                <th className="p-4">OCR Check String</th>
                <th className="p-4">Weight Spec</th>
                <th className="p-4">Sensor Color</th>
                <th className="p-4 text-right">Standard Rate</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-xs">
              {products
                .filter(p => {
                  const query = productSearch.toLowerCase();
                  const matchesSearch = p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query);
                  const matchesCat = productCategory === 'All' || p.category === productCategory;
                  return matchesSearch && matchesCat;
                })
                .map(p => (
                  <tr key={p.id} className="hover:bg-gray-800/25 transition-colors">
                    <td className="p-4">
                      <img
                        src={p.photos[0]}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-32 h-32 sm:w-40 sm:h-40 rounded-lg object-cover border-2 border-[rgba(255,255,255,0.12)] shadow-xl hover:scale-105 transition-transform duration-300"
                      />
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-gray-300 font-bold block">{p.sku}</span>
                      <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block mt-0.5">{p.category}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white font-bold block">{p.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{p.brand} · {p.modelNumber}</span>
                    </td>
                    <td className="p-4 font-mono font-semibold text-amber-500">
                      {p.sku} {p.brand} {p.modelNumber.substring(0, 5)}
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-gray-300 font-bold block">{p.weightKg.toFixed(2)} kg</span>
                      <span className="text-[9px] text-gray-500 font-mono block">±{p.weightToleranceGrams}g limits</span>
                    </td>
                    <td className="p-4">
                      <div 
                        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border w-max shadow-sm"
                        style={{ 
                          backgroundColor: `${p.colorHex}1A`, // 10% opacity
                          borderColor: `${p.colorHex}40` // 25% opacity
                        }}
                      >
                        <span 
                          className="w-5 h-5 rounded-full border-2 border-white/20 inline-block shrink-0" 
                          style={{ 
                            backgroundColor: p.colorHex, 
                            boxShadow: `0 0 12px ${p.colorHex}80` 
                          }} 
                        />
                        <span className="text-white font-bold font-mono tracking-wide drop-shadow-md">{p.colorName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono text-gray-300 font-bold">
                      ₹{p.priceRs.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => generateBarcodePdfSheet(p.sku, p.name)}
                        title="Download printable barcode tags"
                        className="px-2.5 py-1 text-[10px] font-bold font-mono rounded bg-gray-900 border border-gray-800 text-[#F97316] hover:bg-[#F97316] hover:text-white hover:border-[#F97316] transition duration-150 cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Barcode tags
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal Drawer Simulation */}
      <AnimatePresence>
        {showAddProductModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#111827] border border-[rgba(255,255,255,0.12)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative flex flex-col gap-6"
            >
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PlusCircle className="text-[#F97316] w-5 h-5" />
                  New Optical Verification Specification
                </h3>
                <p className="text-[11px] text-gray-400 mt-1">Specify correct labels, HEX colors and metric thresholds for OCR camera comparison.</p>
              </div>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition duration-150 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="flex flex-col gap-5">
              {/* Section A */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1">PRODUCT SPECIFICATION NAME *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dell Inspiron 15"
                    value={newProduct.name || ''}
                    onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-gray-600 outline-none focus:border-[#F97316] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1">BRAND TITLE *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dell / HP"
                    value={newProduct.brand || ''}
                    onChange={e => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-gray-600 outline-none focus:border-[#F97316] transition-colors"
                  />
                </div>
              </div>

              {/* Section B / C */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1">SKU BARCODE PATTERN *</label>
                  <input
                    type="text"
                    required
                    placeholder="SKU-XXXX-XXXX"
                    value={newProduct.sku || ''}
                    onChange={e => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-gray-600 font-mono outline-none focus:border-[#F97316] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1">MODEL NUMBER</label>
                  <input
                    type="text"
                    placeholder="e.g. IN3520-22"
                    value={newProduct.modelNumber || ''}
                    onChange={e => setNewProduct(prev => ({ ...prev, modelNumber: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder-gray-600 outline-none focus:border-[#F97316] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1">CATEGORY</label>
                  <select
                    value={newProduct.category || ''}
                    onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white outline-none focus:border-[#F97316] transition-colors"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Clothing">Clothing</option>
                  </select>
                </div>
              </div>

              {/* Weight Tolerances */}
              <div className="p-4 bg-gray-950/40 rounded-lg border border-[rgba(255,255,255,0.04)]">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider block mb-3 font-mono">Sensoring Metrics (RGB Camera + Weight Bounds)</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-400 font-mono block mb-1">COLOR NAME</label>
                    <input
                      type="text"
                      placeholder="e.g. Silver"
                      value={newProduct.colorName || ''}
                      onChange={e => setNewProduct(prev => ({ ...prev, colorName: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-mono block mb-1">HEX RGB SWATCH</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newProduct.colorHex || '#000000'}
                        onChange={e => setNewProduct(prev => ({ ...prev, colorHex: e.target.value }))}
                        className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={newProduct.colorHex || ''}
                        onChange={e => setNewProduct(prev => ({ ...prev, colorHex: e.target.value }))}
                        className="w-full px-2 py-1.5 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] text-white text-xs font-mono rounded"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-mono block mb-1">STANDARD MASS (KG)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="2.5"
                      value={newProduct.weightKg || ''}
                      onChange={e => setNewProduct(prev => ({ ...prev, weightKg: Number(e.target.value) }))}
                      className="w-full px-3 py-1.5 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded text-xs text-white text-right font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-mono block mb-1">TOLERANCE (GRAMS)</label>
                    <input
                      type="number"
                      placeholder="100"
                      value={newProduct.weightToleranceGrams || ''}
                      onChange={e => setNewProduct(prev => ({ ...prev, weightToleranceGrams: Number(e.target.value) }))}
                      className="w-full px-3 py-1.5 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded text-xs text-white text-right font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[#F97316] font-mono mt-3">
                  * Neural sensors cross-check physical packaging RGB values and force sensors against these specifications.
                </p>
              </div>

              {/* Pricing and Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1">STANDARD STOCK QUANTITY</label>
                  <input
                    type="number"
                    value={newProduct.stockQty || ''}
                    onChange={e => setNewProduct(prev => ({ ...prev, stockQty: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white text-right font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-mono font-bold block mb-1">PRICE IN INDIAN RUPEES (₹)</label>
                  <input
                    type="number"
                    value={newProduct.priceRs || ''}
                    onChange={e => setNewProduct(prev => ({ ...prev, priceRs: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-[#0A0F1A] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white text-right font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 whitespace-nowrap bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-xs font-bold font-mono tracking-wide transition duration-150 cursor-pointer"
                >
                  Save Specifications
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
