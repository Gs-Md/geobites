import React, { useEffect, useRef, useState } from "react";
import "../styles/AuthModal.css";

const initial = { email: "", password: "", name: "", confirm: "" };

const AuthModal = ({ onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState("login");
  const [formData, setFormData] = useState(initial);
  const [error, setError] = useState("");
  const modalRef = useRef(null);

  useEffect(() => {
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    return () => (body.style.overflow = prev);
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  const onChange = (e) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const validate = () => {
    setError("");
    const { email, password } = formData;
    const emailOK = /^\S+@\S+\.\S+$/.test(email);
    if (!emailOK) return "Please enter a valid email address.";
    if (!password || password.length < 6)
      return "Password must be at least 6 characters.";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return setError(msg);

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Login failed");
      }
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
      return;
    }
    onClose();
  };

  const switchTab = (t) => {
    setActiveTab(t);
    setFormData(initial);
    setError("");
  };

  return (
    <div
      className="auth-overlay"
      onMouseDown={onOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="auth-modal"
        ref={modalRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="close-btn" type="button" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="tabs" role="tablist" aria-label="Authentication tabs">
          <button
            role="tab"
            aria-selected={activeTab === "login"}
            className={activeTab === "login" ? "active" : ""}
            onClick={() => switchTab("login")}
            type="button"
          >
            Login
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "signup"}
            className={activeTab === "signup" ? "active" : ""}
            onClick={() => switchTab("signup")}
            type="button"
            disabled
            title="Owner account only in this demo"
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={onChange}
            autoComplete="email"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={onChange}
            autoComplete="current-password"
            required
          />

          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" className="submit-btn">Log In</button>
          <button
            type="button"
            className="link-btn"
            onClick={() => alert("Forgot password flow not implemented in this demo")}
          >
          Forgot password?
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;