import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import "./AddItem.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const CATEGORIES = ["Furniture", "Clothes", "Electronics", "Kitchen", "Books", "Toys", "Sports", "Other"];
const CONDITIONS = ["New", "Excellent", "Good", "Fair", "Worn"];

function AddItem({ toggleDarkMode }) {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("name");

  const [form, setForm] = useState({
    title: "",
    category: "",
    condition: "",
    description: "",
    location: "",
    originalValue: "",
    tags: "",
    ecoDelivery: true,
    shareWithCommunity: true,
    images: []
  });

  const [previewImages, setPreviewImages] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // FIX: was hardcoded 127.0.0.1
  useEffect(() => {
    fetch(`${API}/items`)
      .then(r => r.json())
      .then(data => setMyItems(data.filter(i => i.owner === currentUser)));
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleImageChange = async (e) => {
  const files = Array.from(e.target.files);
  
  // Show local previews immediately
  const readers = files.map(file => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target.result);
    reader.readAsDataURL(file);
  }));
  const previews = await Promise.all(readers);
  setPreviewImages(previews);

  // Upload each file to Cloudinary via your backend
  const urls = await Promise.all(files.map(async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${API}/upload`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    return data.url;
  }));

  setForm(f => ({ ...f, images: urls })); // store Cloudinary URLs, not base64
};

  const handleSubmit = async () => {
    if (!form.title || !form.category || !form.condition || !form.description) {
      return alert("Please fill in all required fields.");
    }
    setSubmitting(true);
    // FIX: was hardcoded 127.0.0.1
    await fetch(`${API}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        category: form.category,
        condition: form.condition.toLowerCase(),
        description: form.description,
        location: form.location,
        originalValue: form.originalValue,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        images: form.images,
        owner: currentUser
      })
    });
    setSubmitting(false);
    navigate("/items");
  };

  const conditionColor = {
    "New": "#22a348",
    "Excellent": "#22a348",
    "Good": "#3b82f6",
    "Fair": "#f59e0b",
    "Worn": "#ef4444"
  };

  const stats = {
    total: myItems.length,
    delivery: myItems.filter(i => i.ecoDelivery).length,
    excellent: myItems.filter(i => ["new", "excellent"].includes(i.condition?.toLowerCase())).length,
    categories: [...new Set(myItems.map(i => i.category))].length
  };

  return (
    <DashboardLayout toggleDarkMode={toggleDarkMode}>
      <div className="additem-page">

        {/* ── PAGE TITLE ── */}
        <div className="additem-title-row">
          <button className="additem-back" onClick={() => navigate("/items")}>← Back</button>
          <div>
            <h1 className="additem-heading">Add Item</h1>
            <p className="additem-subheading">Catalog items you own for potential delivery</p>
          </div>
        </div>

        <div className="additem-layout">

          {/* ── LEFT COLUMN ── */}
          <div className="additem-left">

            {/* FORM CARD */}
            <div className="additem-card">
              <h2 className="additem-card-title">+ Add New Item</h2>

              {/* ITEM NAME */}
              <div className="additem-field">
                <label>Item Name <span className="required">*</span></label>
                <input
                  name="title"
                  placeholder="e.g., iPhone 12, Winter Jacket, Coffee Maker"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>

              {/* CATEGORY + CONDITION ROW */}
              <div className="additem-row">
                <div className="additem-field">
                  <label>Category <span className="required">*</span></label>
                  <select name="category" value={form.category} onChange={handleChange}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="additem-field">
                  <label>Condition <span className="required">*</span></label>
                  <select name="condition" value={form.condition} onChange={handleChange}>
                    <option value="">Select condition</option>
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="additem-field">
                <label>Description <span className="required">*</span></label>
                <textarea
                  name="description"
                  placeholder="Describe the item's condition, features, and any defects"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              {/* LOCATION + ORIGINAL VALUE ROW */}
              <div className="additem-row">
                <div className="additem-field">
                  <label>Current Location <span className="required">*</span></label>
                  <input
                    name="location"
                    placeholder="e.g., Bedroom, Garage, Home Office"
                    value={form.location}
                    onChange={handleChange}
                  />
                </div>
                <div className="additem-field">
                  <label>Original Value <span className="optional">(Optional)</span></label>
                  <input
                    name="originalValue"
                    placeholder="e.g., $50, $200 (for reference only)"
                    value={form.originalValue}
                    onChange={handleChange}
                  />
                  <p className="additem-hint">This helps others understand the item's worth, but everything shared is free!</p>
                </div>
              </div>

              {/* TAGS */}
              <div className="additem-field">
                <label>Tags <span className="optional">(Optional)</span></label>
                <input
                  name="tags"
                  placeholder="e.g., vintage, brand new, limited edition"
                  value={form.tags}
                  onChange={handleChange}
                />
              </div>

              {/* CHECKBOXES */}
              <div className="additem-checks">
                <label className="additem-check">
                  <input type="checkbox" name="ecoDelivery" checked={form.ecoDelivery} onChange={handleChange} />
                  Available for eco-delivery service (free)
                </label>
                <label className="additem-check">
                  <input type="checkbox" name="shareWithCommunity" checked={form.shareWithCommunity} onChange={handleChange} />
                  Share with community (always free)
                </label>
                <p className="additem-eco-note">🌱 Share freely to build our eco-community and promote sustainable living. All items are shared at no cost!</p>
              </div>

              {/* SUBMIT */}
              <button
                className="additem-submit"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Adding..." : "+ Add Item to Catalog"}
              </button>
            </div>

            {/* PHOTO UPLOAD CARD */}
            <div className="additem-card">
              <h2 className="additem-card-title">📷 Add Photos</h2>
              <label className="additem-upload">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
                {previewImages.length === 0 ? (
                  <>
                    <span className="upload-icon">📷</span>
                    <p>Photo upload feature</p>
                    <p className="upload-sub">Add photos to make your items more appealing</p>
                  </>
                ) : (
                  <div className="additem-preview-grid">
                    {previewImages.map((src, i) => (
                      <img key={i} src={src} alt={`preview-${i}`} />
                    ))}
                  </div>
                )}
              </label>
            </div>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="additem-right">

            {/* MY ITEMS */}
            <div className="additem-card">
              <h2 className="additem-card-title">📦 Your Items ({myItems.length})</h2>

              {myItems.length === 0 ? (
                <p className="additem-empty">You haven't shared any items yet.</p>
              ) : (
                <div className="myitems-list">
                  {myItems.map(item => (
                    <div className="myitem-row" key={item._id}>
                      <div className="myitem-info">
                        <div className="myitem-top">
                          <strong className="myitem-title">{item.title}</strong>
                          <span
                            className="myitem-condition"
                            style={{ color: conditionColor[item.condition] || "#888" }}
                          >
                            {item.condition || "—"}
                          </span>
                        </div>
                        <div className="myitem-meta">
                          <span>🏷️ {item.category}</span>
                          {item.location && <span>📍 {item.location}</span>}
                        </div>
                        <p className="myitem-desc">{item.description}</p>
                        <div className="myitem-tags">
                          <span className="myitem-tag green">Free to Share</span>
                          {item.ecoDelivery && <span className="myitem-tag blue">Eco-Delivery Available</span>}
                        </div>
                      </div>
                      <button
                        className="myitem-request"
                        onClick={() => navigate(`/items/${item._id}`)}
                      >
                        View Item
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STATS CARD */}
            <div className="additem-card">
              <h2 className="additem-card-title">📊 Your Item Stats</h2>
              <div className="stats-grid">
                <div className="stat-box">
                  <span className="stat-num">{stats.total}</span>
                  <span className="stat-label">Total Items</span>
                </div>
                <div className="stat-box">
                  <span className="stat-num">{stats.delivery}</span>
                  <span className="stat-label">Available for Delivery</span>
                </div>
                <div className="stat-box">
                  <span className="stat-num">{stats.excellent}</span>
                  <span className="stat-label">Excellent Condition</span>
                </div>
                <div className="stat-box">
                  <span className="stat-num">{stats.categories}</span>
                  <span className="stat-label">Categories</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AddItem;