export function cartKeyForEmail(email) {
  return `gb_cart_${email}`;
}

export function loadCart(email) {
  if (!email) return [];
  try {
    return JSON.parse(localStorage.getItem(cartKeyForEmail(email)) || "[]");
  } catch {
    return [];
  }
}

export function saveCart(email, cart) {
  if (!email) return;
  localStorage.setItem(cartKeyForEmail(email), JSON.stringify(cart));
}

export default { cartKeyForEmail, loadCart, saveCart };