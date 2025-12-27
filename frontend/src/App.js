import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Menu from "./pages/Menu";
import Order from "./pages/Order";
import Contact from "./pages/Contact";
import Inbox from "./pages/Inbox";
import "./styles/App.css";
import { useEffect, useState } from "react";
import { getCurrentUser, logout as authLogout, API_BASE } from "./services/authService";

function App() {
  const [cart, setCart] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check server for current user session
    (async () => {
      const u = await getCurrentUser();
      if (u) {
        setCurrentUser(u);
        setIsLoggedIn(true);
        setIsOwner(u.role === "owner");

        // load server-side cart
        try {
          const r = await fetch(`${API_BASE}/api/cart`, {
            credentials: "include",
          });
          if (r.ok) {
            const cartData = await r.json();
            setCart(Array.isArray(cartData) ? cartData : []);
          }
        } catch (e) {
          // ignore
        }
      } else {
        setIsLoggedIn(false);
        setIsOwner(false);
        setCurrentUser(null);
      }
    })();
  }, []);

  // Persist cart for the current user (server-backed)
  useEffect(() => {
    if (currentUser && currentUser.email) {
      (async () => {
        try {
          await fetch(`${API_BASE}/api/cart`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cart),
          });
        } catch (e) {
          // ignore
        }
      })();
    }
  }, [cart, currentUser]);

  const addToCart = (item) => {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      if (idx === -1) return [...prev, { ...item, qty: 1 }];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
      return copy;
    });
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user || null);
    setIsLoggedIn(true);
    setIsOwner(user?.role === "owner");

    // load cart for this user after login
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/cart`, {
          credentials: "include",
        });
        if (r.ok) {
          const cartData = await r.json();
          setCart(Array.isArray(cartData) ? cartData : []);
        }
      } catch (e) {
        // ignore
      }
    })();
  };

  const handleLogout = async () => {
    try {
      await authLogout();
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsOwner(false);
    setCart([]);
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

  const clearCart = async () => {
    try {
      await fetch(`${API_BASE}/api/cart`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([]),
      });
    } catch (e) {
      // ignore
    }
    setCart([]);
  };

  return (
    <Router>
      <div className="App">
        <Navbar
          cartCount={cart.reduce((sum, it) => sum + it.qty, 0)}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          isOwner={isOwner}
          setIsOwner={setIsOwner}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          currentUser={currentUser}
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
                  currentUser={currentUser}
                  onClearCart={clearCart}
                />
              }
            />
            <Route path="/contact" element={<Contact />} />
            <Route path="/inbox" element={<Inbox />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  );
}

export default App;