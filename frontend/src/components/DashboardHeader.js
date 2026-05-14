import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./dashboardHeader.css";

function DashboardHeader({ toggleDarkMode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const role = localStorage.getItem("role");
  const userName = localStorage.getItem("name") || "User";
  const profilePic = localStorage.getItem("profilePic");

  const getInitials = (name) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="dash-header">
      <div className="dash-left">
        <img
          src="/images/ecodrop-logo.png"
          alt="EcoDrop Logo"
          className="logo"
          onClick={() => navigate("/dashboard")}
        />

        <nav className="dash-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/items">Items</Link>
          <Link to="/add-item">Add Item</Link>
          <Link to="/messages">Messages</Link>
          <Link to="/my-orders">My Orders</Link>

          {/* COURIER — only visible to couriers */}
          {role === "courier" && (
            <Link to="/courier">🚴 Courier</Link>
          )}

          {/* ADMIN — only visible to admins */}
          {role === "admin" && (
            <Link to="/admin-dashboard">Admin</Link>
          )}
        </nav>
      </div>

      <div className="dash-right" ref={dropdownRef}>
        <div className="profile" onClick={() => setOpen(!open)}>
          {profilePic ? (
            <img src={profilePic} alt="profile" />
          ) : (
            <div className="initials">{getInitials(userName)}</div>
          )}
        </div>

        {open && (
          <div className="dropdown">
            <p onClick={() => navigate("/profile")}>Manage Profile</p>
            <p onClick={toggleDarkMode}>🌙 Dark Mode</p>
            <p onClick={handleLogout}>Logout</p>
          </div>
        )}
      </div>
    </header>
  );
}

export default DashboardHeader;