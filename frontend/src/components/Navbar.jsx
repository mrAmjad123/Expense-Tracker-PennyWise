import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <span className="navbar-logo">₹</span>
          <span>PennyWise</span>
        </NavLink>

        <nav className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            Dashboard
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
              Admin
            </NavLink>
          )}
          {user && (
            <NavLink to="/account" className={({ isActive }) => (isActive ? "active" : "")}>
              Account
            </NavLink>
          )}
        </nav>

        {user ? (
          <button type="button" className="btn btn-ghost navbar-cta" onClick={handleLogout}>
            Log Out
          </button>
        ) : (
          <NavLink to="/dashboard" className="btn btn-primary navbar-cta">
            Get Started
          </NavLink>
        )}
      </div>
    </header>
  );
}
