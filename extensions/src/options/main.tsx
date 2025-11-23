import "./styles.css";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createThemeCSS } from "@axis/shared/theme";
import type { ExtensionSettings, ExtensionTheme } from "@axis/shared/types";
import { sendRuntimeMessage } from "@axis/shared/messaging";
import { SUPPORTED_SITES } from "../site-config";

const OptionsApp = () => {
  const [settings, setSettings] = useState<ExtensionSettings>({
    apiBaseUrl: "https://axis-crm-v1.vercel.app",
  });
  const [theme, setTheme] = useState<ExtensionTheme | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    sendRuntimeMessage({ type: "GET_STATE" })
      .then((response) => {
        if (response.ok && response.type === "STATE") {
          setSettings(response.state.settings);
          setTheme(response.state.theme);
        }
      })
      .catch((error) => {
        console.error("Failed to load extension state:", error);
      });
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = createThemeCSS(theme);
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [theme]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage(null);
    try {
      const response = await sendRuntimeMessage({
        type: "UPDATE_SETTINGS",
        payload: settings,
      });
      if (!response.ok) {
        setStatus("error");
        setErrorMessage(response.error || "Failed to save settings");
        return;
      }
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      setStatus("error");
      const errorMsg = error instanceof Error ? error.message : "Failed to save settings";
      setErrorMessage(errorMsg);
      console.error("Settings save error:", error);
    }
  }

  return (
    <div className="options-shell">
      <header>
        <h1>AXIS CRM Autofill – Options</h1>
        <p style={{ color: "rgba(248, 250, 255, 0.6)", maxWidth: 520 }}>
          Set which AXIS environment you sync from and review the marketplaces currently supported
          for one-click listings.
        </p>
      </header>

      <form className="panel" onSubmit={handleSubmit}>
        <input
          type="hidden"
          value="https://axis-crm-v1.vercel.app"
        />
        <p style={{ fontSize: 13, color: "rgba(248, 250, 255, 0.5)", marginTop: 8 }}>
          Using default AXIS dashboard URL: <strong>{settings.apiBaseUrl}</strong>
        </p>
        <p style={{ fontSize: 13, color: "rgba(248, 250, 255, 0.5)", marginTop: 8 }}>
          We use this URL for Clerk authentication, property sync, and theme mirroring.
        </p>
        {errorMessage && (
          <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{errorMessage}</p>
        )}
      </form>

      <section className="panel">
        <h2>Supported listing sites</h2>
        <div className="site-list">
          {SUPPORTED_SITES.map((site) => (
            <div key={site.key} className="site-card">
              <strong>{site.label}</strong>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(248, 250, 255, 0.6)" }}>
                {site.description || "Autofills price, address, photos, amenities, and description."}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const container = document.getElementById("root");
if (!container) {
  console.error("Root element not found. Cannot mount React app.");
} else {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <OptionsApp />
    </React.StrictMode>,
  );
}

