import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { sendRuntimeMessage } from "@axis/shared/messaging";
import type { ExtensionState } from "@axis/shared/types";
import { PropertyCard } from "./components/PropertyCard";
import { SyncButton } from "./components/SyncButton";
import { createThemeCSS } from "@axis/shared/theme";

export default function App() {
  const [state, setState] = useState<ExtensionState | null>(null);

  async function refreshState() {
    try {
      const response = await sendRuntimeMessage({ type: "GET_STATE" });
      if (response.ok && response.type === "STATE") {
        setState(response.state);
      } else if (response.type === "ERROR") {
        console.error("Failed to get state:", response.error);
      }
    } catch (error) {
      console.error("Error refreshing state:", error);
    }
  }

  useEffect(() => {
    refreshState();
  }, []);

  useEffect(() => {
    const styleId = "axis-theme-style";
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = createThemeCSS(state?.theme ?? null);
  }, [state?.theme]);

  async function handleSync() {
    const response = await sendRuntimeMessage({ type: "SYNC_DATA" });
    if (!response.ok) {
      const errorMsg = response.error || "Sync failed. Please try again.";
      if (errorMsg.includes("Not signed in")) {
        alert(
          "Not signed in to AXIS CRM.\n\n" +
          "1. Click 'Open AXIS' to log in\n" +
          "2. Make sure you're logged in on the dashboard\n" +
          "3. Then click 'Sync from AXIS' again"
        );
      } else {
        alert(`Sync failed: ${errorMsg}`);
      }
    }
    await refreshState();
  }

  async function handleSelect(propertyId: number) {
    const response = await sendRuntimeMessage({
      type: "SET_SELECTED_PROPERTY",
      payload: propertyId,
    });
    if (!response.ok) {
      alert(response.error || "Failed to select property");
      return;
    }
    await refreshState();
  }

  async function handleAutofill() {
    if (!state?.selectedPropertyId && state?.properties.length === 0) {
      alert(
        "No properties synced yet.\n\n" +
        "1. Make sure you're logged into AXIS CRM dashboard\n" +
        "2. Click 'Sync from AXIS' to load your properties\n" +
        "3. Select a property, then try autofill again"
      );
      return;
    }

    if (!state?.selectedPropertyId) {
      alert("Please select a property first, then try autofill.");
      return;
    }

    try {
    const response = await sendRuntimeMessage({ type: "AUTOFILL_ACTIVE_TAB" });
    if (!response.ok) {
      const errorMsg = response.error || "Autofill failed";
        // TODO: Replace string matching with error codes from response
        if (errorMsg.includes("Receiving end does not exist")) {
          alert(
            "Content script not loaded.\n\n" +
            "1. Refresh the current page (F5)\n" +
            "2. Make sure you're on a supported site (Zillow, Zameen, or Realtor)\n" +
            "3. Try autofill again"
          );
        } else {
          alert(`Autofill failed: ${errorMsg}`);
        }
      } else {
        alert("Autofill completed! Check the form to verify the data was filled.");
      }
    } catch (error) {
      alert(`Autofill failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  function openDashboard() {
    const url = state?.settings.apiBaseUrl || "https://axis-crm-v1.vercel.app";
    browser.tabs.create({ url });
  }

  function openOptions() {
    browser.runtime.openOptionsPage();
  }

  if (!state) {
    return (
      <div className="app-shell">
        <p>Loading extension state...</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <h2 style={{ margin: "0 0 4px" }}>AXIS CRM Autofill</h2>
          <p style={{ margin: 0, color: "var(--axis-muted)" }}>
            Mirror your dashboard theme and sync your latest property data everywhere.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <SyncButton status={state.status} onClick={handleSync} />
          <button className="button secondary" onClick={openDashboard}>
            Open AXIS
          </button>
          <button className="button secondary" onClick={openOptions}>
            Options
          </button>
        </div>
        {state.error && (
          <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{state.error}</p>
        )}
      </header>

      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Your Properties</h3>
          <small style={{ color: "var(--axis-muted)" }}>
            {state.properties.length} synced
          </small>
        </div>

        {state.properties.length === 0 ? (
          <p style={{ color: "var(--axis-muted)" }}>
            No properties synced yet. Click “Sync from AXIS” after you log into the dashboard.
          </p>
        ) : (
          <div className="property-list">
            {state.properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                active={state.selectedPropertyId === property.id}
                onSelect={() => handleSelect(property.id)}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          className="button"
          disabled={!state.selectedPropertyId}
          onClick={handleAutofill}
        >
          Autofill current site
        </button>
        <p style={{ color: "var(--axis-muted)", margin: 0, fontSize: 12 }}>
          Works on Zillow, Zameen, and Realtor. We upload photos, pricing, amenities, and your
          description so every listing looks on-brand.
        </p>
      </footer>
    </div>
  );
}

