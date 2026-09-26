import React, { createContext, useContext, useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import GreenRoom from './pages/GreenRoom.jsx';
import JudgePortal from './pages/JudgePortal.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import ProgramsAdmin from './pages/ProgramsAdmin.jsx';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('festival_user');
    return raw ? JSON.parse(raw) : null;
  });
  const login = (u) => {
    setUser(u);
    localStorage.setItem('festival_user', JSON.stringify(u));
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('festival_user');
  };
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user || user.role !== role) return <Navigate to="/login" replace />;
  return children;
}

function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <nav className="nav">
      <div className="nav-brand">🎪 Campus Festival Platform</div>
      <div className="nav-links">
        <Link to="/register">Student Registration</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        {user?.role === 'organizer' && <Link to="/green-room">Green Room</Link>}
        {user?.role === 'organizer' && <Link to="/admin/programs">Programs</Link>}
        {user?.role === 'judge' && <Link to="/judge">Judge Portal</Link>}
        {user ? (
          <button className="link-btn" onClick={() => { logout(); navigate('/login'); }}>
            Logout ({user.name})
          </button>
        ) : (
          <Link to="/login">Organizer / Judge Login</Link>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Nav />
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/green-room" element={<RequireRole role="organizer"><GreenRoom /></RequireRole>} />
          <Route path="/admin/programs" element={<RequireRole role="organizer"><ProgramsAdmin /></RequireRole>} />
          <Route path="/judge" element={<RequireRole role="judge"><JudgePortal /></RequireRole>} />
        </Routes>
      </main>
    </AuthProvider>
  );
}
