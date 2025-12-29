import React, { useEffect, useState } from "react";
import "../styles/Inbox.css";
import { API_BASE } from "../services/authService";

const Inbox = () => {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState("");

  const loadMessages = () => {
    fetch(`${API_BASE}/api/contact`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.message || "Unauthorized");
        }
        return r.json();
      })
      .then(setMessages)
      .catch((err) => {
        setError(err.message);
        setMessages([]);
      });
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const deleteMessage = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/contact/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (error) {
    return (
      <div className="inbox">
        <h1>Messages</h1>
        <p className="inbox-error">
          ⚠ {error}. Log in as owner to view messages.
        </p>
      </div>
    );
  }

  if (!messages) {
    return (
      <div className="inbox">
        <h1>Messages</h1>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="inbox">
      <h1>Messages</h1>
      {messages.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        <div className="inbox-list">
          {messages.map((m) => (
            <div key={m.id} className="inbox-card">
              <button
                className="delete-btn"
                onClick={() => deleteMessage(m.id)}
                title="Delete message"
              >
                ×
              </button>

              <div className="inbox-top">
                <div>
                  <strong>{m.name || "Anonymous"}</strong> ·{" "}
                  {m.email || "No email"}
                </div>
                <div className="inbox-date">
                  {m.created_at
                    ? new Date(m.created-at).toLocaleString()
                    : "No date"}
                </div>
              </div>

              <div className="inbox-subject">
                {m.subject || "(No subject)"}
              </div>

              <div className="inbox-body">
                {m.description || "(No message)"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inbox;