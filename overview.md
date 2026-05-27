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
    - Manages **Global State** (`units`, `timezone`, `weatherData`, `aqi`).
    - Handles DOM updates (`render()`) and API calls.
    - **Initialization**:
        - Checks Cache -> Tries GPS (with reverse-geocoding, 5-second timeout) -> Tries IP Geolocation -> Defaults to London.
        - Robust fallback chain: If any geolocation fetch or API fails, it transitions smoothly to the next option without blocking the page loader.

### 3. Key Features
- **Persistence & Caching**: Remembers your location and caches the weather data. If the user is offline or the weather API fails, the app renders the cached weather data and displays a clear offline status message (e.g. `Offline (Cached: 14:32)`).
- **Offline Badge Indicator**: When rendering from cached data, a prominent red `Offline` status badge is displayed next to the location display.
- **Contextual Advice & Tips**: Dynamic suggestions based on current weather parameters (heat alerts with 35°C+ hydration warnings, cold spell layers under 10°C, UV/sunscreen warnings, wind alerts, and AQI pollution notifications).
- **Timezone Aware**: Displays the target city's current local time in the header metadata row. The 24-hour forecast timeline also renders consecutive forecast cards starting from the next hour in that city's local timezone.
- **Unit Toggle**: Instant C/F switching.
- **Smart Search**: Autocomplete dropdown for finding cities globally.
- **State Separation**:
    - **Refresh Icon**: Updates *weather data* and air quality in parallel (keeps your city).
    - **Use Current Location**: Explicitly wipes location cache and retries GPS/IP geolocation.

## Technical Decisions & Rationalizations

- **No Build Step**: We use standard ES Modules (`<script type="module">`). This requires a local server (CORS policy) but ensures the code is future-proof and editable without `npm install`.
- **CDN Dependencies**: We trade offline-capability for simplicity. The app requires internet to fetch weather anyway, so loading CSS/Icons from the web is an acceptable trade-off for keeping the repo small.
- **Robust Geolocation & Caching Strategy**:
    1. **Awaited Fallback Chain**: Geolocation is resolved sequentially (`Browser GPS` $\rightarrow$ `IP API` $\rightarrow$ `Default Coordinates`). Each step is properly `await`-ed, ensuring errors flow to the next step.
    2. **5-Second GPS Timeout**: Reduced the geolocation wait window to `5000ms`. If the user leaves the browser request prompt unanswered or GPS acquisition is delayed, the app transitions to the IP lookup fallback.
    3. **Adblocker / Tracker Resiliency**: Privacy extensions block IP geolocation endpoints (`ipapi.co`) and reverse-geocoders (`bigdatacloud.net`). The fallback chain treats failed fetch requests and invalid payloads as silent catch signals to transition to the default coordinates (London).
    4. **Offline Caching**: In addition to saving the last location, successful weather payloads, timezones, and air quality index parameters are cached in `localStorage`. If the browser loses network connection or the weather API fails, the application restores the last successfully loaded weather data and notifies the user with a status indicator (e.g. `Offline (Cached: 20:30)`).
- **Parallel Data Fetching**: Utilizes `Promise.all` to fetch weather data and air quality indicators (AQI) concurrently. If the air quality API fails or is blocked, it resolves to `null` silently, preventing any app crash.
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
