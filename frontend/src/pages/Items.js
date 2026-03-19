import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import "./Items.css";

const CATEGORIES = ["All", "Furniture", "Clothes", "Electronics", "Kitchen", "Books", "Toys", "Sports", "Other"];
const PAGE_SIZE = 16;

function Items({ toggleDarkMode }) {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("name");

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // MESSAGE MODAL STATE
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgTarget, setMsgTarget] = useState(null);
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);

  const loaderRef = useRef(null);

  const fetchItems = async () => {
    const res = await fetch("http://127.0.0.1:5000/items");
    const data = await res.json();
    setItems(data);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleObserver = useCallback((entries) => {
    if (entries[0].isIntersecting) setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const filtered = items.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || item.category === category;
    return matchSearch && matchCat;
  });

  const visibleItems = filtered.slice(0, visibleCount);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Mark this item as taken? It will be removed from the list.")) return;
    await fetch(`http://127.0.0.1:5000/items/${id}`, { method: "DELETE" });
    fetchItems();
  };

  const openMsgModal = (e, owner, itemTitle) => {
    e.stopPropagation();
    setMsgTarget({ owner, itemTitle });
    setMsgText("");
    setMsgSent(false);
    setShowMsgModal(true);
  };

  const handleSendMsg = async () => {
    if (!msgText.trim()) return;
    await fetch("http://127.0.0.1:5000/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: currentUser,
        to: msgTarget.owner,
        text: msgText,
        itemTitle: msgTarget.itemTitle
      })
    });
    setMsgSent(true);
  };

  return (
    <DashboardLayout toggleDarkMode={toggleDarkMode}>
      <div className="items-page">

        {/* ── TOP BAR ── */}
        <div className="items-topbar">
          <div className="items-search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="items-search"
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
            />
          </div>

          {/* EDIT: redirects to /add-item page instead of opening a modal */}
          <button className="add-item-btn" onClick={() => navigate("/add-item")}>
            + Add Item
          </button>

          <div className="view-toggle">
            <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} title="Grid view">⊞</button>
            <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} title="List view">☰</button>
          </div>
        </div>

        {/* ── CATEGORY FILTER ── */}
        <div className="category-bar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-btn ${category === cat ? "active" : ""}`}
              onClick={() => { setCategory(cat); setVisibleCount(PAGE_SIZE); }}
            >{cat}</button>
          ))}
        </div>

        <p className="results-count">{filtered.length} item{filtered.length !== 1 ? "s" : ""} available</p>

        {/* ── ITEMS ── */}
        {visibleItems.length === 0 ? (
          <div className="items-empty">
            <span>🌿</span>
            <p>No items found. Be the first to share something!</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "items-grid" : "items-list"}>
            {visibleItems.map(item => (
              <div
                className="item-card"
                key={item._id}
                onClick={() => navigate(`/items/${item._id}`)}
              >
                <div className="item-img-wrap">
                  {item.images && item.images[0]
                    ? <img src={item.images[0]} alt={item.title} />
                    : <div className="item-img-placeholder">📦</div>
                  }
                  <span className="item-condition">{item.condition || "used"}</span>
                </div>

                <div className="item-info">
                  <span className="item-category">{item.category}</span>
                  <h3 className="item-title">{item.title}</h3>
                  <p className="item-desc">{item.description}</p>
                  <p className="item-owner">👤 {item.owner}</p>

                  <div className="item-card-actions">
                    {item.owner !== currentUser && (
                      <button
                        className="item-msg-btn"
                        onClick={(e) => openMsgModal(e, item.owner, item.title)}
                      >
                        💬 Message
                      </button>
                    )}
                    {item.owner === currentUser && (
                      <button
                        className="item-delete-btn"
                        onClick={(e) => handleDelete(e, item._id)}
                      >
                        ✓ Mark as Taken
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {visibleCount < filtered.length && (
          <div ref={loaderRef} className="lazy-sentinel">
            <div className="lazy-spinner" />
          </div>
        )}

      </div>

      {/* ── MESSAGE MODAL ── */}
      {showMsgModal && (
        <div className="modal-overlay" onClick={() => setShowMsgModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Message {msgTarget?.owner}</h2>
              <button className="modal-close" onClick={() => setShowMsgModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {msgSent ? (
                <div className="msg-sent">
                  <span>✅</span>
                  <p>Message sent to <strong>{msgTarget?.owner}</strong>!</p>
                </div>
              ) : (
                <>
                  <p className="msg-about">About: <strong>{msgTarget?.itemTitle}</strong></p>
                  <label>Your Message</label>
                  <textarea
                    placeholder={`Hi ${msgTarget?.owner}, I'm interested in your item...`}
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

export default Items;