import React, { useState } from "react";
import "../styles/Menu.css";
import menuData from "../data/MenuData";

const categories = [
  "Appetizers",
  "Desserts",
  "Sandwiches",
  "Burgers",
  "Pizzas",
  "Drinks",
];

const Menu = ({ onAddToCart, isLoggedIn }) => {
  const [selected, setSelected] = useState("Appetizers");

  return (
    <div className="menu-page">
      <h1 className="menu-title">Our Menu</h1>

      {/* Category slider */}
      <div className="menu-slider">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`menu-category-btn ${selected === cat ? "active" : ""}`}
            onClick={() => setSelected(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Item cards */}
      <div className="menu-items">
        {menuData[selected].map((item) => (
          <div className="menu-item-card" key={item.id}>
            <img src={item.img} alt={item.name} />
            <h3>{item.name}</h3>
            <p>${item.price}</p>

            {isLoggedIn ? (
              <button onClick={() => onAddToCart(item)}>Add to Cart</button>
            ) : (
              <p className="login-warning">Login to order</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;
