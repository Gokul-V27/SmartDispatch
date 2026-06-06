import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('admin@smartdispatch.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.login(email, password);
      if (data?.token) {
        api.setToken(data.token);
        api.setUser(data.user);
        navigate('/dashboard');
      } else {
        setError(data?.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <div style={{fontSize:48,marginBottom:12}}>📦</div>
          <h1>SMART<span>DISPATCH</span></h1>
          <p className="login-subtitle">Admin Portal</p>
        </div>
        {error && <div className="alert-banner red" style={{marginBottom:16}}>{error}</div>}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@smartdispatch.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <p className="text-xs text-muted mono" style={{textAlign:'center',marginTop:16}}>SmartDispatch v1.0</p>
      </form>
    </div>
  );
}
