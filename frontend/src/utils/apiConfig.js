// Backend base URL. Set VITE_API_URL in the environment (e.g. in Netlify)
// to point the deployed frontend at your hosted API server.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:5000";

export default API_BASE_URL;
