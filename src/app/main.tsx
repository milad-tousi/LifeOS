import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "@/app/App";
import { applyDocumentLanguage, getStoredLanguage, I18nProvider } from "@/i18n";
import "@/assets/styles/theme.css";
import "@/assets/styles/globals.css";

applyDocumentLanguage(getStoredLanguage());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </I18nProvider>
  </React.StrictMode>,
);
