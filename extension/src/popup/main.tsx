import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ExtensionQueryProvider } from "./query/ExtensionQueryProvider";
import { PopupApp } from "./PopupApp";
import "../styles/extension.css";
import "./popup.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ExtensionQueryProvider>
      <PopupApp />
    </ExtensionQueryProvider>
  </StrictMode>,
);
