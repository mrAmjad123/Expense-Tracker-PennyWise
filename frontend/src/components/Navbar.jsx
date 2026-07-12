import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate("/");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="navbar-logo">₹</span>
          <span>PennyWise</span>
        </NavLink>

        <button
          type="button"
          className={`navbar-toggle ${menuOpen ? "open" : ""}`}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")} onClick={closeMenu}>
            Home
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")} onClick={closeMenu}>
            Dashboard
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")} onClick={closeMenu}>
              Admin
            </NavLink>
          )}
          {user && (
            <NavLink to="/account" className={({ isActive }) => (isActive ? "active" : "")} onClick={closeMenu}>
              Account
            </NavLink>
          )}

          {user ? (
            <button type="button" className="btn btn-ghost navbar-cta navbar-cta-mobile" onClick={handleLogout}>
              Log Out
            </button>
          ) : (
            <NavLink to="/dashboard" className="btn btn-primary navbar-cta navbar-cta-mobile" onClick={closeMenu}>
              Get Started
            </NavLink>
          )}
        </nav>

        {user ? (
          <button type="button" className="btn btn-ghost navbar-cta navbar-cta-desktop" onClick={handleLogout}>
            Log Out
          </button>
        ) : (
          <NavLink to="/dashboard" className="btn btn-primary navbar-cta navbar-cta-desktop">
            Get Started
          </NavLink>
        )}
      </div>
    </header>
  );
}
