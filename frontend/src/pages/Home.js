import React from "react";
import "../styles/Home.css";
import pic1 from "../assets/pic3.JPG";

const Home = () => {
  return (
    <div className="home">
      <section
        className="home-top"
        style={{ backgroundImage: `url(${pic1})` }}
      >
        <div className="overlay">
          <h1>Welcome to GeoBites</h1>
          <p>Snacks, burgers, pizza - fresh, fast, delivered</p>
          <a href="/menu" className="btn">
            View Menu
          </a>
        </div>
      </section>

      <section className="home-bottom">
        <h2>Our Promise</h2>
        <p>
          At GeoBites, we serve tasty meals made from fresh ingredients —
          perfect for any craving.
        </p>
      </section>
    </div>
  );
};

export default Home;