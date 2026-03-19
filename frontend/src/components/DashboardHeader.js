import { useState } from "react";
// EDIT: removed useEffect import — no longer needed here since dark mode is managed in App.js
import { useNavigate, Link } from "react-router-dom";
import "./dashboardHeader.css";

// EDIT: accept toggleDarkMode as a prop from Dashboard (which receives it from App.js)
function DashboardHeader({ toggleDarkMode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const role = localStorage.getItem("role");
  const userName = localStorage.getItem("name") || "User";
  const profilePic = localStorage.getItem("profilePic");

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // EDIT: removed local toggleDarkMode function — it was toggling body class independently
  // and conflicting with App.js state. Now handled globally via the prop.

  // EDIT: removed useEffect that re-applied dark-mode on mount — App.js handles this now.

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
          <Link to="/upload">Upload</Link>
          <Link to="/messages">Messages</Link>

          {role === "admin" && (
            <Link to="/admin-dashboard">Admin</Link>
          )}
        </nav>
      </div>

      <div className="dash-right">
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
            {/* EDIT: now calls the prop instead of the local function */}
            <p onClick={toggleDarkMode}>🌙 Dark Mode</p>
            <p onClick={handleLogout}>Logout</p>
          </div>
        )}
      </div>
    </header>
  );
}

export default DashboardHeader;