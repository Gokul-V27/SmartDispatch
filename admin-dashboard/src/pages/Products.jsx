import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');

  const load = () => api.getProducts(search).then(d => d && setProducts(d));
  useEffect(() => { load(); }, [search]);

  const handleDelete = async (id) => {
    if (confirm('Deactivate this product?')) {
      await api.deleteProduct(id);
      load();
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        <Link to="/products/new" className="btn btn-primary">+ Add Product</Link>
      </div>

      <div style={{marginBottom:16}}>
        <input className="form-input" placeholder="Search by name or brand..." value={search}
          onChange={e => setSearch(e.target.value)} style={{maxWidth:400}} />
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Brand</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Color</th>
            <th>Weight</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td><div className="product-thumb">{getCategoryIcon(p.category)}</div></td>
              <td style={{fontWeight:600}}>{p.name}</td>
              <td className="text-muted">{p.brand}</td>
              <td className="mono text-xs" style={{color:'var(--blue)'}}>{p.sku}</td>
              <td><span className="badge badge-blue">{p.category}</span></td>
              <td>
                {p.color && (
                  <span style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{width:12,height:12,borderRadius:'50%',background:getColorHex(p.color),border:'1px solid var(--border-visible)'}}></span>
                    <span className="text-xs">{p.color}</span>
                  </span>
                )}
              </td>
              <td className="mono text-xs">{p.weightKg ? `${p.weightKg} kg` : '—'}</td>
              <td className="mono">₹{p.price || 0}</td>
              <td className="mono">{p.stockQty}</td>
              <td>
                <div style={{display:'flex',gap:6}}>
                  <Link to={`/products/${p.id}/edit`} className="btn btn-secondary" style={{padding:'4px 10px',fontSize:10}}>Edit</Link>
                  <button onClick={() => handleDelete(p.id)} className="btn btn-red" style={{padding:'4px 10px',fontSize:10}}>Del</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {products.length === 0 && (
        <div className="card" style={{textAlign:'center',padding:40}}>
          <p className="text-muted">No products found. <Link to="/products/new" style={{color:'var(--orange)'}}>Add your first product</Link></p>
        </div>
      )}
    </div>
  );
}

function getCategoryIcon(cat) {
  const icons = { Electronics: '💻', Clothing: '👕', Grocery: '🛒', Furniture: '🪑', Hardware: '🔧' };
  return icons[cat] || '📦';
}

function getColorHex(color) {
  const map = { Silver: '#C0C0C0', Black: '#333', White: '#EEE', Blue: '#3B82F6', Red: '#EF4444', Gold: '#D4AF37', Green: '#22C55E', Pink: '#EC4899' };
  return map[color] || '#888';
}
