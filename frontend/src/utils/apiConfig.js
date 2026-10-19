// Backend base URL. Set VITE_API_URL in the environment (e.g. in Vercel).
// No localhost fallback in production builds — misconfiguration must fail
// loudly instead of silently pointing at a dev server.
const configuredUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
export const API_BASE_URL =
  configuredUrl ||
  (import.meta.env.PROD
    ? "https://coffee-mern.onrender.com"
    : "http://localhost:5000");

export default API_BASE_URL;

// Normalize a product image URL so it always points to the deployed API.
// Fixes mixed-content errors when stored image values still reference
// http://localhost:5000 while the site is served over HTTPS.
export const toImageUrl = (image) => {
  if (!image) return image;
  // Full URL already — leave non-localhost origins untouched, repoint localhost.
  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    try {
      const url = new URL(image);
      if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
        return image;
      }
      const base = new URL(API_BASE_URL);
      url.protocol = base.protocol;
      url.hostname = base.hostname;
      url.port = base.port;
      return url.toString();
    } catch {
      return image;
    }
  }
  // CMS page-content image ("content/<id>").
  if (image.startsWith("content/")) {
    return `${API_BASE_URL}/images/${image}`;
  }
  // Stored reference like "products/<id>" or a bare id -> serve via /images/products/:id.
  const id = image.startsWith("products/") ? image.slice("products/".length) : image;
  return `${API_BASE_URL}/images/products/${id}`;
};
