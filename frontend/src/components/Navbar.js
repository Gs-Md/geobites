import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/pic5.jpg";
import "../styles/Navbar.css";
import AuthModal from "../components/AuthModal";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

const Navbar = ({ cartCount = 0, isLoggedIn, setIsLoggedIn, isOwner, setIsOwner, onLoginSuccess, onLogout, currentUser }) => {
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  const openAuth = () => setShowAuth(true);
  const closeAuth = () => setShowAuth(false);

  const handleAuthClick = async () => {
    if (isLoggedIn) {
      // prefer caller-provided logout handler (App), otherwise call demo server endpoint
      if (onLogout) {
        onLogout();
      } else {
        try {
          const API_BASE = process.env.REACT_APP_API_BASE || "";
          await fetch(`${API_BASE}/api/auth/logout`, {
            method: "POST",
            credentials: "include",
          });
        } catch (e) {
          // ignore network errors in demo
        }
        setIsLoggedIn(false);
        setIsOwner(false);
      }
      navigate("/");
    } else {
      openAuth();
    }
  };

  return (
    <>
      <div className="navbar">
        <nav className="navlinks">
          <Link to="/">
            <img className="logo" src={logo} alt="GeoBites logo" />
          </Link>

          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/menu">Menu</Link>
          <Link to="/order">Order</Link>

          {!isOwner && <Link to="/Contact">Contact</Link>}
          {isOwner && <Link to="/Inbox">Messages</Link>}

          {currentUser && (
            <span className="user-greeting">Hi, {currentUser.name}</span>
          )}

          <Link to="/order" className="cart-btn">
            <ShoppingCartIcon className="cart-icon" />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          <button className="authtoggleBtn" onClick={handleAuthClick}>
            {isLoggedIn ? "Logout" : "Login / Signup"}
          </button>
        </nav>
      </div>

      {showAuth && (
        <AuthModal
          onClose={closeAuth}
          onLoginSuccess={(user) => {
            if (onLoginSuccess) {
              onLoginSuccess(user);
            } else {
              // After login, App will set flags via /auth/me, but set now for snappier UI:
              setIsLoggedIn(true);
              setIsOwner(true);
            }
            closeAuth();
          }}
        />
      )}
    </>
  );
};

export default Navbar;