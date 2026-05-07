import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import "./Courier.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Courier({ toggleDarkMode }) {
  const navigate = useNavigate();
  const [deliveryItems, setDeliveryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmedIds, setConfirmedIds] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch(`${API}/items`)
      .then(r => r.json())
      .then(data => {
        const available = Array.isArray(data)
          ? data.filter(i => i.ecoDelivery && i.status === "available")
          : [];
        setDeliveryItems(available);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleConfirm = (id) => {
    setConfirmedIds(prev => [...prev, id]);
  };

  const filtered = deliveryItems.filter(item => {
    if (filter === "confirmed") return confirmedIds.includes(item._id);
    if (filter === "pending") return !confirmedIds.includes(item._id);
    return true;
  });

  const categories = [...new Set(deliveryItems.map(i => i.category))];

  return (
    <DashboardLayout toggleDarkMode={toggleDarkMode}>
      <div className="courier-page">

        {/* HERO BANNER */}
        <div className="courier-hero">
          <div className="courier-hero-text">
            <h1>🚴 Courier Dashboard</h1>
            <p>Help your community by delivering free items to those who need them</p>
          </div>
          <div className="courier-hero-stats">
            <div className="courier-hero-stat">
              <span>{deliveryItems.length}</span>
              <label>Available</label>
            </div>
            <div className="courier-hero-stat">
              <span>{confirmedIds.length}</span>
              <label>Confirmed</label>
            </div>
            <div className="courier-hero-stat">
              <span>{categories.length}</span>
              <label>Categories</label>
            </div>
          </div>
        </div>

        {/* ECO BANNER */}
        <div className="courier-eco-banner">
          <span>🌱</span>
          <div>
            <strong>Every delivery makes a difference!</strong>
            <p>Contact the item owner via Messages to arrange pickup. All items are completely free.</p>
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="courier-filter-tabs">
          {["all", "pending", "confirmed"].map(f => (
            <button
              key={f}
              className={`courier-filter-tab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "🚴 All Deliveries" : f === "pending" ? "⏳ Pending" : "✅ Confirmed"}
            </button>
          ))}
        </div>

        {/* ITEMS */}
        {loading ? (
          <div className="courier-loading"><div className="courier-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="courier-empty">
            <span>📦</span>
            <p>No items in this category right now.</p>
          </div>
        ) : (
          <div className="courier-grid">
            {filtered.map(item => (
              <div
                className={`courier-card ${confirmedIds.includes(item._id) ? "confirmed" : ""}`}
                key={item._id}
              >
                {/* CONFIRMED RIBBON */}
                {confirmedIds.includes(item._id) && (
                  <div className="courier-ribbon">✓ Confirmed</div>
                )}

                {/* IMAGE */}
                <div className="courier-img">
                  {item.images && item.images[0]
                    ? <img src={item.images[0]} alt={item.title} />
                    : <div className="courier-img-placeholder">📦</div>
                  }
                  <span className="courier-eco-badge">🌿 Eco</span>
                  <span className={`courier-condition-badge ${item.condition}`}>
                    {item.condition}
                  </span>
                </div>

                {/* BODY */}
                <div className="courier-body">
                  <span className="courier-cat-tag">{item.category}</span>
                  <h3 className="courier-item-title">{item.title}</h3>
                  <p className="courier-desc">{item.description}</p>

                  <div className="courier-details">
                    {item.location && (
                      <div className="courier-detail-row">
                        <span>📍</span>
                        <span>{item.location}</span>
                      </div>
                    )}
                    <div className="courier-detail-row">
                      <span>👤</span>
                      <span>{item.owner}</span>
                    </div>
                    {item.originalValue && (
                      <div className="courier-detail-row">
                        <span>💰</span>
                        <span>Original value: {item.originalValue}</span>
                      </div>
                    )}
                  </div>

                  <div className="courier-actions">
                    {confirmedIds.includes(item._id) ? (
                      <button className="courier-confirmed-btn" disabled>
                        ✓ Pickup Confirmed
                      </button>
                    ) : (
                      <button
                        className="courier-confirm-btn"
                        onClick={() => handleConfirm(item._id)}
                      >
                        ✅ Confirm Pickup
                      </button>
                    )}
                    <button
                      className="courier-msg-btn"
                      onClick={() => navigate(`/messages?to=${item.owner}`)}
                    >
                      💬 Contact Owner
                    </button>
                    <button
                      className="courier-view-btn"
                      onClick={() => navigate(`/items/${item._id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Courier;