import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import DashboardLayout from "../layouts/DashboardLayout";
import "./Messages.css";

const SOCKET_URL = "http://127.0.0.1:5000";

function Messages({ toggleDarkMode }) {
  const currentUser = localStorage.getItem("name");
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const [searchConvo, setSearchConvo] = useState("");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  // EDIT: keep activePartner in a ref so socket callbacks always see latest value
  const activePartnerRef = useRef(null);

  // ── Init socket
  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);
    return () => s.disconnect();
  }, []);

  // EDIT: wrap in useCallback so it can be safely listed as a dependency
  const fetchConversations = useCallback(async () => {
    const res = await fetch(`${SOCKET_URL}/messages/conversations?user=${currentUser}`);
    const data = await res.json();
    setConversations(data);
  }, [currentUser]);

  // ── Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // EDIT: wrap in useCallback — depends on socket and currentUser
  const openConversation = useCallback(async (partner) => {
    // Leave old room
    if (socket && activePartnerRef.current) {
      socket.emit("leave", { user: currentUser, partner: activePartnerRef.current });
    }

    activePartnerRef.current = partner;
    setActivePartner(partner);

    // Fetch history
    const res = await fetch(
      `${SOCKET_URL}/messages?user=${currentUser}&partner=${partner}`
    );
    const data = await res.json();
    setMessages(data);

    // Join new room
    if (socket) {
      socket.emit("join", { user: currentUser, partner });
    }

    // Refresh convos to clear unread badge
    fetchConversations();

    // Focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [socket, currentUser, fetchConversations]);

  // ── If redirected from item page with ?to=someone, open that convo
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const to = params.get("to");
    if (to) openConversation(to);
  }, [location.search, openConversation]);

  // ── Listen for incoming messages via WebSocket
  useEffect(() => {
    if (!socket || !activePartner) return;

    socket.emit("join", { user: currentUser, partner: activePartner });

    socket.on("receive_message", (msg) => {
      setMessages(prev => [...prev, msg]);
      fetchConversations();
    });

    return () => socket.off("receive_message");
  }, [socket, activePartner, currentUser, fetchConversations]);

  // ── Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message
  const sendMessage = () => {
    if (!input.trim() || !activePartner || !socket) return;

    socket.emit("send_message", {
      from: currentUser,
      to: activePartner,
      text: input.trim(),
      itemTitle: ""
    });

    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Format timestamp
  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // ── Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.timestamp);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  const getInitials = (name) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  const filteredConvos = conversations.filter(c =>
    c.partner?.toLowerCase().includes(searchConvo.toLowerCase())
  );

  return (
    <DashboardLayout toggleDarkMode={toggleDarkMode}>
      <div className="msg-page">

        {/* ── SIDEBAR ── */}
        <aside className="msg-sidebar">
          <div className="msg-sidebar-header">
            <h2>Messages</h2>
            <span className="msg-count">{conversations.length}</span>
          </div>

          <div className="msg-search-wrap">
            <span className="msg-search-icon">🔍</span>
            <input
              className="msg-search"
              placeholder="Search conversations..."
              value={searchConvo}
              onChange={(e) => setSearchConvo(e.target.value)}
            />
          </div>

          <div className="msg-convo-list">
            {filteredConvos.length === 0 ? (
              <div className="msg-convo-empty">No conversations yet</div>
            ) : (
              filteredConvos.map(convo => (
                <div
                  key={convo.partner}
                  className={`msg-convo-item ${activePartner === convo.partner ? "active" : ""}`}
                  onClick={() => openConversation(convo.partner)}
                >
                  <div className="msg-avatar">{getInitials(convo.partner)}</div>
                  <div className="msg-convo-info">
                    <div className="msg-convo-top">
                      <span className="msg-convo-name">{convo.partner}</span>
                      <span className="msg-convo-time">{formatTime(convo.lastTime)}</span>
                    </div>
                    <div className="msg-convo-bottom">
                      <span className="msg-convo-preview">
                        {convo.itemTitle ? `Re: ${convo.itemTitle} — ` : ""}
                        {convo.lastMessage}
                      </span>
                      {convo.unread > 0 && (
                        <span className="msg-unread-badge">{convo.unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ── CHAT AREA ── */}
        <main className="msg-chat">
          {!activePartner ? (

            <div className="msg-empty">
              <div className="msg-empty-icon">💬</div>
              <h3>Your Messages</h3>
              <p>Select a conversation or message an item owner to get started.</p>
              <button className="msg-empty-btn" onClick={() => navigate("/items")}>
                Browse Items
              </button>
            </div>

          ) : (
            <>
              <div className="msg-chat-header">
                <div className="msg-chat-avatar">{getInitials(activePartner)}</div>
                <div className="msg-chat-partner-info">
                  <span className="msg-chat-partner-name">{activePartner}</span>
                  <span className="msg-chat-status">🟢 Active</span>
                </div>
              </div>

              <div className="msg-chat-body">
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="msg-date-divider"><span>{date}</span></div>
                    {msgs.map((msg, i) => {
                      const isMine = msg.from === currentUser;
                      return (
                        <div
                          key={msg._id || i}
                          className={`msg-bubble-row ${isMine ? "mine" : "theirs"}`}
                        >
                          {!isMine && (
                            <div className="msg-bubble-avatar">{getInitials(msg.from)}</div>
                          )}
                          <div className="msg-bubble-wrap">
                            {msg.itemTitle && (
                              <div className="msg-item-context">
                                📦 Re: <strong>{msg.itemTitle}</strong>
                              </div>
                            )}
                            <div className={`msg-bubble ${isMine ? "mine" : "theirs"}`}>
                              {msg.text}
                            </div>
                            <span className="msg-time">{formatTime(msg.timestamp)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="msg-input-row">
                <textarea
                  ref={inputRef}
                  className="msg-input"
                  placeholder={`Message ${activePartner}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  className={`msg-send-btn ${input.trim() ? "active" : ""}`}
                  onClick={sendMessage}
                  disabled={!input.trim()}
                >
                  ➤
                </button>
              </div>
            </>
          )}
        </main>

      </div>
    </DashboardLayout>
  );
}

export default Messages;