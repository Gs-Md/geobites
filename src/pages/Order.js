import React from "react";
import "../styles/Order.css";

const Order = ({ cart, incQty, decQty, removeItem }) => {
  const subtotal = cart.reduce((sum, it) => sum + it.price * it.qty, 0);

  return (
    <div className="order-background">
      {" "}
      {/* ✅ background wrapper */}
      <div className="order-page">
        <h1 className="order-title">🛒 Your Order</h1>

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
              onClick={() => alert("Later: connect to payment or order API")}
            >
              Proceed to Checkout
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Order;
