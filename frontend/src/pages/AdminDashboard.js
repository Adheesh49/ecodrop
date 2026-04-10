import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import "./AdminDashboard.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function AdminDashboard({ toggleDarkMode }) {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);

  // Redirect non-admins
  useEffect(() => {
    if (role !== "admin") navigate("/dashboard");
  }, [role, navigate]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [uRes, iRes] = await Promise.all([
        fetch(`${API}/admin/users`),
        fetch(`${API}/admin/items`)
      ]);
      const uData = await uRes.json();
      const iData = await iRes.json();
      setUsers(Array.isArray(uData) ? uData : []);
      setItems(Array.isArray(iData) ? iData : []);
    } catch (e) {
      console.error("Failed to fetch admin data:", e);
    }
    setLoading(false);
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    await fetch(`${API}/admin/users/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item permanently?")) return;
    await fetch(`${API}/admin/items/${id}`, { method: "DELETE" });
    fetchAll();
  };

  return (
    <DashboardLayout toggleDarkMode={toggleDarkMode}>
      <div className="admin-page">

        <div className="admin-header">
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-sub">Manage all users and items across EcoDrop</p>
        </div>

        {/* STATS */}
        <div className="admin-stats">
          <div className="admin-stat-box">
            <span className="admin-stat-num">{users.length}</span>
            <span className="admin-stat-label">Total Users</span>
          </div>
          <div className="admin-stat-box">
            <span className="admin-stat-num">{items.length}</span>
            <span className="admin-stat-label">Total Items</span>
          </div>
          <div className="admin-stat-box">
            <span className="admin-stat-num">
              {items.filter(i => i.status === "available").length}
            </span>
            <span className="admin-stat-label">Available Items</span>
          </div>
          <div className="admin-stat-box">
            <span className="admin-stat-num">
              {items.filter(i => i.ecoDelivery).length}
            </span>
            <span className="admin-stat-label">Eco-Delivery Items</span>
          </div>
        </div>

        {/* TABS */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            👤 Users ({users.length})
          </button>
          <button
            className={`admin-tab ${activeTab === "items" ? "active" : ""}`}
            onClick={() => setActiveTab("items")}
          >
            📦 Items ({items.length})
          </button>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /></div>
        ) : activeTab === "users" ? (

          // USERS TABLE
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || "—"}</td>
                    <td>
                      <span className={`admin-role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-delete-btn"
                        onClick={() => deleteUser(user._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        ) : (

          // ITEMS TABLE
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Condition</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Eco-Delivery</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item._id}>
                    <td>{item.title}</td>
                    <td>{item.category}</td>
                    <td>{item.condition}</td>
                    <td>{item.owner}</td>
                    <td>
                      <span className={`admin-status-badge ${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.ecoDelivery ? "✅ Yes" : "—"}</td>
                    <td>
                      <button
                        className="admin-delete-btn"
                        onClick={() => deleteItem(item._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        )}
      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;