/**
 * Entrada React da aplicacao web Orélle.
 *
 * O Vite carrega este ficheiro a partir de `index.html` e monta a app no
 * elemento `#root`.
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";

createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
