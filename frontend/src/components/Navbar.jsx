import { NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
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
        </nav>

        <NavLink to="/dashboard" className="btn btn-primary navbar-cta">
          Get Started
        </NavLink>
      </div>
    </header>
  );
}
