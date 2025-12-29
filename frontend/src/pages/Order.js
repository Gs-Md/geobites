import React, { useState } from "react";
import "../styles/Order.css";
import CheckoutModal from "../components/CheckoutModal";

const Order = ({ cart, incQty, decQty, removeItem, currentUser, onClearCart }) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [placedId, setPlacedId] = useState(null);
  const subtotal = cart.reduce((sum, it) => sum + it.price * it.qty, 0);

  return (
    <div className="order-background">
      <div className="order-page">
        <h1 className="order-title">🛒 Your Order</h1>

        {placedId && (
          <p className="order-confirm">Order placed! ID: {placedId}</p>
        )}

        {cart.length === 0 ? (
          <p className="empty-cart">
            Your cart is empty. Go to the menu and add some items!
          </p>
        ) : (
          <>
            <div className="cart-list">
              {cart.map((it) => (
                <div className="cart-card" key={it.id}>
                  <img src={it.img} alt={it.name} />
                  <div className="cart-info">
                    <h3>{it.name}</h3>
                    <p className="price">${it.price}</p>
                  </div>

                  <div className="cart-qty">
                    <button onClick={() => decQty(it.id)}>-</button>
                    <span>{it.qty}</span>
                    <button onClick={() => incQty(it.id)}>+</button>
                  </div>

                  <div className="line-total">
                    ${(it.price * it.qty).toFixed(2)}
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() => removeItem(it.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="order-summary">
              <div className="summary-left">
                <p>Subtotal</p>
                <p>Delivery Fee</p>
                <p className="total-text">Total</p>
              </div>

              <div className="summary-right">
                <p>${subtotal.toFixed(2)}</p>
                <p>$3.00</p>
                <p className="total-text">${(subtotal + 3).toFixed(2)}</p>
              </div>
            </div>

            <button
              className="checkout-btn"
              onClick={() => setShowCheckout(true)}
            >
              Proceed to Checkout
            </button>
          </>
        )}

        {showCheckout && (
          <CheckoutModal
            cart={cart}
            subtotal={subtotal}
            currentUser={currentUser}
            onClose={() => setShowCheckout(false)}
            onPlaced={(orderId) => {
              setPlacedId(orderId);
              setShowCheckout(false);
              
              onClearCart && onClearCart();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Order;
