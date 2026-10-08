import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { QueryCacheProvider } from "./context/QueryCacheContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryCacheProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryCacheProvider>
    </BrowserRouter>
  </React.StrictMode>
);