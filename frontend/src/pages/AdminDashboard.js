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
  const [searchUsers, setSearchUsers] = useState("");
  const [searchItems, setSearchItems] = useState("");

  // Password reset modal state
  const [resetModal, setResetModal] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetting, setResetting] = useState(false);

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

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      return setResetMsg("Password must be at least 6 characters");
    }
    setResetting(true);
    try {
      const res = await fetch(`${API}/admin/users/${resetUser._id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();
      setResetMsg(data.message);
      setNewPassword("");
    } catch {
      setResetMsg("Failed to reset password. Try again.");
    }
    setResetting(false);
  };

  const openResetModal = (user) => {
    setResetUser(user);
    setNewPassword("");
    setResetMsg("");
    setResetModal(true);
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredItems = items.filter(i =>
    i.title?.toLowerCase().includes(searchItems.toLowerCase()) ||
    i.owner?.toLowerCase().includes(searchItems.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    totalItems: items.length,
    available: items.filter(i => i.status === "available").length,
    ecoDelivery: items.filter(i => i.ecoDelivery).length,
    admins: users.filter(u => u.role === "admin").length,
    taken: items.filter(i => i.status === "taken").length,
  };

  return (
    <DashboardLayout toggleDarkMode={toggleDarkMode}>
      <div className="admin-page">

        {/* HERO */}
        <div className="admin-hero">
          <div className="admin-hero-left">
            <h1>🛡️ Admin Dashboard</h1>
            <p>Full control over EcoDrop — manage users, items and platform activity</p>
          </div>
          <div className="admin-hero-badge">ADMIN</div>
        </div>

        {/* STATS */}
        <div className="admin-stats">
          <div className="admin-stat-box" onClick={() => setActiveTab("users")}>
            <span className="admin-stat-icon">👤</span>
            <span className="admin-stat-num">{stats.totalUsers}</span>
            <span className="admin-stat-label">Total Users</span>
          </div>
          <div className="admin-stat-box" onClick={() => setActiveTab("items")}>
            <span className="admin-stat-icon">📦</span>
            <span className="admin-stat-num">{stats.totalItems}</span>
            <span className="admin-stat-label">Total Items</span>
          </div>
          <div className="admin-stat-box green">
            <span className="admin-stat-icon">✅</span>
            <span className="admin-stat-num">{stats.available}</span>
            <span className="admin-stat-label">Available Items</span>
          </div>
          <div className="admin-stat-box teal">
            <span className="admin-stat-icon">🚴</span>
            <span className="admin-stat-num">{stats.ecoDelivery}</span>
            <span className="admin-stat-label">Eco-Delivery</span>
          </div>
          <div className="admin-stat-box amber">
            <span className="admin-stat-icon">🛡️</span>
            <span className="admin-stat-num">{stats.admins}</span>
            <span className="admin-stat-label">Admins</span>
          </div>
          <div className="admin-stat-box red">
            <span className="admin-stat-icon">📭</span>
            <span className="admin-stat-num">{stats.taken}</span>
            <span className="admin-stat-label">Items Taken</span>
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

          <div className="admin-table-card">
            {/* SEARCH */}
            <div className="admin-search-wrap">
              <span>🔍</span>
              <input
                placeholder="Search users by name or email..."
                value={searchUsers}
                onChange={e => setSearchUsers(e.target.value)}
              />
              <span className="admin-count">{filteredUsers.length} results</span>
            </div>

            {/* USERS TABLE */}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-avatar">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone || "—"}</td>
                      <td>
                        <span className={`admin-role-badge ${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <div className="admin-action-btns">
                          <button
                            className="admin-reset-btn"
                            onClick={() => openResetModal(user)}
                          >
                            🔑 Reset Password
                          </button>
                          <button
                            className="admin-delete-btn"
                            onClick={() => deleteUser(user._id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        ) : (

          <div className="admin-table-card">
            {/* SEARCH */}
            <div className="admin-search-wrap">
              <span>🔍</span>
              <input
                placeholder="Search items by title or owner..."
                value={searchItems}
                onChange={e => setSearchItems(e.target.value)}
              />
              <span className="admin-count">{filteredItems.length} results</span>
            </div>

            {/* ITEMS TABLE */}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Condition</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>Eco-Delivery</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item._id}>
                      <td>
                        <div className="admin-item-cell">
                          <div className="admin-item-thumb">
                            {item.images && item.images[0]
                              ? <img src={item.images[0]} alt={item.title} />
                              : <span>📦</span>
                            }
                          </div>
                          <span>{item.title}</span>
                        </div>
                      </td>
                      <td>{item.category}</td>
                      <td>
                        <span className={`admin-condition-badge ${item.condition}`}>
                          {item.condition}
                        </span>
                      </td>
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
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        )}
      </div>

      {/* PASSWORD RESET MODAL */}
      {resetModal && (
        <div className="modal-overlay" onClick={() => setResetModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔑 Reset Password</h2>
              <button className="modal-close" onClick={() => setResetModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="admin-reset-user-info">
                <div className="admin-avatar large">
                  {resetUser?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>{resetUser?.name}</strong>
                  <span>{resetUser?.email}</span>
                </div>
              </div>
              <label>New Password</label>
              <input
                type="password"
                className="admin-password-input"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleResetPassword(); }}
              />
              {resetMsg && (
                <p className={`admin-reset-msg ${resetMsg.includes("success") ? "success" : "error"}`}>
                  {resetMsg}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => setResetModal(false)}>
                Cancel
              </button>
              <button
                className="modal-submit"
                onClick={handleResetPassword}
                disabled={resetting}
              >
                {resetting ? "Resetting..." : "🔑 Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

export default AdminDashboard;