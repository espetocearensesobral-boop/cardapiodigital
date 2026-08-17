export const ADMIN_DEMO_MODE = import.meta.env["VITE_ADMIN_DEMO_MODE"] !== "false";
export const DEMO_ADMIN_EMAIL =
  import.meta.env["VITE_ADMIN_DEMO_EMAIL"] || "admin@labellapizza.local";
export const DEMO_ADMIN_PASSWORD = import.meta.env["VITE_ADMIN_DEMO_PASSWORD"] || "LaBella@2026";
export const ADMIN_DEMO_STORAGE_KEY = "cardapiodigital-admin-demo-session";
