import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import "./Items.css";
import Fuse from "fuse.js";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const CATEGORIES = ["All", "Furniture", "Clothes", "Electronics", "Kitchen", "Books", "Toys", "Sports", "Other"];
const PAGE_SIZE = 1000;

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

  // Order modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderItem, setOrderItem] = useState(null);
  const [deliveryType, setDeliveryType] = useState(null); // "delivery" or "self-collect"
  const [orderStep, setOrderStep] = useState(1); // 1=choose type, 2=address form, 3=confirm
  const [orderForm, setOrderForm] = useState({
    streetNumber: "",
    street: "",
    suburb: "",
    state: "",
    postcode: "",
    phone: ""
  });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

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

  const openOrderModal = (e, item) => {
    e.stopPropagation();
    setOrderItem(item);
    setDeliveryType(null);
    setOrderStep(1);
    setOrderForm({ streetNumber: "", street: "", suburb: "", state: "", postcode: "", phone: "" });
    setOrderPlaced(false);
    setShowOrderModal(true);
  };

  const handleOrderFormChange = (e) => {
      setOrderForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async () => {
    if (deliveryType === "delivery") {
      const { streetNumber, street, suburb, state, postcode, phone } = orderForm;
      if (!streetNumber || !street || !suburb || !state || !postcode || !phone) {
        return alert("Please fill in all delivery details.");
    }
  }

  setPlacingOrder(true);
  try {
    await fetch(`${API}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: orderItem._id,
        itemTitle: orderItem.title,
        itemOwner: orderItem.owner,
        requestedBy: currentUser,
        deliveryType,
        address: deliveryType === "delivery" ? orderForm : {},
        phone: deliveryType === "delivery" ? orderForm.phone : ""
      })
    });
    setOrderPlaced(true);
  } catch {
    alert("Failed to place order. Please try again.");
  }
  setPlacingOrder(false);
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
                      {!isOwner && (
                        <button
                          className="item-order-btn"
                          onClick={(e) => openOrderModal(e, item)}
                        >
                          🛒 Place an Order
                        </button>
                      )}
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

      {/* ── ORDER MODAL ── */}
{showOrderModal && (
  <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
    <div className="modal order-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2>🛒 Place an Order</h2>
        <button className="modal-close" onClick={() => setShowOrderModal(false)}>✕</button>
      </div>

      <div className="modal-body">
        {orderPlaced ? (
          <div className="order-success">
            <span>✅</span>
            <h3>Order Placed!</h3>
            <p>Your order for <strong>{orderItem?.title}</strong> has been placed.</p>
            {deliveryType === "delivery" ? (
              <p className="order-success-note">
                🚴 A courier will be assigned soon. You can track your order in <strong>My Orders</strong>.
              </p>
            ) : (
              <p className="order-success-note">
                📍 The owner has been notified. You can collect the item at their location.
              </p>
            )}
            <button
              className="auth-btn"
              style={{ marginTop: "12px" }}
              onClick={() => {
                setShowOrderModal(false);
                if (deliveryType === "delivery") navigate("/my-orders");
              }}
            >
              {deliveryType === "delivery" ? "Track My Order →" : "Close"}
            </button>
          </div>
        ) : (
          <>
            {/* STEP 1 — CHOOSE DELIVERY TYPE */}
            {orderStep === 1 && (
              <div className="order-step">
                <div className="order-item-preview">
                  <div className="order-item-thumb">
                    {orderItem?.images?.[0]
                      ? <img src={orderItem.images[0]} alt={orderItem.title} />
                      : <span>📦</span>
                    }
                  </div>
                  <div>
                    <strong>{orderItem?.title}</strong>
                    <span>{orderItem?.category} · {orderItem?.condition}</span>
                    <span>👤 {orderItem?.owner}</span>
                  </div>
                </div>

                <p className="order-question">How would you like to receive this item?</p>

                <div className="order-type-cards">
                  <div
                    className={`order-type-card ${deliveryType === "delivery" ? "selected" : ""}`}
                    onClick={() => setDeliveryType("delivery")}
                  >
                    <span>🚴</span>
                    <strong>Home Delivery</strong>
                    <p>A courier will pick up and deliver the item to your address.</p>
                  </div>
                  <div
                    className={`order-type-card ${deliveryType === "self-collect" ? "selected" : ""}`}
                    onClick={() => setDeliveryType("self-collect")}
                  >
                    <span>🚶</span>
                    <strong>Self Collection</strong>
                    <p>You collect the item directly from the owner's location.</p>
                  </div>
                </div>

                {deliveryType && (
                  <button
                    className="auth-btn"
                    style={{ marginTop: "16px" }}
                    onClick={() => {
                      if (deliveryType === "self-collect") {
                        handlePlaceOrder();
                      } else {
                        setOrderStep(2);
                      }
                    }}
                  >
                    {deliveryType === "delivery" ? "Enter Delivery Details →" : "Confirm Order →"}
                  </button>
                )}
              </div>
            )}

            {/* STEP 2 — DELIVERY ADDRESS */}
            {orderStep === 2 && (
              <div className="order-step">
                <p className="order-question">📍 Enter your delivery address</p>

                <div className="order-address-grid">
                  <div className="auth-field" style={{ gridColumn: "1" }}>
                    <label>Street Number</label>
                    <input
                      name="streetNumber"
                      placeholder="e.g. 42"
                      value={orderForm.streetNumber}
                      onChange={handleOrderFormChange}
                    />
                  </div>
                  <div className="auth-field" style={{ gridColumn: "2" }}>
                    <label>Street Name</label>
                    <input
                      name="street"
                      placeholder="e.g. George Street"
                      value={orderForm.street}
                      onChange={handleOrderFormChange}
                    />
                  </div>
                  <div className="auth-field" style={{ gridColumn: "1" }}>
                    <label>Suburb</label>
                    <input
                      name="suburb"
                      placeholder="e.g. Sydney"
                      value={orderForm.suburb}
                      onChange={handleOrderFormChange}
                    />
                  </div>
                  <div className="auth-field" style={{ gridColumn: "2" }}>
                    <label>State</label>
                    <select
                      name="state"
                      value={orderForm.state}
                      onChange={handleOrderFormChange}
                      className="auth-select"
                    >
                      <option value="">Select state</option>
                      <option>NSW</option>
                      <option>VIC</option>
                      <option>QLD</option>
                      <option>WA</option>
                      <option>SA</option>
                      <option>TAS</option>
                      <option>ACT</option>
                      <option>NT</option>
                    </select>
                  </div>
                  <div className="auth-field" style={{ gridColumn: "1" }}>
                    <label>Postcode</label>
                    <input
                      name="postcode"
                      placeholder="e.g. 2000"
                      value={orderForm.postcode}
                      onChange={handleOrderFormChange}
                    />
                  </div>
                  <div className="auth-field" style={{ gridColumn: "2" }}>
                    <label>Phone Number</label>
                    <input
                      name="phone"
                      placeholder="e.g. 0412 345 678"
                      value={orderForm.phone}
                      onChange={handleOrderFormChange}
                    />
                  </div>
                </div>

                <div className="order-nav-btns">
                  <button
                    className="modal-cancel"
                    onClick={() => setOrderStep(1)}
                  >
                    ← Back
                  </button>
                  <button
                    className="auth-btn"
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                  >
                    {placingOrder ? "Placing Order..." : "Confirm Order →"}
                  </button>
                </div>
              </div>
            )}
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