import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');

  const load = () => api.getOrders(filter ? { status: filter } : {}).then(d => d && setOrders(d));
  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    await api.updateOrderStatus(id, status);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Orders</h1>
        <select className="form-select" style={{width:200}} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Orders</option>
          <option value="PENDING">Pending</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="PACKING">Packing</option>
          <option value="PACKED">Packed</option>
        </select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total (₹)</th>
            <th>Status</th>
            <th>Packer</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td className="mono" style={{fontWeight:600}}><Link to={`/orders/${o.id}`} style={{color:'var(--orange)'}}>{o.orderNumber}</Link></td>
              <td>{o.customerName}</td>
              <td>{o.items?.length || 0}</td>
              <td className="mono">{o.totalAmount}</td>
              <td><StatusBadge status={o.status} /></td>
              <td className="text-muted">{o.packerName || 'Unassigned'}</td>
              <td className="text-muted text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
              <td>
                <div style={{display:'flex',gap:6}}>
                  <Link to={`/orders/${o.id}`} className="btn btn-secondary" style={{padding:'4px 10px',fontSize:10}}>View</Link>
                  {o.status === 'PENDING' && <button onClick={() => updateStatus(o.id, 'ASSIGNED')} className="btn btn-primary" style={{padding:'4px 10px',fontSize:10}}>Assign</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {orders.length === 0 && (
        <div className="card" style={{textAlign:'center',padding:40}}>
          <p className="text-muted">No orders found for this status.</p>
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
