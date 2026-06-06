import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [logs, setLogs] = useState([]);

  const load = () => {
    api.getOrder(id).then(d => d && setOrder(d));
    api.getVerificationLogs(id).then(d => d && setLogs(d));
  };
  
  useEffect(() => { load(); }, [id]);

  if (!order) return <div style={{padding:40}}>Loading...</div>;

  return (
    <div>
      <div className="page-header" style={{marginBottom:16}}>
        <div>
          <Link to="/orders" className="text-muted text-xs" style={{textDecoration:'none',marginBottom:8,display:'block'}}>← Back to Orders</Link>
          <h1 className="mono">{order.orderNumber}</h1>
        </div>
        <div>
          <span className={`badge ${order.status === 'PACKED' ? 'badge-teal' : order.status === 'PENDING' ? 'badge-gray' : 'badge-orange'}`} style={{fontSize:14,padding:'6px 12px'}}>
            {order.status}
          </span>
        </div>
      </div>

      <div className="form-row" style={{marginBottom:24}}>
        <div className="card">
          <h3 style={{marginBottom:12,fontSize:14,color:'var(--text-muted)'}}>Customer Info</h3>
          <p><strong>{order.customerName}</strong></p>
          <p className="text-muted text-xs" style={{marginTop:8}}>Customer ID: <span className="mono">{order.customerId}</span></p>
          {order.shippingAddress && order.shippingAddress !== '{}' && (
            <div className="text-sm" style={{marginTop:8}}>
              {JSON.parse(order.shippingAddress).street || 'No address provided'}
            </div>
          )}
        </div>
        <div className="card">
          <h3 style={{marginBottom:12,fontSize:14,color:'var(--text-muted)'}}>Dispatch Info</h3>
          <p>Assigned Packer: <strong>{order.packerName || 'Unassigned'}</strong></p>
          <p className="text-muted text-xs" style={{marginTop:8}}>Created: {new Date(order.createdAt).toLocaleString()}</p>
          <p className="text-muted text-xs" style={{marginTop:4}}>Packed: {order.packedAt ? new Date(order.packedAt).toLocaleString() : 'Pending'}</p>
          <p className="text-muted text-xs" style={{marginTop:4}}>Total: <strong className="mono text-primary">₹{order.totalAmount}</strong></p>
        </div>
      </div>

      <h3 style={{marginBottom:12}}>Items to Pack ({order.items?.length})</h3>
      <table className="data-table" style={{marginBottom:32}}>
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Qty</th>
            <th>OCR Text</th>
            <th>Vision</th>
            <th>Weight</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map(item => (
            <tr key={item.id}>
              <td>
                <div style={{fontWeight:600}}>{item.productName}</div>
                <div className="text-xs text-muted">{item.productBrand} • {item.productColor}</div>
              </td>
              <td className="mono text-xs">{item.productSku}</td>
              <td className="mono">{item.quantity}</td>
              <td>{item.ocrVerified ? <span className="badge badge-teal">PASS</span> : <span className="badge badge-gray">PENDING</span>}</td>
              <td>{item.visionVerified ? <span className="badge badge-teal">PASS</span> : <span className="badge badge-gray">PENDING</span>}</td>
              <td>{item.weightVerified ? <span className="badge badge-teal">PASS</span> : <span className="badge badge-gray">PENDING</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{marginBottom:12}}>Verification Audit Log</h3>
      {logs.length > 0 ? (
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Step</th>
                <th>Result</th>
                <th>Worker ID</th>
                <th>Mismatches</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="text-xs text-muted mono">{new Date(log.createdAt).toLocaleTimeString()}</td>
                  <td><span className="badge badge-blue">{log.step}</span></td>
                  <td>
                    {log.result === 'PASS' && <span className="badge badge-teal">PASS</span>}
                    {log.result === 'FAIL' && <span className="badge badge-red">FAIL</span>}
                    {log.result === 'WARN' && <span className="badge badge-amber">WARN</span>}
                  </td>
                  <td className="mono text-xs">{log.workerId}</td>
                  <td className="text-xs text-red mono">{log.mismatchFields || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted card text-center">No verification scans recorded yet.</p>
      )}
    </div>
  );
}
