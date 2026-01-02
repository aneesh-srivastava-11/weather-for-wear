# Project Overview: Weather for Wear

## Philosophy
"Weather for Wear" is a **Decision-First** weather application. Unlike traditional apps that display raw data (Temperature, Humidity), this app processes that data to answer the user's primary question: *"What should I wear?"*

It is built to be **Lightweight** (no build tools, run-anywhere) and **Robust** (multiple fallback strategies).

## Architecture

### 1. The Frontend (The View)
- **`index.html`**: The single-page interface.
    - Uses **Tailwind CSS** (via CDN).
    - Uses **Phosphor Icons** (via CDN).
- **`tests.html`**: A browser-based Test Harness for TDD verification.

### 2. The Logic (The Modular Brain)
The application is now split into Controller and Library:

- **`js/logic.js` (The Library)**:
    - Pure, stateless functions.
    - Handles Unit Conversion, WMO Icon Mapping, Timezone Formatting, and the "Warmth Score" algorithm.
    - **Testable**: Verified by `tests.html`.

- **`app.js` (The Controller)**:
    - Imports `logic.js`.
    - Manages **Global State** (`units`, `timezone`, `weatherData`).
    - Handles DOM updates (`render()`) and API calls.
    - **Initialization**:
        - Checks Cache -> Tries GPS -> Tries IP -> Defaults to London.

### 3. Key Features
- **Persistence**: Remembers your city.
- **Timezone Aware**: Timeline shows the *local* time of the target city (e.g., viewing Tokyo from NY shows Tokyo time).
- **Unit Toggle**: Instant C/F switching.
- **Smart Search**: Autocomplete for global cities.
- **State Separation**: explicit "Refresh" vs "Re-Locate" actions.

### 3. Key Features
- **Persistence**: Remembers your city across reloads using `localStorage`.
- **Smart Search**: Autocomplete dropdown for finding cities globally.
- **Timeline**: `generateTimeline` forecasts clothing needs for the next 12 hours (e.g., "8 PM: Hoodie").
- **State Separation**:
    - **Refresh Icon**: Updates *weather data* only (keeps your city).
    - **Use Current Location**: Explicitly wipes cache and retries GPS/IP geolocation.

## Technical Decisions & Rationalizations

- **No Build Step**: We use standard ES Modules (`<script type="module">`). This requires a local server (CORS policy) but ensures the code is future-proof and editable without `npm install`.
- **CDN Dependencies**: We trade offline-capability for simplicity. The app requires internet to fetch weather anyway, so loading CSS/Icons from the web is an acceptable trade-off for keeping the repo small.
- **Robust Error Handling**: The app assumes APIs *will* fail. Every `fetch` is wrapped in `try/catch` with UI updates to inform the user (e.g., "Offline?").

## Directory Structure
```
/
├── index.html  # Entry point
├── app.js      # All logic
├── style.css   # Minimal overrides (Fonts, Scrollbars)
├── gemini.md   # Agentic Context
└── overview.md # This file (Architecture & Learning)
```
