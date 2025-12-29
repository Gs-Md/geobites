import React, { useState } from "react";
import "../styles/CheckoutModal.css";
import { API_BASE } from "../services/authService";

const CheckoutModal = ({ cart = [], subtotal = 0, currentUser, onClose, onPlaced }) => {
  const [name, setName] = useState(currentUser?.name || "");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const fee = 3;
  const total = subtotal + fee;

  const placeOrder = async () => {
    if (!name || !address) return alert("Please enter name and address");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address: `${address}${note ? " — " + note : ""}`,
          items: cart,
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.message || "Order failed");

      await fetch(`${API_BASE}/api/cart`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([]),
      });

      onPlaced && onPlaced(d.orderId);
    } catch (e) {
      alert(e.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-overlay" onMouseDown={onClose}>
      <div className="checkout-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Checkout</h2>

        <div className="checkout-summary">
          <div className="items-list">
            {cart.map((it) => (
              <div key={it.id} className="item-row">
                <span>{it.name} × {it.qty}</span>
                <span>${(it.price * it.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="totals">
            <div><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div><span>Delivery</span><span>${fee.toFixed(2)}</span></div>
            <div className="total-row">
              <strong>Total</strong><strong>${total.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <div className="checkout-form">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />

          <label>Address</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} />

          <label>Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="checkout-actions">
          <button className="secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="primary" onClick={placeOrder} disabled={loading}>
            {loading ? "Placing..." : "Place Order"}
          </button>
        </div>

        <p className="demo-note">This is a demo checkout. No real payment is collected.</p>
      </div>
    </div>
  );
};

export default CheckoutModal;