import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import "./ItemDetail.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function ItemDetail({ toggleDarkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("name");

  const [item, setItem] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [claimed, setClaimed] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);

  useEffect(() => {
    // FIX: was fetching /items (all items) instead of /items/${id}
    fetch(`${API}/items/${id}`)
      .then(r => r.json())
      .then(data => setItem(data));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Mark this item as taken? It will be removed from the list.")) return;
    // FIX: was hardcoded 127.0.0.1, also pass owner for backend auth check
    await fetch(`${API}/items/${id}?owner=${encodeURIComponent(currentUser)}`, {
      method: "DELETE"
    });
    navigate("/items");
  };

  const handleClaim = () => {
    setClaimed(true);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMsg = async () => {
    if (!msgText.trim()) return;
    // FIX: was hardcoded 127.0.0.1
    await fetch(`${API}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: currentUser,
        to: item.owner,
        text: msgText,
        itemTitle: item.title
      })
    });
    setMsgSent(true);
  };

  if (!item) return (
    <DashboardLayout toggleDarkMode={toggleDarkMode}>
      <div className="detail-loading">
        <div className="lazy-spinner" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout toggleDarkMode={toggleDarkMode}>
      <div className="detail-page">

        <button className="detail-back" onClick={() => navigate("/items")}>
          ← Back to Items
        </button>

        <div className="detail-layout">

          {/* ── IMAGES ── */}
          <div className="detail-images">
            <div className="detail-main-img">
              {item.images && item.images[activeImg]
                ? <img src={item.images[activeImg]} alt={item.title} />
                : <div className="detail-img-placeholder">📦</div>
              }
              <span className="detail-condition">{item.condition || "used"}</span>
            </div>

            {item.images && item.images.length > 1 && (
              <div className="detail-thumbs">
                {item.images.map((src, i) => (
                  <img
                    key={i} src={src} alt={`thumb-${i}`}
                    className={activeImg === i ? "active" : ""}
                    onClick={() => setActiveImg(i)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── INFO ── */}
          <div className="detail-info">
            <span className="detail-category">{item.category}</span>
            <h1 className="detail-title">{item.title}</h1>

            <div className="detail-meta">
              <span>👤 Shared by <strong>{item.owner}</strong></span>
            </div>

            <p className="detail-description">{item.description}</p>

            <div className="detail-badge-row">
              <span className="detail-badge">🌿 Free to take</span>
              <span className="detail-badge">♻️ Reduce waste</span>
            </div>

            {/* ── ACTIONS ── */}
            <div className="detail-actions">

              {item.owner !== currentUser && (
                <button
                  className={`detail-claim-btn ${claimed ? "claimed" : ""}`}
                  onClick={handleClaim}
                  disabled={claimed}
                >
                  {claimed ? "✓ Requested!" : "🙋 Request this Item"}
                </button>
              )}

              {item.owner !== currentUser && (
                <button
                  className="detail-msg-btn"
                  onClick={() => { setMsgText(""); setMsgSent(false); setShowMsgModal(true); }}
                >
                  💬 Message Owner
                </button>
              )}

              <button className="detail-share-btn" onClick={handleShare}>
                {copied ? "✓ Link Copied!" : "🔗 Share"}
              </button>

              {item.owner === currentUser && (
                <button className="detail-delete-btn" onClick={handleDelete}>
                  ✓ Mark as Taken
                </button>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* ── MESSAGE MODAL ── */}
      {showMsgModal && (
        <div className="modal-overlay" onClick={() => setShowMsgModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Message {item.owner}</h2>
              <button className="modal-close" onClick={() => setShowMsgModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {msgSent ? (
                <div className="msg-sent">
                  <span>✅</span>
                  <p>Message sent to <strong>{item.owner}</strong>!</p>
                </div>
              ) : (
                <>
                  <p className="msg-about">About: <strong>{item.title}</strong></p>
                  <label>Your Message</label>
                  <textarea
                    placeholder={`Hi ${item.owner}, I'm interested in your item...`}
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    style={{ minHeight: "120px" }}
                  />
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => setShowMsgModal(false)}>
                {msgSent ? "Close" : "Cancel"}
              </button>
              {!msgSent && (
                <button className="modal-submit" onClick={handleSendMsg}>Send Message 💬</button>
              )}
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

export default ItemDetail;