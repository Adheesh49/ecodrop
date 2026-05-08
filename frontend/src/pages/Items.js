import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import "./Items.css";
import Fuse from "fuse.js";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const CATEGORIES = ["All", "Furniture", "Clothes", "Electronics", "Kitchen", "Books", "Toys", "Sports", "Other"];
const PAGE_SIZE = 16;

const conditionStyle = {
  new:       { color: "#16a34a", background: "#dcfce7" },
  excellent: { color: "#16a34a", background: "#dcfce7" },
  good:      { color: "#2563eb", background: "#dbeafe" },
  fair:      { color: "#d97706", background: "#fef3c7" },
  worn:      { color: "#dc2626", background: "#fee2e2" },
};

// ── SYNONYM MAP ───────────────────────────────────────────
const SYNONYMS = {
  mobile:     ["phone", "iphone", "samsung", "smartphone", "android", "cell"],
  phone:      ["mobile", "iphone", "samsung", "smartphone", "cell"],
  iphone:     ["phone", "mobile", "apple", "smartphone"],
  samsung:    ["phone", "mobile", "android", "smartphone"],
  laptop:     ["computer", "macbook", "notebook", "chromebook", "dell", "hp"],
  computer:   ["laptop", "pc", "desktop", "macbook"],
  macbook:    ["laptop", "apple", "computer", "notebook"],
  tv:         ["television", "screen", "monitor", "display"],
  television: ["tv", "screen", "monitor"],
  fridge:     ["refrigerator", "freezer"],
  refrigerator: ["fridge", "freezer"],
  sofa:       ["couch", "lounge", "settee"],
  couch:      ["sofa", "lounge", "settee"],
  lounge:     ["sofa", "couch", "settee"],
  shoes:      ["sneakers", "boots", "sandals", "trainers", "footwear"],
  sneakers:   ["shoes", "trainers", "runners", "nikes", "adidas"],
  boots:      ["shoes", "footwear"],
  jacket:     ["coat", "hoodie", "jumper", "sweater", "parka", "blazer"],
  coat:       ["jacket", "parka", "overcoat"],
  hoodie:     ["jacket", "sweater", "jumper"],
  bike:       ["bicycle", "cycling", "bmx"],
  bicycle:    ["bike", "cycling"],
  table:      ["desk", "dining table", "coffee table"],
  desk:       ["table", "workstation"],
  chair:      ["seat", "stool", "armchair", "recliner"],
  bed:        ["mattress", "bedframe", "bunk"],
  shelf:      ["bookshelf", "shelving", "rack", "bookcase"],
  wardrobe:   ["closet", "cupboard", "cabinet"],
  book:       ["novel", "textbook", "magazine", "comic"],
  novel:      ["book", "fiction", "story"],
  textbook:   ["book", "study", "academic"],
  headphones: ["earphones", "earbuds", "airpods", "headset"],
  earphones:  ["headphones", "earbuds", "airpods"],
  camera:     ["dslr", "photography", "webcam", "gopro"],
  tablet:     ["ipad", "kindle", "android tablet"],
  ipad:       ["tablet", "apple"],
  washing:    ["washer", "laundry", "washing machine"],
  kettle:     ["jug", "electric kettle"],
  blender:    ["mixer", "juicer", "food processor"],
  coffee:     ["espresso", "nespresso", "coffee maker", "coffee machine"],
  gym:        ["weights", "dumbbell", "barbell", "fitness"],
  ball:       ["football", "basketball", "soccer", "tennis"],
  football:   ["soccer", "ball", "rugby"],
  basketball: ["ball", "hoop", "nba"],
  scooter:    ["electric scooter", "kick scooter"],
  skateboard: ["skate", "longboard"],
  yoga:       ["mat", "pilates", "meditation"],
  pot:        ["pan", "saucepan", "wok", "casserole"],
  pan:        ["pot", "frying pan", "skillet", "wok"],
  knife:      ["blade", "cutter", "chopper"],
  toaster:    ["grill", "toaster oven"],
  microwave:  ["oven", "microwave oven"],
  shirt:      ["top", "tshirt", "tee", "blouse", "polo"],
  pants:      ["jeans", "trousers", "shorts", "leggings"],
  jeans:      ["pants", "denim", "trousers"],
  dress:      ["skirt", "gown", "frock"],
  hat:        ["cap", "beanie", "helmet"],
};

function expandQuery(query) {
  const lower = query.toLowerCase().trim();
  const terms = new Set([lower]);

  if (SYNONYMS[lower]) {
    SYNONYMS[lower].forEach(s => terms.add(s));
  }

  Object.entries(SYNONYMS).forEach(([key, list]) => {
    if (list.includes(lower)) {
      terms.add(key);
      list.forEach(s => terms.add(s));
    }
  });

  return Array.from(terms);
}

const fuseOptions = {
  keys: [
    { name: "title",       weight: 0.4 },
    { name: "description", weight: 0.3 },
    { name: "category",    weight: 0.15 },
    { name: "tags",        weight: 0.1 },
    { name: "location",    weight: 0.05 },
  ],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
};

function smartSearch(items, query) {
  if (!query || query.trim() === "") return null;

  const expandedTerms = expandQuery(query.trim());
  const fuse = new Fuse(items, fuseOptions);
  const resultMap = new Map();

  expandedTerms.forEach(term => {
    fuse.search(term).forEach(({ item, score }) => {
      const existing = resultMap.get(item._id);
      if (!existing || score < existing.score) {
        resultMap.set(item._id, { item, score });
      }
    });
  });

  return Array.from(resultMap.values())
    .sort((a, b) => a.score - b.score)
    .map(r => r.item);
}

function timeAgo(ts) {
  if (!ts) return "";
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Items({ toggleDarkMode }) {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("name");

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [liked, setLiked] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState(null);

  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgTarget, setMsgTarget] = useState(null);
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [sending, setSending] = useState(false);

  const loaderRef = useRef(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/items`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch items:", e);
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleObserver = useCallback((entries) => {
    if (entries[0].isIntersecting) setVisibleCount(prev => prev + PAGE_SIZE);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  // Smart search handler — instant with Fuse.js
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    setVisibleCount(PAGE_SIZE);

    if (!value.trim()) {
      setSearchResults(null);
      return;
    }

    const results = smartSearch(items, value);
    setSearchResults(results);
  };

  const clearSearch = () => {
    setSearch("");
    setSearchResults(null);
    setVisibleCount(PAGE_SIZE);
  };

  const filtered = (searchResults !== null ? searchResults : items).filter(item =>
    category === "All" || item.category === category
  );

  const visibleItems = filtered.slice(0, visibleCount);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Mark this item as taken? It will be removed.")) return;
    await fetch(`${API}/items/${id}?owner=${encodeURIComponent(currentUser)}`, {
      method: "DELETE"
    });
    fetchItems();
  };

  const toggleLike = (e, id) => {
    e.stopPropagation();
    setLiked(prev => ({ ...prev, [id]: !prev[id] }));
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
    setSending(true);
    try {
      await fetch(`${API}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: currentUser,
          to: msgTarget.owner,
          text: msgText.trim(),
          itemTitle: msgTarget.itemTitle
        })
      });
      setMsgSent(true);
    } catch (e) {
      alert("Failed to send message. Is the server running?");
    }
    setSending(false);
  };

  const condKey = (c) => c?.toLowerCase() || "good";

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
              placeholder="Smart search — try 'mobile', 'sofa', 'laptop'..."
              value={search}
              onChange={handleSearch}
            />
            {search && (
              <button className="search-clear-btn" onClick={clearSearch}>✕</button>
            )}
          </div>
          <button className="add-item-btn" onClick={() => navigate("/add-item")}>
            + Add Item
          </button>
          <div className="view-toggle">
            <button
              className={viewMode === "grid" ? "active" : ""}
              onClick={() => setViewMode("grid")}
            >⊞</button>
            <button
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
            >☰</button>
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

        {/* ── RESULTS COUNT ── */}
        <p className="results-count">
          {loading
            ? "Loading..."
            : searchResults !== null
            ? `🔍 Found ${filtered.length} item${filtered.length !== 1 ? "s" : ""} for "${search}"`
            : `${filtered.length} item${filtered.length !== 1 ? "s" : ""} available`
          }
        </p>

        {/* ── ITEMS ── */}
        {loading ? (
          <div className="items-loading"><div className="lazy-spinner" /></div>
        ) : visibleItems.length === 0 ? (
          <div className="items-empty">
            <span>🌿</span>
            <p>
              {searchResults !== null
                ? `No items found for "${search}". Try a different keyword.`
                : "No items found. Be the first to share something!"
              }
            </p>
            {searchResults !== null ? (
              <button className="add-item-btn" onClick={clearSearch}>
                Clear Search
              </button>
            ) : (
              <button className="add-item-btn" onClick={() => navigate("/add-item")}>
                + Add Item
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === "grid" ? "items-grid" : "items-list"}>
            {visibleItems.map(item => {
              const isOwner = item.owner === currentUser;

              return (
                <div className="item-card" key={item._id}>

                  {/* IMAGE */}
                  <div className="item-img-wrap">
                    {item.images && item.images[0]
                      ? <img src={item.images[0]} alt={item.title} />
                      : <div className="item-img-placeholder">📦</div>
                    }
                    <span className="item-free-badge">♡ Free</span>
                    <button
                      className={`item-like-btn ${liked[item._id] ? "liked" : ""}`}
                      onClick={(e) => toggleLike(e, item._id)}
                    >{liked[item._id] ? "♥" : "♡"}</button>
                  </div>

                  {/* BODY */}
                  <div className="item-body">

                    <div className="item-title-row">
                      <h3 className="item-title">{item.title}</h3>
                      <span
                        className="item-condition-badge"
                        style={conditionStyle[condKey(item.condition)]}
                      >
                        {item.condition
                          ? item.condition.charAt(0).toUpperCase() + item.condition.slice(1)
                          : "Good"}
                      </span>
                    </div>

                    <div className="item-tags">
                      <span className="item-tag green">♡ Free to Share</span>
                      <span className="item-tag teal">♻ Eco-Friendly</span>
                    </div>

                    <p className="item-desc">{item.description}</p>

                    <div className="item-meta-row">
                      {item.location && (
                        <span className="item-meta">📍 {item.location}</span>
                      )}
                      {item.createdAt && (
                        <span className="item-meta">🕐 {timeAgo(item.createdAt)}</span>
                      )}
                    </div>

                    <div className="item-owner-row">
                      <span className="item-owner-icon">👤</span>
                      <span className="item-owner-name">{item.owner}</span>
                      {isOwner && (
                        <span className="item-yours-badge">Your item</span>
                      )}
                    </div>

                    <div className="item-actions">
                      {!isOwner ? (
                        <>
                          <button
                            className="item-msg-btn"
                            onClick={(e) => openMsgModal(e, item.owner, item.title)}
                          >
                            💬 Message
                          </button>
                          <button
                            className="item-view-btn"
                            onClick={() => navigate(`/items/${item._id}`)}
                          >
                            View Details
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="item-delete-btn"
                            onClick={(e) => handleDelete(e, item._id)}
                          >
                            ✓ Mark as Taken
                          </button>
                          <button
                            className="item-view-btn"
                            onClick={() => navigate(`/items/${item._id}`)}
                          >
                            View Details
                          </button>
                        </>
                      )}
                    </div>

                    <div className="item-footer">
                      <span>{item.views || 0} views</span>
                      <span>{item.likes || 0} likes</span>
                      <span className="item-eco-tag">📦 Eco-Delivery</span>
                    </div>

                  </div>
                </div>
              );
            })}
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
                  <p>Sent to <strong>{msgTarget?.owner}</strong>!</p>
                  <small>Continue the chat in Messages.</small>
                </div>
              ) : (
                <>
                  <p className="msg-about">About: <strong>{msgTarget?.itemTitle}</strong></p>
                  <label>Your Message</label>
                  <textarea
                    placeholder={`Hi ${msgTarget?.owner}, I'm interested in your item...`}
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMsg();
                      }
                    }}
                  />
                </>
              )}
            </div>
            <div className="modal-footer">
              {msgSent ? (
                <>
                  <button className="modal-cancel" onClick={() => setShowMsgModal(false)}>
                    Close
                  </button>
                  <button className="modal-submit" onClick={() => {
                    setShowMsgModal(false);
                    navigate(`/messages?to=${msgTarget.owner}`);
                  }}>
                    Open Chat →
                  </button>
                </>
              ) : (
                <>
                  <button className="modal-cancel" onClick={() => setShowMsgModal(false)}>
                    Cancel
                  </button>
                  <button
                    className="modal-submit"
                    onClick={handleSendMsg}
                    disabled={sending}
                  >
                    {sending ? "Sending..." : "Send 💬"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

export default Items;