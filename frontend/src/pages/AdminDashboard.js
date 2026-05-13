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

  // Orders & Courier state
  const [orders, setOrders] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [assignModal, setAssignModal] = useState(false);
  const [assignOrder, setAssignOrder] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [assignMsg, setAssignMsg] = useState("");

  useEffect(() => {
    if (role !== "admin") navigate("/dashboard");
  }, [role, navigate]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);

    const safeFetch = async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (e) {
        console.error(`Error fetching ${url}:`, e);
        return [];
      }
    };

    const [uData, iData, oData, cData] = await Promise.all([
      safeFetch(`${API}/admin/users`),
      safeFetch(`${API}/admin/items`),
      safeFetch(`${API}/admin/orders`),
      safeFetch(`${API}/admin/couriers`)
    ]);

    setUsers(uData);
    setItems(iData);
    setOrders(oData);
    setCouriers(cData);
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

  const handleRoleChange = async (userId, newRole) => {
    await fetch(`${API}/admin/users/${userId}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole })
    });
    fetchAll();
  };

  const handleAssignCourier = async () => {
    const courier = couriers.find(c => c.name === selectedCourier);
    if (!courier) return;
    await fetch(`${API}/orders/${assignOrder._id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courierId: courier._id,
        courierName: courier.name
      })
    });
    setAssignMsg("Courier assigned successfully!");
    fetchAll();
    setTimeout(() => setAssignModal(false), 1500);
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
          <div className="admin-stat-box green" onClick={() => setActiveTab("orders")}>
            <span className="admin-stat-icon">🛒</span>
            <span className="admin-stat-num">{orders.length}</span>
            <span className="admin-stat-label">Total Orders</span>
          </div>
          <div className="admin-stat-box teal">
            <span className="admin-stat-icon">🚴</span>
            <span className="admin-stat-num">{couriers.length}</span>
            <span className="admin-stat-label">Couriers</span>
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
          <button
            className={`admin-tab ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            🛒 Orders ({orders.length})
          </button>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /></div>
        ) : activeTab === "users" ? (

          /* ── USERS TABLE ── */
          <div className="admin-table-card">
            <div className="admin-search-wrap">
              <span>🔍</span>
              <input
                placeholder="Search users by name or email..."
                value={searchUsers}
                onChange={e => setSearchUsers(e.target.value)}
              />
              <span className="admin-count">{filteredUsers.length} results</span>
            </div>

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
                        {/* ROLE SELECT — changes user role instantly */}
                        <select
                          className="admin-role-select"
                          value={user.role || "user"}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        >
                          <option value="user">👤 User</option>
                          <option value="courier">🚴 Courier</option>
                          <option value="admin">🛡️ Admin</option>
                        </select>
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

        ) : activeTab === "items" ? (

          /* ── ITEMS TABLE ── */
          <div className="admin-table-card">
            <div className="admin-search-wrap">
              <span>🔍</span>
              <input
                placeholder="Search items by title or owner..."
                value={searchItems}
                onChange={e => setSearchItems(e.target.value)}
              />
              <span className="admin-count">{filteredItems.length} results</span>
            </div>

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

        ) : (

          /* ── ORDERS TABLE ── */
          <div className="admin-table-card">
            <div className="admin-search-wrap">
              <span>📋</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#333" }}>
                All Orders — {orders.length} total
              </span>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Ordered By</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Courier</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#888" }}>
                        No orders yet
                      </td>
                    </tr>
                  ) : orders.map(order => (
                    <tr key={order._id}>
                      <td><strong>{order.itemTitle}</strong></td>
                      <td>{order.requestedBy}</td>
                      <td>
                        <span className={`admin-role-badge ${order.deliveryType === "delivery" ? "user" : "driver"}`}>
                          {order.deliveryType === "delivery" ? "🚴 Delivery" : "🚶 Self-collect"}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-status-badge ${order.status === "Delivered" ? "available" : "taken"}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>{order.courierName || "—"}</td>
                      <td>
                        {order.address?.suburb
                          ? `${order.address.suburb}, ${order.address.state}`
                          : "—"
                        }
                      </td>
                      <td>
                        {order.deliveryType === "delivery" && order.status !== "Delivered" && (
                          <button
                            className="admin-reset-btn"
                            onClick={() => {
                              setAssignOrder(order);
                              setSelectedCourier("");
                              setAssignMsg("");
                              setAssignModal(true);
                            }}
                          >
                            🚴 Assign Courier
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── PASSWORD RESET MODAL ── */}
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

      {/* ── ASSIGN COURIER MODAL ── */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚴 Assign Courier</h2>
              <button className="modal-close" onClick={() => setAssignModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="admin-reset-user-info">
                <div className="admin-avatar large">📦</div>
                <div>
                  <strong>{assignOrder?.itemTitle}</strong>
                  <span>Ordered by: {assignOrder?.requestedBy}</span>
                  {assignOrder?.address?.suburb && (
                    <span>
                      📍 {assignOrder.address.streetNumber} {assignOrder.address.street},{" "}
                      {assignOrder.address.suburb} {assignOrder.address.state}{" "}
                      {assignOrder.address.postcode}
                    </span>
                  )}
                  {assignOrder?.phone && (
                    <span>📞 {assignOrder.phone}</span>
                  )}
                </div>
              </div>
              <label>Select Courier</label>
              {couriers.length === 0 ? (
                <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "8px" }}>
                  ⚠️ No couriers registered yet. Go to Users tab and change a user's role to Courier first.
                </p>
              ) : (
                <select
                  className="auth-select"
                  value={selectedCourier}
                  onChange={e => setSelectedCourier(e.target.value)}
                  style={{ marginTop: "8px" }}
                >
                  <option value="">Choose a courier...</option>
                  {couriers.map(c => (
                    <option key={c._id} value={c.name}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              )}
              {assignMsg && (
                <p className={`admin-reset-msg ${assignMsg.includes("success") ? "success" : "error"}`}>
                  {assignMsg}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => setAssignModal(false)}>
                Cancel
              </button>
              <button
                className="modal-submit"
                disabled={!selectedCourier}
                onClick={handleAssignCourier}
              >
                ✅ Assign Courier
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

export default AdminDashboard;