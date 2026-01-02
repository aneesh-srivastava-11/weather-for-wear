# Strategic Roadmap & Engineering Plan

## 1. Critical "Dogwater" Fixes
These are functional issues that degrade the core value proposition.

### 1.1 Timezone Synchronization
*   **Problem:** Currently, the "Timeline" displays future hours based on the *browser's* clock, not the *target location's* local time. If a user in India checks London weather, they might see "Night" weather labeled as "2 PM".
*   **Solution:**
    *   Update Open-Meteo API call to include `&timezone=auto` or explicitly request the location's timezone.
    *   Parse the returned time strings (ISO 8601) strictly in the context of that timezone.
    *   Display a "Local Time" clock for the target city.

### 1.2 Unit Agnosticism (C/F)
*   **Problem:** Hardcoded Celsius excludes US/Liberia/Myanmar users.
*   **Solution:**
    *   Add a Global Toggle (State: `units: 'metric' | 'imperial'`).
    *   **Implementation:** Keep logic in Celsius (standard), only convert at the *render* step.
    *   Formula: `(C * 9/5) + 32`.

### 1.3 Weather Icon Accuracy
*   **Problem:** We currently use a crude `if (rain > 50)` check.
*   **Solution:** Open-Meteo returns a WMO `weather_code` (0-99).
    *   Create a robust mapping table:
        *   `0`: Clear (`ph-sun`)
        *   `1-3`: Cloudy (`ph-cloud`)
        *   `45, 48`: Fog (`ph-cloud-fog`)
        *   `61-67`: Rain (`ph-cloud-rain`)
        *   `71-77`: Snow (`ph-snowflake`)
        *   `95-99`: Thunderstorm (`ph-cloud-lightning`)

## 2. Architectural Refactoring
The `app.js` monolith is approaching unmaintainability (~350 lines).

### 2.1 Separation of Concerns (Proposed File Structure)
*   `js/api.js`: Pure functions for `fetch`. No DOM code.
*   `js/logic.js`: Pure functions for `calculateWarmthScore`, `getClothingVerdict`.
*   `js/state.js`: A simple State Store with subscription (Observer pattern).
*   `js/ui.js`: DOM manipulation, Event Listeners.
*   `app.js`: The "Glue" that initializes everything.

### 2.2 Robust State Management
*   Current: `let state = { ... }` (Global mutable).
*   Proposed:
    ```javascript
    const store = createStore({ lat: ..., status: 'IDLE' });
    store.subscribe((newState) => updateUI(newState));
    ```
    This ensures the UI *always* matches the data, preventing "stale" displays.

## 3. UX/UI Polish (The "Aesthetic" Goal)

### 3.1 Loading Skeletons
*   Replace text "Loading..." with a CSS "Shimmer" effect on the temperature/verdict blocks.
*   Prevents layout shift (CLS) when data loads.

### 3.2 Error Boundaries
*   If the API fails, show a "Retry" button in the center of the screen, not just a console log or small status text.
*   Handle "Zero Results" for city search gracefully.

### 3.3 Visual Feedback
*   Add a subtle animation (fade-in) when weather data updates.
*   Highlight the "Current Hour" in the timeline.

## 4. USP Expansion: "Personalized Decisions"

### 4.1 "I Run Hot/Cold" Slider
*   **Concept:** People perceive cold differently.
*   **UI:** A simple slider in settings [-2 (I freeze easily) ... 0 (Normal) ... +2 (I'm always hot)].
*   **Logic:** Adjust the `calculateWarmthScore` baseline by this offset.

### 4.2 Offline Mode (PWA)
*   **Goal:** App should load the *last known* weather even without internet.
*   **Tech:** Service Worker to cache `index.html`, `style.css`, and the last API response.

## Immediate Next Steps (Upon User Return)
1.  **Execute Fix 1.1 (Timezones):** This is the most confusing bug for a travel-ready app.
2.  **Execute Fix 1.3 (Icons):** Low effort, high visual impact.
3.  **Execute Fix 1.2 (Units):** Essential for broader appeal.
