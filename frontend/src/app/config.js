// ===================================
// FEVERT APP CONFIG
// ===================================

export const APP_NAME = "FeeVert";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export const IS_PRODUCTION =
  import.meta.env.MODE === "production";

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
};
