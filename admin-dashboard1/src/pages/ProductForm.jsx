import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', brand: '', modelNumber: '', sku: '',
    category: 'Electronics', color: '', weightKg: '', weightToleranceG: 100,
    price: '', stockQty: 0, description: '', specs: ''
  });

  useEffect(() => {
    if (isEdit) {
      api.getProduct(id).then(data => {
        if (data) setForm({
          ...data,
          weightKg: data.weightKg || '',
          price: data.price || '',
          specs: data.specs || ''
        });
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Parse numeric fields safely
    const payload = {
      ...form,
      weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
      weightToleranceG: parseInt(form.weightToleranceG) || 100,
      price: form.price ? parseFloat(form.price) : null,
      stockQty: parseInt(form.stockQty) || 0
    };

    try {
      if (isEdit) {
        await api.updateProduct(id, payload);
      } else {
        await api.createProduct(payload);
      }
      navigate('/products');
    } catch (err) {
      alert('Error saving product');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
        <Link to="/products" className="btn btn-secondary">Cancel</Link>
      </div>

      <div className="alert-banner amber" style={{maxWidth:800}}>
        <strong>Crucial for Verification:</strong> Ensure SKU, Brand, Model Number, and Color exactly match the physical product labels and appearance. The OCR and AI vision systems will verify against these values!
      </div>

      <form onSubmit={handleSubmit} style={{maxWidth:800}}>
        <div className="card">
          <h3 style={{marginBottom:16, borderBottom:'1px solid var(--border-subtle)', paddingBottom:8}}>1. Basic Information (OCR Scan Target)</h3>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input className="form-input" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Dell Inspiron 15" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Brand *</label>
              <input className="form-input" name="brand" value={form.brand} onChange={handleChange} required placeholder="e.g. Dell" />
            </div>
            <div className="form-group">
              <label className="form-label">Model Number</label>
              <input className="form-input" name="modelNumber" value={form.modelNumber} onChange={handleChange} placeholder="e.g. IN3520-7890" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">SKU (Unique Identifier) *</label>
              <input className="form-input mono" name="sku" value={form.sku} onChange={handleChange} required placeholder="SKU-DELL-3520-SLV" />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" name="category" value={form.category} onChange={handleChange} required>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Grocery">Grocery</option>
                <option value="Furniture">Furniture</option>
                <option value="Hardware">Hardware</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card card-accent purple">
          <h3 style={{marginBottom:16, borderBottom:'1px solid var(--border-subtle)', paddingBottom:8}}>2. Vision & Weight Specifications</h3>
          <div className="form-group">
            <label className="form-label">Color (AI Vision Target)</label>
            <input className="form-input" name="color" value={form.color} onChange={handleChange} placeholder="e.g. Silver, Black, Red" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Weight in kg (Smart Scale Target)</label>
              <input className="form-input mono" type="number" step="0.001" name="weightKg" value={form.weightKg} onChange={handleChange} placeholder="e.g. 2.500" />
            </div>
            <div className="form-group">
              <label className="form-label">Tolerance in grams (±)</label>
              <input className="form-input mono" type="number" name="weightToleranceG" value={form.weightToleranceG} onChange={handleChange} placeholder="Default: 100" />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{marginBottom:16, borderBottom:'1px solid var(--border-subtle)', paddingBottom:8}}>3. Inventory & Description</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price (₹)</label>
              <input className="form-input mono" type="number" step="0.01" name="price" value={form.price} onChange={handleChange} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Stock Quantity</label>
              <input className="form-input mono" type="number" name="stockQty" value={form.stockQty} onChange={handleChange} placeholder="0" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Hardware Specs (JSON / Text)</label>
            <textarea className="form-textarea mono" name="specs" value={form.specs} onChange={handleChange} placeholder='{"ram":"16GB", "storage":"512GB"}'></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange}></textarea>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{padding:'12px 30px', fontSize:14}} disabled={loading}>
          {loading ? 'Saving...' : 'Save Product'}
        </button>
      </form>
    </div>
  );
}
