import React, { useEffect, useRef, useState } from "react";
import "../styles/AuthModal.css";
import { signup, login } from "../services/authService";


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
    const { email, password, name, confirm } = formData;
    const emailOK = /^\S+@\S+\.\S+$/.test(email);
    if (!emailOK) return "Please enter a valid email address.";
    if (!password || password.length < 6)
      return "Password must be at least 6 characters.";
    if (activeTab === "signup") {
      if (!name || name.trim().length === 0) return "Please enter your name.";
      if (password !== confirm) return "Passwords do not match.";
    }
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // basic validations
    if (activeTab === "signup") {
      if (formData.password !== formData.confirm) {
        return setError("Passwords do not match");
      }
      if (!formData.name) return setError("Please enter your name");
      try {
        const user = await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        onLoginSuccess && onLoginSuccess(user);
        onClose();
      } catch (err) {
        setError(err.message);
      }
      return;
    }

    // login flow
    try {
      const user = await login({
        email: formData.email,
        password: formData.password,
      });
      onLoginSuccess && onLoginSuccess(user);
      onClose();
    } catch (err) {
      setError(err.message);
    }
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
        <button
          className="close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
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
            
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate>
          {activeTab === "signup" && (
            <input
              type="text"
              name="name"
              placeholder="Full name"
              value={formData.name}
              onChange={onChange}
              required
            />
          )}

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
            autoComplete={activeTab === "signup" ? "new-password" : "current-password"}
            required
          />

          {activeTab === "signup" && (
            <input
              type="password"
              name="confirm"
              placeholder="Confirm password"
              value={formData.confirm}
              onChange={onChange}
              autoComplete="new-password"
              required
            />
          )}

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="submit-btn">
            {activeTab === "signup" ? "Sign Up" : "Log In"}
          </button>
          {activeTab === "login" && (
            <button
              type="button"
              className="link-btn"
              onClick={() =>
                alert("Forgot password flow not implemented in this demo")
              }
            >
              Forgot password?
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
