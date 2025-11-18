import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Menu from "./pages/Menu";
import Order from "./pages/Order";
import Contact from "./pages/Contact";
import Inbox from "./pages/Inbox"; // NEW
import "./styles/App.css";
import { useEffect, useState } from "react";

function App() {
  const [cart, setCart] = useState([]); // [{id,name,price,img,qty}]
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Check session on load
  useEffect(() => {
    fetch("http://localhost:4000/api/auth/me", {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.role === "owner") {
          setIsLoggedIn(true);
          setIsOwner(true);
        } else {
          setIsLoggedIn(false);
          setIsOwner(false);
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
        setIsOwner(false);
      });
  }, []);

  const addToCart = (item) => {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      if (idx === -1) return [...prev, { ...item, qty: 1 }];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
      return copy;
    });
  };

  const incQty = (id) =>
    setCart((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it))
    );

  const decQty = (id) =>
    setCart((prev) =>
      prev
        .map((it) =>
          it.id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it
        )
        .filter((it) => it.qty > 0)
    );

  const removeItem = (id) =>
    setCart((prev) => prev.filter((it) => it.id !== id));

  return (
    <Router>
      <div className="App">
        <Navbar
          cartCount={cart.reduce((sum, it) => sum + it.qty, 0)}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          isOwner={isOwner}
          setIsOwner={setIsOwner}
        />

        <div className="page-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route
              path="/menu"
              element={<Menu onAddToCart={addToCart} isLoggedIn={isLoggedIn} />}
            />
            <Route
              path="/order"
              element={
                <Order
                  cart={cart}
                  incQty={incQty}
                  decQty={decQty}
                  removeItem={removeItem}
                />
              }
            />
            <Route path="/contact" element={<Contact />} />
            {/* Owner-only inbox (route exists; Navbar shows link only if owner) */}
            <Route path="/inbox" element={<Inbox />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  );
}
export default App;
