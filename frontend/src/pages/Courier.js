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

  return (
    <DashboardLayout toggleDarkMode={toggleDarkMode}>
      <div className="courier-page">

        <div className="courier-header">
          <h1 className="courier-title">🚴 Courier Dashboard</h1>
          <p className="courier-sub">
            Items available for eco-friendly delivery in your community
          </p>
        </div>

        {/* STATS */}
        <div className="courier-stats">
          <div className="courier-stat-box">
            <span className="courier-stat-num">{deliveryItems.length}</span>
            <span className="courier-stat-label">Available Deliveries</span>
          </div>
          <div className="courier-stat-box">
            <span className="courier-stat-num">{confirmedIds.length}</span>
            <span className="courier-stat-label">Confirmed by You</span>
          </div>
          <div className="courier-stat-box">
            <span className="courier-stat-num">
              {[...new Set(deliveryItems.map(i => i.category))].length}
            </span>
            <span className="courier-stat-label">Categories</span>
          </div>
        </div>

        {/* INFO BANNER */}
        <div className="courier-banner">
          <span>🌱</span>
          <p>
            These items are offered for free by community members.
            Contact the owner via Messages to arrange pickup and delivery.
            Every delivery helps reduce waste!
          </p>
        </div>

        {/* ITEMS */}
        {loading ? (
          <div className="courier-loading"><div className="courier-spinner" /></div>
        ) : deliveryItems.length === 0 ? (
          <div className="courier-empty">
            <span>📦</span>
            <p>No eco-delivery items available right now.</p>
            <p>Check back soon — new items are added daily!</p>
          </div>
        ) : (
          <div className="courier-grid">
            {deliveryItems.map(item => (
              <div className="courier-card" key={item._id}>
                {/* IMAGE */}
                <div className="courier-img">
                  {item.images && item.images[0]
                    ? <img src={item.images[0]} alt={item.title} />
                    : <div className="courier-img-placeholder">📦</div>
                  }
                  <span className="courier-eco-badge">🌿 Eco-Delivery</span>
                </div>

                {/* BODY */}
                <div className="courier-body">
                  <div className="courier-meta">
                    <span className="courier-category">{item.category}</span>
                    <span className={`courier-condition ${item.condition}`}>
                      {item.condition}
                    </span>
                  </div>

                  <h3 className="courier-item-title">{item.title}</h3>
                  <p className="courier-desc">{item.description}</p>

                  <div className="courier-info-row">
                    {item.location && (
                      <span className="courier-info">📍 {item.location}</span>
                    )}
                    <span className="courier-info">👤 {item.owner}</span>
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