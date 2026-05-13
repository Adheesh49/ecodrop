import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import "./Courier.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const STATUS_FLOW = [
  "Courier Assigned",
  "Out for Pickup",
  "Picked Up",
  "Out for Delivery",
  "Delivered"
];

function Courier({ toggleDarkMode }) {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("name");
  const role = localStorage.getItem("role");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("available");
  const [updating, setUpdating] = useState(null);

  // Redirect non-couriers
  useEffect(() => {
    if (role !== "courier" && role !== "admin") {
      navigate("/dashboard");
    }
  }, [role, navigate]);

  const fetchOrders = () => {
    setLoading(true);
    fetch(`${API}/orders`)
      .then(r => r.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data.filter(o => o.deliveryType === "delivery") : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const availableOrders = orders.filter(o => !o.courierId);
  const myOrders = orders.filter(o => o.courierName === currentUser && o.status !== "Delivered");
  const completedOrders = orders.filter(o => o.courierName === currentUser && o.status === "Delivered");

  const handleClaim = async (orderId) => {
    await fetch(`${API}/orders/${orderId}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courierId: currentUser,
        courierName: currentUser
      })
    });
    fetchOrders();
  };

  const handleNextStatus = async (order) => {
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) return;

    const nextStatus = STATUS_FLOW[currentIndex + 1];
    setUpdating(order._id);
    await fetch(`${API}/orders/${order._id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    setUpdating(null);
    fetchOrders();
  };

  const getNextStatus = (status) => {
    const i = STATUS_FLOW.indexOf(status);
    return i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    return new Date(ts).toLocaleString([], {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const OrderCard = ({ order, showClaim = false, showUpdate = false }) => (
    <div className="courier-order-card">
      <div className="courier-order-header">
        <div>
          <strong>{order.itemTitle}</strong>
          <span>Ordered by: {order.requestedBy}</span>
          <span>Owner: {order.itemOwner}</span>
        </div>
        <span className={`courier-order-status ${order.status === "Delivered" ? "delivered" : "active"}`}>
          {order.status}
        </span>
      </div>

      <div className="courier-order-address">
        <span>📍 Deliver to:</span>
        <strong>
          {order.address?.streetNumber} {order.address?.street},{" "}
          {order.address?.suburb} {order.address?.state} {order.address?.postcode}
        </strong>
        <span>📞 {order.phone}</span>
      </div>

      <div className="courier-order-meta">
        <span>🕐 {formatTime(order.createdAt)}</span>
        {order.courierName && <span>🚴 {order.courierName}</span>}
      </div>

      <div className="courier-order-actions">
        {showClaim && (
          <button
            className="courier-claim-btn"
            onClick={() => handleClaim(order._id)}
          >
            ✋ Claim This Order
          </button>
        )}
        {showUpdate && getNextStatus(order.status) && (
          <button
            className="courier-update-btn"
            onClick={() => handleNextStatus(order)}
            disabled={updating === order._id}
          >
            {updating === order._id
              ? "Updating..."
              : `→ Mark as: ${getNextStatus(order.status)}`
            }
          </button>
        )}
        <button
          className="courier-msg-btn"
          onClick={() => navigate(`/messages?to=${order.requestedBy}`)}
        >
          💬 Message Customer
        </button>
        <button
          className="courier-msg-btn"
          onClick={() => navigate(`/messages?to=${order.itemOwner}`)}
        >
          💬 Message Owner
        </button>
      </div>
    </div>
  );

  return (
    <DashboardLayout toggleDarkMode={toggleDarkMode}>
      <div className="courier-page">

        {/* HERO */}
        <div className="courier-hero">
          <div className="courier-hero-text">
            <h1>🚴 Courier Dashboard</h1>
            <p>Welcome, {currentUser}! Manage your deliveries here.</p>
          </div>
          <div className="courier-hero-stats">
            <div className="courier-hero-stat">
              <span>{availableOrders.length}</span>
              <label>Available</label>
            </div>
            <div className="courier-hero-stat">
              <span>{myOrders.length}</span>
              <label>My Active</label>
            </div>
            <div className="courier-hero-stat">
              <span>{completedOrders.length}</span>
              <label>Completed</label>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="courier-filter-tabs">
          <button
            className={`courier-filter-tab ${tab === "available" ? "active" : ""}`}
            onClick={() => setTab("available")}
          >
            📋 Available Orders ({availableOrders.length})
          </button>
          <button
            className={`courier-filter-tab ${tab === "mine" ? "active" : ""}`}
            onClick={() => setTab("mine")}
          >
            🚴 My Deliveries ({myOrders.length})
          </button>
          <button
            className={`courier-filter-tab ${tab === "completed" ? "active" : ""}`}
            onClick={() => setTab("completed")}
          >
            ✅ Completed ({completedOrders.length})
          </button>
        </div>

        {loading ? (
          <div className="courier-loading"><div className="courier-spinner" /></div>
        ) : (
          <div className="courier-orders-list">
            {tab === "available" && (
              availableOrders.length === 0 ? (
                <div className="courier-empty">
                  <span>📋</span>
                  <p>No available orders right now. Check back soon!</p>
                </div>
              ) : (
                availableOrders.map(order => (
                  <OrderCard key={order._id} order={order} showClaim={true} />
                ))
              )
            )}
            {tab === "mine" && (
              myOrders.length === 0 ? (
                <div className="courier-empty">
                  <span>🚴</span>
                  <p>You have no active deliveries. Claim an order to get started!</p>
                </div>
              ) : (
                myOrders.map(order => (
                  <OrderCard key={order._id} order={order} showUpdate={true} />
                ))
              )
            )}
            {tab === "completed" && (
              completedOrders.length === 0 ? (
                <div className="courier-empty">
                  <span>✅</span>
                  <p>No completed deliveries yet.</p>
                </div>
              ) : (
                completedOrders.map(order => (
                  <OrderCard key={order._id} order={order} />
                ))
              )
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Courier;