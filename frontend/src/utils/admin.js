// Admin allow-list comes ONLY from the env (no hardcoded fallback email).
// AdminRoute is UI sugar only — real enforcement is backend requireAdmin.
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const isAdminEmail = (email) =>
  Boolean(email) && ADMIN_EMAILS.includes(email.toLowerCase());
