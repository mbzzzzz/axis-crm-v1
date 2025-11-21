# AXIS CRM Browser Extension

The extension mirrors each user’s AXIS dashboard theme and lets them push property inventory to marketplace forms (Zillow, Zameen, Realtor) with a single click.

## Key features

- **Secure sync:** Uses the user’s existing Clerk session to call `/api/properties` and `/api/preferences/theme`. Data never leaves the user’s device and is stored in `chrome.storage.local`.
- **Theme parity:** The popup, options page, and toast components adopt the same card theme the user selected inside AXIS so every surface feels native.
- **Marketplace adapters:** Content scripts map AXIS property fields to each marketplace’s DOM and upload media through DataTransfer when possible.
- **Cross-browser builds:** `manifest.chrome.json` + `manifest.firefox.json` feed the build so we ship CRX and XPI bundles from the same source.

## Development

```bash
cd extensions
npm install
npm run dev       # serves popup/options for local iteration
npm run build     # creates dist/chrome and dist/firefox
npm run package:chrome   # produces a zipped artifact via web-ext
```

During development, load the `dist/chrome` folder as an unpacked extension (or `dist/firefox` via `web-ext run`). The default API base is `https://axis-crm-v1.vercel.app`. Update it in the options page if you use a custom domain.

## Architecture

- `src/background`: service worker that caches properties, themes, user settings, and handles runtime messages.
- `src/popup`: user interface for sync, selection, and autofill trigger.
- `src/options`: configuration + supported sites overview.
- `src/content`: marketplace adapters and toast UX.
- `src/shared`: messaging, storage, TypeScript contracts, and theme helpers shared across entry points.

## Adding new marketplaces

1. Create `src/content/adapters/<site>.ts` implementing the `AutofillAdapter` contract.
2. Append metadata to `src/site-config.ts` for host matching.
3. Register the adapter inside `src/content/index.ts` and add host permissions to both manifest templates.
4. Document selectors and edge cases in this README to keep QA predictable.

