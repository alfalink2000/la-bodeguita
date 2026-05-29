// main.jsx - VERSIÓN CORREGIDA
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import App from "./App.jsx";
import "./index.css";

// // ✅ REGISTRO SIMPLIFICADO DEL SERVICE WORKER
// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/sw.js")
//       .then((reg) => console.log("✅ SW registrado:", reg))
//       .catch((err) => console.log("❌ SW error:", err));
//   });
// }

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
