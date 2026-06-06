import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.getOrders().then(d => d && setOrders(d));
    api.getProducts().then(d => d && setProducts(d));
  }, []);

  const pending = orders.filter(o => o.status === 'PENDING').length;
  const packing = orders.filter(o => ['ASSIGNED','PACKING'].includes(o.status)).length;
  const packed = orders.filter(o => o.status === 'PACKED').length;
  const failed = orders.filter(o => o.status === 'CANCELLED').length;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <span className="live-dot">LIVE</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card orange">
          <div className="stat-value">{pending}</div>
          <div className="stat-label">Pending Orders</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-value">{packing}</div>
          <div className="stat-label">Packing Now</div>
        </div>
        <div className="stat-card teal">
          <div className="stat-value">{packed}</div>
          <div className="stat-label">Packed Today</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-value">{products.length}</div>
          <div className="stat-label">Products</div>
        </div>
      </div>

      {orders.length > 0 && (
        <>
          <h3 style={{marginBottom:12,fontSize:14}}>Recent Orders</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Status</th>
                <th>Packer</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0,10).map(o => (
                <tr key={o.id}>
                  <td className="mono" style={{fontWeight:600}}>{o.orderNumber}</td>
                  <td>{o.customerName}</td>
                  <td>{o.items?.length || 0} items</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="text-muted">{o.packerName || '—'}</td>
                  <td className="text-muted text-xs">{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {orders.length === 0 && (
        <div className="card" style={{textAlign:'center',padding:40}}>
          <p className="text-muted">No orders yet. Products are ready — waiting for customer orders.</p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING: 'badge-gray', ASSIGNED: 'badge-blue', PACKING: 'badge-orange',
    VERIFIED: 'badge-purple', PACKED: 'badge-teal', SHIPPED: 'badge-blue',
    IN_TRANSIT: 'badge-blue', DELIVERED: 'badge-teal', CANCELLED: 'badge-red'
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}
