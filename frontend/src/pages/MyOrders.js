import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import "./MyOrders.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const STATUS_STEPS = [
  "Order Placed",
  "Courier Assigned",
  "Out for Pickup",
  "Picked Up",
  "Out for Delivery",
  "Delivered"
];

function MyOrders({ toggleDarkMode }) {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("name");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    fetch(`${API}/orders/user/${currentUser}`)
      .then(r => r.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentUser]);

  const getStepIndex = (status) => STATUS_STEPS.indexOf(status);

  const formatTime = (ts) => {
    if (!ts) return "";
    return new Date(ts).toLocaleString([], {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <DashboardLayout toggleDarkMode={toggleDarkMode}>
      <div className="myorders-page">

        <div className="myorders-header">
          <button className="myorders-back" onClick={() => navigate("/items")}>
            ← Back
          </button>
          <div>
            <h1>📦 My Orders</h1>
            <p>Track all your orders in real time</p>
          </div>
        </div>

        {loading ? (
          <div className="myorders-loading"><div className="myorders-spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="myorders-empty">
            <span>📦</span>
            <p>You haven't placed any orders yet.</p>
            <button className="myorders-browse-btn" onClick={() => navigate("/items")}>
              Browse Items
            </button>
          </div>
        ) : (
          <div className="myorders-layout">

            {/* ORDER LIST */}
            <div className="myorders-list">
              {orders.map(order => (
                <div
                  key={order._id}
                  className={`myorder-card ${activeOrder?._id === order._id ? "active" : ""}`}
                  onClick={() => setActiveOrder(order)}
                >
                  <div className="myorder-card-top">
                    <div>
                      <strong>{order.itemTitle}</strong>
                      <span>
                        {order.deliveryType === "delivery" ? "🚴 Home Delivery" : "🚶 Self Collection"}
                      </span>
                    </div>
                    <span className={`myorder-status-badge ${order.status === "Delivered" ? "delivered" : order.deliveryType === "self-collect" ? "selfcollect" : "active"}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="myorder-card-bottom">
                    <span>👤 Owner: {order.itemOwner}</span>
                    {order.courierName && <span>🚴 Courier: {order.courierName}</span>}
                    <span>🕐 {formatTime(order.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* ORDER DETAIL / TRACKER */}
            {activeOrder && (
              <div className="myorder-detail">
                <h2>Order Details</h2>

                <div className="myorder-info-card">
                  <div className="myorder-info-row">
                    <span>Item</span>
                    <strong>{activeOrder.itemTitle}</strong>
                  </div>
                  <div className="myorder-info-row">
                    <span>Owner</span>
                    <strong>{activeOrder.itemOwner}</strong>
                  </div>
                  <div className="myorder-info-row">
                    <span>Type</span>
                    <strong>
                      {activeOrder.deliveryType === "delivery" ? "🚴 Home Delivery" : "🚶 Self Collection"}
                    </strong>
                  </div>
                  {activeOrder.courierName && (
                    <div className="myorder-info-row">
                      <span>Courier</span>
                      <strong>{activeOrder.courierName}</strong>
                    </div>
                  )}
                  {activeOrder.deliveryType === "delivery" && activeOrder.address && (
                    <div className="myorder-info-row">
                      <span>Address</span>
                      <strong>
                        {activeOrder.address.streetNumber} {activeOrder.address.street},{" "}
                        {activeOrder.address.suburb} {activeOrder.address.state}{" "}
                        {activeOrder.address.postcode}
                      </strong>
                    </div>
                  )}
                </div>

                {/* TRACKER — only for delivery orders */}
                {activeOrder.deliveryType === "delivery" && (
                  <div className="myorder-tracker">
                    <h3>📍 Live Tracking</h3>
                    <div className="tracker-steps">
                      {STATUS_STEPS.map((step, index) => {
                        const currentIndex = getStepIndex(activeOrder.status);
                        const isDone = index <= currentIndex;
                        const isCurrent = index === currentIndex;
                        const historyEntry = activeOrder.statusHistory?.find(h => h.status === step);

                        return (
                          <div key={step} className="tracker-step">
                            <div className="tracker-left">
                              <div className={`tracker-dot ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`}>
                                {isDone ? "✓" : index + 1}
                              </div>
                              {index < STATUS_STEPS.length - 1 && (
                                <div className={`tracker-line ${isDone ? "done" : ""}`} />
                              )}
                            </div>
                            <div className="tracker-right">
                              <strong className={isDone ? "done" : ""}>{step}</strong>
                              {historyEntry && (
                                <span>{formatTime(historyEntry.time)}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SELF COLLECT INFO */}
                {activeOrder.deliveryType === "self-collect" && (
                  <div className="myorder-selfcollect">
                    <span>🚶</span>
                    <div>
                      <strong>Self Collection</strong>
                      <p>Contact <strong>{activeOrder.itemOwner}</strong> via Messages to arrange a pickup time and location.</p>
                      <button
                        className="myorder-msg-btn"
                        onClick={() => navigate(`/messages?to=${activeOrder.itemOwner}`)}
                      >
                        💬 Message Owner
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default MyOrders;