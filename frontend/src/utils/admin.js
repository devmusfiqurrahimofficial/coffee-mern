const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "musfikurr93@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const isAdminEmail = (email) =>
  Boolean(email) && ADMIN_EMAILS.includes(email.toLowerCase());
