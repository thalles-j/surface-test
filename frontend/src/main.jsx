import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyThemeAttribute, getSavedTheme, LIGHT_THEME } from "./context/ThemeContext.jsx";

// Apply persisted theme before React mounts to reduce first-paint flicker.
const initialPath = window.location.pathname || "/";
applyThemeAttribute(initialPath.startsWith("/admin") ? getSavedTheme() : LIGHT_THEME);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
