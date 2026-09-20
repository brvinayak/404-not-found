import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { OptimizationProvider } from "./context/OptimizationContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <OptimizationProvider>
        <App />
      </OptimizationProvider>
    </BrowserRouter>
  </StrictMode>,
);
