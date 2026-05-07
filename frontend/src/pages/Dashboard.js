import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import "./Dashboard.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Dashboard({ toggleDarkMode }) {
  const navigate = useNavigate();
  const userName = localStorage.getItem("name") || "User";
  const role = localStorage.getItem("role");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/items`)
      .then(r => r.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const myItems = items.filter(i => i.owner === userName);
  const recentItems = items.slice(0, 4);
  const ecoItems = items.filter(i => i.ecoDelivery).length;
  const categories = [...new Set(items.map(i => i.category))];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <DashboardLayout toggleDarkMode={toggleDarkMode}>
      <div className="dash-page">

        {/* WELCOME HERO */}
        <div className="dash-hero">
          <div className="dash-hero-left">
            <h1>{greeting}, {userName} 👋</h1>
            <p>Welcome back to EcoDrop. Here's what's happening in your community today.</p>
            <div className="dash-hero-btns">
              <button className="dash-btn-primary" onClick={() => navigate("/items")}>
                Browse Items
              </button>
              <button className="dash-btn-secondary" onClick={() => navigate("/add-item")}>
                + Share an Item
              </button>
            </div>
          </div>
          <div className="dash-hero-icon">🌿</div>
        </div>

        {/* STATS GRID */}
        <div className="dash-stats">
          <div className="dash-stat-card green" onClick={() => navigate("/items")}>
            <div className="dash-stat-icon">📦</div>
            <div className="dash-stat-info">
              <span className="dash-stat-num">{loading ? "—" : items.length}</span>
              <span className="dash-stat-label">Total Items Available</span>
            </div>
          </div>
          <div className="dash-stat-card blue" onClick={() => navigate("/add-item")}>
            <div className="dash-stat-icon">🙋</div>
            <div className="dash-stat-info">
              <span className="dash-stat-num">{loading ? "—" : myItems.length}</span>
              <span className="dash-stat-label">Items You've Shared</span>
            </div>
          </div>
          <div className="dash-stat-card teal" onClick={() => navigate("/courier")}>
            <div className="dash-stat-icon">🚴</div>
            <div className="dash-stat-info">
              <span className="dash-stat-num">{loading ? "—" : ecoItems}</span>
              <span className="dash-stat-label">Eco-Delivery Available</span>
            </div>
          </div>
          <div className="dash-stat-card amber">
            <div className="dash-stat-icon">🏷️</div>
            <div className="dash-stat-info">
              <span className="dash-stat-num">{loading ? "—" : categories.length}</span>
              <span className="dash-stat-label">Categories Listed</span>
            </div>
          </div>
        </div>

        <div className="dash-bottom">

          {/* RECENT ITEMS */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2>🆕 Recently Added</h2>
              <button onClick={() => navigate("/items")}>View all →</button>
            </div>
            {loading ? (
              <div className="dash-loading"><div className="dash-spinner" /></div>
            ) : recentItems.length === 0 ? (
              <p className="dash-empty">No items yet. Be the first to share!</p>
            ) : (
              <div className="dash-recent-list">
                {recentItems.map(item => (
                  <div
                    className="dash-recent-item"
                    key={item._id}
                    onClick={() => navigate(`/items/${item._id}`)}
                  >
                    <div className="dash-recent-img">
                      {item.images && item.images[0]
                        ? <img src={item.images[0]} alt={item.title} />
                        : <span>📦</span>
                      }
                    </div>
                    <div className="dash-recent-info">
                      <strong>{item.title}</strong>
                      <span>{item.category} · {item.condition}</span>
                      <span>👤 {item.owner}</span>
                    </div>
                    {item.ecoDelivery && (
                      <span className="dash-eco-tag">🌿 Eco</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QUICK ACTIONS + ECO IMPACT */}
          <div className="dash-right-col">

            {/* QUICK ACTIONS */}
            <div className="dash-card">
              <h2>⚡ Quick Actions</h2>
              <div className="dash-actions">
                <button onClick={() => navigate("/items")}>🔍 Browse Items</button>
                <button onClick={() => navigate("/add-item")}>➕ Add Item</button>
                <button onClick={() => navigate("/messages")}>💬 Messages</button>
                <button onClick={() => navigate("/courier")}>🚴 Courier</button>
                {role === "admin" && (
                  <button onClick={() => navigate("/admin-dashboard")}>🛡️ Admin Panel</button>
                )}
              </div>
            </div>

            {/* ECO IMPACT */}
            <div className="dash-card eco-impact">
              <h2>🌍 Community Impact</h2>
              <div className="dash-impact-list">
                <div className="dash-impact-row">
                  <span>♻️ Items kept out of landfill</span>
                  <strong>{items.length}</strong>
                </div>
                <div className="dash-impact-row">
                  <span>🚴 Eco-delivery options</span>
                  <strong>{ecoItems}</strong>
                </div>
                <div className="dash-impact-row">
                  <span>👥 Active categories</span>
                  <strong>{categories.length}</strong>
                </div>
                <div className="dash-impact-row">
                  <span>🙋 Your contributions</span>
                  <strong>{myItems.length}</strong>
                </div>
              </div>
              <p className="dash-impact-note">
                🌱 Every item shared reduces waste and helps your community!
              </p>
            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default Dashboard;