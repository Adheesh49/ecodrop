const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

// ── TEXT SEARCH via backend ──────────────────────────────
export async function aiTextSearch(items, query) {
  if (!query || query.trim() === "") return items;

  try {
    const res = await fetch(`${API}/ai/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        items: items.map(i => ({
          id: i._id,
          title: i.title,
          description: i.description?.slice(0, 150),
          category: i.category,
          tags: i.tags || []
        }))
      })
    });
    const data = await res.json();
    const matchedIds = data.ids || [];
    return items.filter(i => matchedIds.includes(i._id));
  } catch (err) {
    console.error("AI search failed, using basic fallback:", err);
    return items.filter(i =>
      i.title?.toLowerCase().includes(query.toLowerCase()) ||
      i.description?.toLowerCase().includes(query.toLowerCase())
    );
  }
}

// ── IMAGE SEARCH via backend ─────────────────────────────
export async function aiImageSearch(items, imageBase64, mediaType = "image/jpeg") {
  try {
    const res = await fetch(`${API}/ai/image-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: imageBase64.split(",")[1],
        mediaType,
        items: items.map(i => ({
          id: i._id,
          title: i.title,
          description: i.description?.slice(0, 150),
          category: i.category,
          tags: i.tags || []
        }))
      })
    });
    const data = await res.json();
    const matchedIds = data.ids || [];
    return items.filter(i => matchedIds.includes(i._id));
  } catch (err) {
    console.error("AI image search failed:", err);
    return [];
  }
}