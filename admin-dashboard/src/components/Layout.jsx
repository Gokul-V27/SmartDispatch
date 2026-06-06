import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Layout() {
  const navigate = useNavigate();
  const user = api.getUser();

  const handleLogout = () => {
    api.clearToken();
    navigate('/login');
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>SMART<span>DISPATCH</span></h1>
          <p>Admin Portal</p>
        </div>
        <nav className="nav-section">
          <NavLink to="/dashboard" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Dashboard
          </NavLink>
          <NavLink to="/products" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            Products
          </NavLink>
          <NavLink to="/orders" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            Orders
          </NavLink>
        </nav>
        <div style={{position:'absolute',bottom:16,left:0,right:0,padding:'0 20px'}}>
          <div className="text-xs text-muted mono" style={{marginBottom:8}}>{user?.name || 'Admin'}</div>
          <button onClick={handleLogout} className="btn btn-secondary btn-full" style={{fontSize:10}}>Logout</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </>
  );
}
