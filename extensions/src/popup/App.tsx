import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { sendRuntimeMessage } from "@axis/shared/messaging";
import type { ExtensionState } from "@axis/shared/types";
import { PropertyCard } from "./components/PropertyCard";
import { SyncButton } from "./components/SyncButton";
import { createThemeCSS } from "@axis/shared/theme";
import { createLead } from "@axis/shared/api-client";
import type { ExtractedLead } from "@axis/shared/leads-extractor";

export default function App() {
  const [state, setState] = useState<ExtensionState | null>(null);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isExtractingLead, setIsExtractingLead] = useState(false);

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
    try {
      const response = await sendRuntimeMessage({ type: "SYNC_DATA" });
      if (!response.ok) {
        const errorCode = response.code;
        const errorMsg = response.error || "Sync failed. Please try again.";
        
        if (errorCode === "NOT_SIGNED_IN" || errorCode === "HTML_RESPONSE") {
          const shouldOpenDashboard = confirm(
            "Not signed in to AXIS CRM.\n\n" +
            "Would you like to open the dashboard to log in?\n\n" +
            "After logging in:\n" +
            "1. Make sure you're on the main dashboard (not tenant portal)\n" +
            "2. Return to this extension\n" +
            "3. Click 'Sync from AXIS' again"
          );
          if (shouldOpenDashboard) {
            openDashboard();
          }
        } else if (errorCode === "NETWORK_ERROR") {
          const shouldOpenDashboard = confirm(
            `${errorMsg}\n\n` +
            "Would you like to open the dashboard to verify it's accessible?"
          );
          if (shouldOpenDashboard) {
            openDashboard();
          }
        } else {
          alert(`Sync failed: ${errorMsg}`);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Sync failed. Please try again.";
      console.error("Sync error:", error);
      alert(`Sync failed: ${errorMsg}\n\nTry:\n1. Opening the dashboard in a new tab\n2. Making sure you're logged in\n3. Syncing again`);
    } finally {
      await refreshState();
    }
  }

  async function handleSelect(propertyId: number) {
    try {
      const response = await sendRuntimeMessage({
        type: "SET_SELECTED_PROPERTY",
        payload: propertyId,
      });
      if (!response.ok) {
        alert(response.error || "Failed to select property");
        return;
      }
      await refreshState();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to select property";
      console.error("Select property error:", error);
      alert(errorMsg);
    }
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

    setIsAutofilling(true);
    try {
      // Get the selected property data
      const selectedProperty = state.properties.find(
        (prop) => prop.id === state.selectedPropertyId
      );

      if (!selectedProperty) {
        alert("Selected property not found. Please select a property again.");
        setIsAutofilling(false);
        return;
      }

      // Get active tab
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (!activeTab?.id) {
        alert("Unable to find active tab. Please try again.");
        setIsAutofilling(false);
        return;
      }

      // Send FILL_FORM message directly to content script with timeout
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Autofill timeout - operation took too long")), 60000); // 60 second timeout
        });

        const messagePromise = browser.tabs.sendMessage(activeTab.id, {
          action: "FILL_FORM",
          payload: {
            property: selectedProperty,
            theme: state.theme,
          },
        });

        const response = await Promise.race([messagePromise, timeoutPromise]) as any;

        if (response?.success === false) {
          alert(`Autofill failed: ${response.error || "Unknown error"}`);
        } else if (response?.success === true || !response?.success) {
          // Success or no explicit success flag (assume success)
          alert("Autofill completed! Check the form to verify the data was filled.");
        }
      } catch (msgError: any) {
        console.error("Direct message failed, trying fallback:", msgError);
        
        // Fallback to background script method if direct message fails
        try {
          const response = await sendRuntimeMessage({ type: "AUTOFILL_ACTIVE_TAB" });
          if (!response.ok) {
            const errorMsg = response.error || "Autofill failed";
            if (errorMsg.includes("Receiving end does not exist") || errorMsg.includes("Could not establish connection")) {
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
        } catch (fallbackError: any) {
          const errorMsg = fallbackError?.message || msgError?.message || "Autofill failed";
          alert(`Autofill failed: ${errorMsg}\n\nPlease refresh the page and try again.`);
        }
      }
    } catch (error) {
      alert(`Autofill failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsAutofilling(false);
    }
  }

  function openListingSite(url: string) {
    browser.tabs.create({ url });
  }
  function openDashboard() {
    const url = state?.settings.apiBaseUrl || "https://axis-crm-v1.vercel.app";
    browser.tabs.create({ url });
  }

  function openOptions() {
    browser.runtime.openOptionsPage();
  }

  async function handleExtractLead() {
    setIsExtractingLead(true);
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (!activeTab?.id) {
        alert("Unable to find active tab. Please try again.");
        setIsExtractingLead(false);
        return;
      }

      // Send EXTRACT_LEAD message to content script
      try {
        const response = await browser.tabs.sendMessage(activeTab.id, {
          action: "EXTRACT_LEAD",
        });

        if (response?.success && response?.lead) {
          const lead = response.lead as ExtractedLead;
          
          // Show confirmation dialog with lead details
          const confirmMessage = `Extracted Lead:\n\n` +
            `Name: ${lead.name}\n` +
            `Phone: ${lead.phone}\n` +
            (lead.email ? `Email: ${lead.email}\n` : '') +
            (lead.preferredLocation ? `Location: ${lead.preferredLocation}\n` : '') +
            (lead.budget ? `Budget: ${lead.budget}\n` : '') +
            `\nSave this lead to AXIS CRM?`;

          if (confirm(confirmMessage)) {
            // Save lead to CRM
            const apiBaseUrl = state?.settings.apiBaseUrl || "https://axis-crm-v1.vercel.app";
            try {
              await createLead(apiBaseUrl, {
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                source: lead.source,
                preferredLocation: lead.preferredLocation,
                budget: lead.budget,
                notes: lead.notes,
              });
              alert("Lead saved to AXIS CRM successfully!");
            } catch (error: any) {
              if (error.status === 401 || error.status === 403) {
                alert("Not signed in. Please log into AXIS CRM dashboard first.");
              } else {
                alert(`Failed to save lead: ${error.message || "Unknown error"}`);
              }
            }
          }
        } else {
          alert(response?.error || "No lead information found on this page.");
        }
      } catch (msgError: any) {
        if (msgError.message?.includes("Receiving end does not exist") || 
            msgError.message?.includes("Could not establish connection")) {
          alert(
              "Content script not loaded.\n\n" +
              "1. Refresh the current page (F5)\n" +
              "2. Make sure you're on a supported property listing page\n" +
              "3. Try extracting lead again"
          );
        } else {
          alert(`Lead extraction failed: ${msgError.message || "Unknown error"}`);
        }
      }
    } catch (error) {
      alert(`Lead extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsExtractingLead(false);
    }
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
        <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
          <button
            className="button"
            disabled={!state.selectedPropertyId || isAutofilling}
            onClick={handleAutofill}
          >
            {isAutofilling ? "Autofilling..." : "Autofill current site"}
          </button>
          <button
            className="button secondary"
            disabled={isExtractingLead}
            onClick={handleExtractLead}
          >
            {isExtractingLead ? "Extracting Lead..." : "Extract Lead from Page"}
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
          <button className="button secondary" onClick={() => openListingSite("https://www.zameen.com/")}>
            Zameen
          </button>
          <button className="button secondary" onClick={() => openListingSite("https://www.zillow.com/")}>
            Zillow
          </button>
          <button className="button secondary" onClick={() => openListingSite("https://www.realtor.com/")}>
            Realtor
          </button>
          <button className="button secondary" onClick={() => openListingSite("https://www.bayut.com/")}>
            Bayut
          </button>
          <button
            className="button secondary"
            onClick={() => openListingSite("https://www.propertyfinder.ae/")}
          >
            Property Finder
          </button>
          <button className="button secondary" onClick={() => openListingSite("https://www.dubizzle.com/")}>
            Dubizzle
          </button>
          <button className="button secondary" onClick={() => openListingSite("https://www.propsearch.ae/")}>
            Propsearch
          </button>
        </div>
        <p style={{ color: "var(--axis-muted)", margin: 0, fontSize: 12 }}>
          Works on Zillow, Zameen, Realtor, Bayut, Property Finder, Dubizzle, and Propsearch. 
          We upload photos, pricing, amenities, and your description so every listing looks on-brand.
        </p>
        <p style={{ color: "var(--axis-muted)", margin: 0, fontSize: 11 }}>
          Extract leads from property listing pages and save them directly to your CRM.
        </p>
      </footer>
    </div>
  );
}

