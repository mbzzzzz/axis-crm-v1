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

  useEffect(() => {
    sendRuntimeMessage({ type: "GET_STATE" }).then((response) => {
      if (response.ok) {
        setSettings(response.state.settings);
        setTheme(response.state.theme);
      }
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
    const response = await sendRuntimeMessage({
      type: "UPDATE_SETTINGS",
      payload: settings,
    });
    if (!response.ok) {
      setStatus("error");
      return;
    }
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
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
        <label htmlFor="apiBaseUrl">AXIS dashboard URL</label>
        <input
          id="apiBaseUrl"
          name="apiBaseUrl"
          placeholder="https://axis-crm-v1.vercel.app"
          value={settings.apiBaseUrl}
          onChange={(event) => setSettings((prev) => ({ ...prev, apiBaseUrl: event.target.value }))}
          required
        />
        <p style={{ fontSize: 13, color: "rgba(248, 250, 255, 0.5)", marginTop: 8 }}>
          We use this URL for Clerk authentication, property sync, and theme mirroring.
        </p>
        <button type="submit" style={{ marginTop: 16 }}>
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Save changes"}
        </button>
      </form>

      <section className="panel">
        <h2>Supported listing sites</h2>
        <div className="site-list">
          {SUPPORTED_SITES.map((site) => (
            <div key={site.key} className="site-card">
              <strong>{site.label}</strong>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(248, 250, 255, 0.6)" }}>
                Autofills price, address, photos, amenities, and description.
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>,
);

